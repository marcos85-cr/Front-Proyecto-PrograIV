import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { catchError, finalize, tap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { GestorService } from '../../../../services/gestor.service';
import { ToastService } from '../../../../services/toast.service';
import { OperacionGestor, OperacionFilters } from '../../../../shared/models/gestor.model';

@Component({
  selector: 'app-operaciones-list',
  templateUrl: './operaciones-list.component.html',
  styleUrls: ['./operaciones-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, FormsModule],
})
export class OperacionesListComponent implements OnInit {
  operaciones = signal<OperacionGestor[]>([]);
  filteredOperaciones = signal<OperacionGestor[]>([]);
  isLoading = signal(false);
  summary = signal({ pending: 0, approved: 0, rejected: 0 });
  activeFilters = signal<OperacionFilters>({});
  searchForm: FormGroup;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  hasOperaciones = computed(() => this.filteredOperaciones().length > 0);
  hasFilters = computed(() => Object.keys(this.activeFilters()).length > 0);

  constructor(
    private gestorService: GestorService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastService: ToastService,
    private alertController: AlertController
  ) {
    this.searchForm = this.fb.group({ searchTerm: [''] });
  }

  ngOnInit() {
    this.loadOperaciones();
    this.setupSearch();
    this.checkRouteParams();
  }

  setupSearch() {
    this.searchForm.get('searchTerm')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => this.filterOperaciones(term));
  }

  checkRouteParams() {
    this.route.queryParams.subscribe(params => {
      if (params['clienteId']) {
        const filters = { ...this.activeFilters(), clienteId: +params['clienteId'] };
        this.activeFilters.set(filters);
        this.loadOperaciones(filters);
      }
    });
  }

  loadOperaciones(filters?: OperacionFilters) {
    this.isLoading.set(true);
    this.gestorService.getOperaciones(filters).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.operaciones.set(response.data.data);
          this.filteredOperaciones.set(response.data.data);
          this.summary.set(response.data.summary);
          if (filters) this.activeFilters.set(filters);
        }
      }),
      catchError(() => {
        this.toastService.error('Error al cargar operaciones');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  filterOperaciones(term: string) {
    let operaciones = this.operaciones();
    const estadoFilter = this.activeFilters().estado;

    if (estadoFilter) {
      operaciones = operaciones.filter(op => op.estado === estadoFilter);
    }

    if (!term.trim()) {
      this.filteredOperaciones.set(operaciones);
      return;
    }

    const filtered = operaciones.filter(op =>
      op.clienteNombre.toLowerCase().includes(term.toLowerCase()) ||
      op.tipo?.toLowerCase().includes(term.toLowerCase()) ||
      op.descripcion?.toLowerCase().includes(term.toLowerCase()) ||
      op.moneda?.toLowerCase().includes(term.toLowerCase()) ||
      op.cuentaOrigenNumero?.includes(term) ||
      op.cuentaDestinoNumero?.includes(term)
    );
    this.filteredOperaciones.set(filtered);
  }

  onSearch(event: any) {
    this.filterOperaciones(event.target.value);
  }

  filterByEstado(estado: any) {
    this.activeFilters.set(estado ? { estado } : {});
    const searchTerm = this.searchForm.get('searchTerm')?.value || '';
    this.filterOperaciones(searchTerm);
  }

  clearFilters() {
    this.activeFilters.set({});
    this.searchForm.get('searchTerm')?.setValue('');
    this.filteredOperaciones.set(this.operaciones());
  }

  viewOperacionDetail(operacion: OperacionGestor) {
    this.router.navigate([`/manager/operations/${operacion.id}`]);
  }

  approveOperation(operacion: OperacionGestor) {
    if (!this.gestorService.puedeAprobarOperacion(operacion.monto, operacion.moneda)) {
      this.toastService.error(this.gestorService.getMensajeLimiteExcedido(operacion.monto, operacion.moneda));
      return;
    }
    this.showApproveConfirmation(operacion);
  }

  private async showApproveConfirmation(operacion: OperacionGestor) {
    const alert = await this.alertController.create({
      header: 'Aprobar Operación',
      message: `
        <div style="text-align: left;">
          <p><strong>Cliente:</strong> ${operacion.clienteNombre}</p>
          <p><strong>Tipo:</strong> ${operacion.tipo}</p>
          <p><strong>Monto:</strong> ${this.formatCurrency(operacion.monto, operacion.moneda)}</p>
          <p><strong>Descripción:</strong> ${operacion.descripcion || 'Sin descripción'}</p>
          <br><p>¿Desea aprobar esta operación?</p>
        </div>
      `,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Aprobar', handler: () => { this.executeApprove(operacion.id); return true; } }
      ]
    });
    await alert.present();
  }

  private executeApprove(operationId: number) {
    this.gestorService.aprobarOperacion(operationId).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Operación aprobada exitosamente');
          this.loadOperaciones();
        } else {
          this.toastService.error(response.message || 'Error al aprobar la operación');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al aprobar la operación');
        return EMPTY;
      })
    ).subscribe();
  }

  rejectOperation(operacion: OperacionGestor) {
    this.showRejectConfirmation(operacion);
  }

  private async showRejectConfirmation(operacion: OperacionGestor) {
    const alert = await this.alertController.create({
      header: 'Rechazar Operación',
      inputs: [{
        name: 'razon',
        type: 'textarea',
        placeholder: 'Ingrese la razón del rechazo...',
        attributes: { minlength: 10, required: true }
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: (data) => {
            if (data.razon?.trim().length >= 10) {
              this.executeReject(operacion.id, data.razon.trim());
              return true;
            }
            this.toastService.warning('La razón debe tener al menos 10 caracteres');
            return false;
          }
        }
      ]
    });
    await alert.present();
  }

  private executeReject(operationId: number, razon: string) {
    this.gestorService.rechazarOperacion(operationId, razon).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Operación rechazada exitosamente');
          this.loadOperaciones();
        } else {
          this.toastService.error(response.message || 'Error al rechazar la operación');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al rechazar la operación');
        return EMPTY;
      })
    ).subscribe();
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'CRC' ? '₡' : '$';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  formatDateTime(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      exitosa: 'success', pendienteaprobacion: 'warning', rechazada: 'danger', cancelada: 'medium'
    };
    return colors[estado?.toLowerCase()] || 'primary';
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      exitosa: 'Exitosa', pendienteaprobacion: 'Pendiente', rechazada: 'Rechazada', cancelada: 'Cancelada'
    };
    return labels[estado?.toLowerCase()] || estado;
  }

  goBack() {
    this.router.navigate(['/manager/dashboard']);
  }

  refresh(event: any) {
    this.loadOperaciones(this.activeFilters());
    event.target.complete();
  }

  puedeAprobarOperacion(monto: number, moneda: string): boolean {
    return this.gestorService.puedeAprobarOperacion(monto, moneda);
  }
}
