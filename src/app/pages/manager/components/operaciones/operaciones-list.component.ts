import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { GestorService } from '../../../../services/gestor.service';
import { ToastService } from '../../../../services/toast.service';
import { AlertController, LoadingController } from '@ionic/angular';

import {
  OperacionGestor,
  OperacionDetalle,
  OperacionesResponse,
  OperacionFilters,
  Result
} from '../../../../shared/models/gestor.model';

@Component({
  selector: 'app-operaciones-list',
  templateUrl: './operaciones-list.component.html',
  styleUrls: ['./operaciones-list.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class OperacionesListComponent implements OnInit {
  // Signals
  operaciones = signal<OperacionGestor[]>([]);
  filteredOperaciones = signal<OperacionGestor[]>([]);
  isLoading = signal(false);

  // Summary stats
  summary = signal({
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Active filters
  activeFilters = signal<OperacionFilters>({});

  // Search
  searchForm: FormGroup;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Computed properties
  hasOperaciones = computed(() => this.filteredOperaciones().length > 0);
  hasFilters = computed(() => Object.keys(this.activeFilters()).length > 0);

  constructor(
    private gestorService: GestorService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
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
    ).subscribe(term => {
      this.filterOperaciones(term);
    });
  }

  checkRouteParams() {
    // Check for clienteId filter from query params
    this.route.queryParams.subscribe(params => {
      if (params['clienteId']) {
        const filters = { ...this.activeFilters(), clienteId: +params['clienteId'] };
        this.activeFilters.set(filters);
        this.loadOperacionesWithFilters(filters);
      }
    });
  }

  loadOperaciones(filters?: OperacionFilters) {
    this.isLoading.set(true);

    this.gestorService.getOperaciones(filters).pipe(
      tap(response => {
        if (response.success && response.data) {
          const operacionesData = response.data;
          this.operaciones.set(operacionesData.data);
          this.filteredOperaciones.set(operacionesData.data);
          this.summary.set(operacionesData.summary);
          if (filters) {
            this.activeFilters.set(filters);
          }
        }
      }),
      catchError(error => {
        console.error('Error loading operaciones:', error);
        this.toastService.error('Error al cargar operaciones');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  loadOperacionesWithFilters(filters: OperacionFilters) {
    this.loadOperaciones(filters);
  }

  filterOperaciones(term: string) {
    let operaciones = this.operaciones();

    // Aplicar filtro de estado si existe
    const estadoFilter = this.activeFilters().estado;
    if (estadoFilter) {
      operaciones = operaciones.filter(op => op.estado === estadoFilter);
    }

    // Aplicar búsqueda de texto
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
    const term = event.target.value;
    this.filterOperaciones(term);
  }

  async viewOperacionDetail(operacion: OperacionGestor) {
    // Navigate to operation detail or show modal
    this.router.navigate([`/manager/operations/${operacion.id}`]);
  }

  approveOperation(operacion: OperacionGestor) {
    // Check if gestor can approve this operation
    if (!this.gestorService.puedeAprobarOperacion(operacion.monto, operacion.moneda)) {
      const message = this.gestorService.getMensajeLimiteExcedido(operacion.monto, operacion.moneda);
      this.toastService.error(message);
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
          <br>
          <p>¿Desea aprobar esta operación?</p>
        </div>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aprobar',
          handler: () => {
            this.executeApprove(operacion.id);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private executeApprove(operationId: number) {
    this.gestorService.aprobarOperacion(operationId).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Operación aprobada exitosamente');
          this.loadOperaciones(); // Reload list
        } else {
          this.toastService.error(response.message || 'Error al aprobar la operación');
        }
      }),
      catchError(error => {
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
      inputs: [
        {
          name: 'razon',
          type: 'textarea',
          placeholder: 'Ingrese la razón del rechazo...',
          attributes: {
            minlength: 10,
            required: true
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: (data) => {
            if (data.razon && data.razon.trim().length >= 10) {
              this.executeReject(operacion.id, data.razon.trim());
              return true;
            } else {
              this.toastService.warning('La razón debe tener al menos 10 caracteres');
              return false;
            }
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
          this.loadOperaciones(); // Reload list
        } else {
          this.toastService.error(response.message || 'Error al rechazar la operación');
        }
      }),
      catchError(error => {
        this.toastService.error('Error al rechazar la operación');
        return EMPTY;
      })
    ).subscribe();
  }

  // Filter methods - Filtrado local sin petición al API
  filterByEstado(estado: any) {
    if (!estado || estado === '') {
      this.activeFilters.set({});
    } else {
      this.activeFilters.set({ estado });
    }

    // Re-aplicar filtros con el término de búsqueda actual
    const searchTerm = this.searchForm.get('searchTerm')?.value || '';
    this.filterOperaciones(searchTerm);
  }

  clearFilters() {
    this.activeFilters.set({});
    this.searchForm.get('searchTerm')?.setValue('');
    this.filteredOperaciones.set(this.operaciones());
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'CRC' ? '₡' : '$';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  formatDateTime(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'exitosa':
        return 'success';
      case 'pendienteaprobacion':
        return 'warning';
      case 'rechazada':
        return 'danger';
      case 'cancelada':
        return 'medium';
      default:
        return 'primary';
    }
  }

  getTipoColor(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'transferencia':
        return 'primary';
      case 'deposito':
        return 'success';
      case 'retiro':
        return 'warning';
      case 'pago':
        return 'secondary';
      default:
        return 'medium';
    }
  }

  // Stats methods
  getEstadoLabel(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'exitosa':
        return 'Exitosa';
      case 'pendienteaprobacion':
        return 'Pendiente';
      case 'rechazada':
        return 'Rechazada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return estado;
    }
  }

  // Go back
  goBack() {
    this.router.navigate(['/manager/dashboard']);
  }

  goToDashboard() {
    this.router.navigate(['/manager/dashboard']);
  }

  // Refresh
  refresh(event: any) {
    this.loadOperaciones(this.activeFilters());
    event.target.complete();
  }

  // Helper methods for template
  puedeAprobarOperacion(monto: number, moneda: string): boolean {
    return this.gestorService.puedeAprobarOperacion(monto, moneda);
  }

  getMensajeLimiteExcedido(monto: number, moneda: string): string {
    return this.gestorService.getMensajeLimiteExcedido(monto, moneda);
  }
}
