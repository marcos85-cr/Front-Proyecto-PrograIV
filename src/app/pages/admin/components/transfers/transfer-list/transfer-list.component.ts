import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { Router } from '@angular/router';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../../../services/toast.service';

interface TransferenciaPendiente {
  id: number;
  clienteNombre: string;
  tipo: string;
  monto: number;
  moneda: string;
  descripcion?: string;
  estado: string;
  fechaCreacion: Date;
  cuentaOrigenNumero?: string;
  cuentaDestinoNumero?: string;
  requiereAprobacion: boolean;
}

@Component({
  selector: 'app-transfer-list',
  templateUrl: './transfer-list.component.html',
  styleUrls: ['./transfer-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class TransferListComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  transferencias = signal<TransferenciaPendiente[]>([]);
  filteredTransferencias = signal<TransferenciaPendiente[]>([]);
  isLoading = signal(false);
  estadoFilter = signal<string>('PendienteAprobacion');

  constructor(
    private adminService: AdminService,
    private router: Router,
    private toastService: ToastService,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    // Only initialization
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    this.loadTransferencias();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.transferencias.set([]);
    this.filteredTransferencias.set([]);
    this.isLoading.set(false);
  }

  loadTransferencias() {
    this.isLoading.set(true);
    this.loadPendingTransfers();
  }

  private loadPendingTransfers(): void {
    this.adminService.getPendingTransfers().pipe(
      tap(response => {
        if (response.success && response.data) {
          this.transferencias.set(response.data);
          this.filteredTransferencias.set(response.data);
        }
      }),
      catchError(() => {
        this.toastService.error('Error al cargar transferencias pendientes');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  filterByEstado(estado: string) {
    this.estadoFilter.set(estado);
    const all = this.transferencias();
    if (estado === 'todos') {
      this.filteredTransferencias.set(all);
    } else {
      this.filteredTransferencias.set(all.filter(t => t.estado === estado));
    }
  }

  async aprobarTransferencia(transferencia: TransferenciaPendiente) {
    const alert = await this.alertController.create({
      header: 'Aprobar Transferencia',
      message: `Cliente: ${transferencia.clienteNombre}\n\nTipo: ${transferencia.tipo}\n\nMonto: ${this.formatCurrency(transferencia.monto, transferencia.moneda)}\n\nDescripción: ${transferencia.descripcion || 'Sin descripción'}\n\n¿Desea aprobar esta transferencia?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aprobar',
          handler: () => {
            this.executeAprobar(transferencia.id);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private executeAprobar(id: number) {
    this.adminService.aprobarTransferencia(id).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Transferencia aprobada exitosamente');
          this.loadTransferencias();
        } else {
          this.toastService.error(response.message || 'Error al aprobar la transferencia');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al aprobar la transferencia');
        return EMPTY;
      })
    ).subscribe();
  }

  async rechazarTransferencia(transferencia: TransferenciaPendiente) {
    const alert = await this.alertController.create({
      header: 'Rechazar Transferencia',
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
              this.executeRechazar(transferencia.id, data.razon.trim());
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

  private executeRechazar(id: number, razon: string) {
    this.adminService.rechazarTransferencia(id, razon).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Transferencia rechazada exitosamente');
          this.loadTransferencias();
        } else {
          this.toastService.error(response.message || 'Error al rechazar la transferencia');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al rechazar la transferencia');
        return EMPTY;
      })
    ).subscribe();
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'CRC' ? '₡' : '$';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      exitosa: 'success',
      pendienteaprobacion: 'warning',
      programada: 'primary',
      rechazada: 'danger',
      cancelada: 'medium'
    };
    return colors[estado?.toLowerCase()] || 'primary';
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      exitosa: 'Exitosa',
      pendienteaprobacion: 'Pendiente',
      programada: 'Programada',
      rechazada: 'Rechazada',
      cancelada: 'Cancelada'
    };
    return labels[estado?.toLowerCase()] || estado;
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }

  refresh(event: any) {
    this.loadTransferencias();
    event.target.complete();
  }
}
