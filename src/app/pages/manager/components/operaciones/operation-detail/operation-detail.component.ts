import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { GestorService } from '../../../../../services/gestor.service';
import { ToastService } from '../../../../../services/toast.service';
import { OperacionDetalle } from '../../../../../shared/models/gestor.model';

@Component({
  selector: 'app-operation-detail',
  templateUrl: './operation-detail.component.html',
  styleUrls: ['./operation-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class OperationDetailComponent implements OnInit {
  operacion = signal<OperacionDetalle | null>(null);
  isLoading = signal(false);
  operationId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gestorService: GestorService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.operationId = +params['id'];
      if (this.operationId) {
        this.loadOperacion();
      }
    });
  }

  loadOperacion() {
    this.isLoading.set(true);

    this.gestorService.getOperacionDetalle(this.operationId).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.operacion.set(response.data);
        } else {
          this.toastService.error(response.message || 'Error al cargar la operación');
        }
      }),
      catchError(error => {
        console.error('Error loading operation:', error);
        this.toastService.error('Error al cargar la operación');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'CRC' ? '₡' : '$';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  getTipoIcon(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'transferencia':
        return 'swap-horizontal-outline';
      case 'deposito':
        return 'arrow-down-outline';
      case 'retiro':
        return 'arrow-up-outline';
      case 'pago':
      case 'pagoservicio':
        return 'card-outline';
      default:
        return 'cash-outline';
    }
  }

  puedeAprobar(): boolean {
    const op = this.operacion();
    if (!op || op.estado !== 'PendienteAprobacion') return false;
    return this.gestorService.puedeAprobarOperacion(op.monto, op.moneda);
  }

  isPendiente(): boolean {
    return this.operacion()?.estado === 'PendienteAprobacion';
  }

  async approveOperation() {
    const op = this.operacion();
    if (!op) return;

    if (!this.gestorService.puedeAprobarOperacion(op.monto, op.moneda)) {
      const message = this.gestorService.getMensajeLimiteExcedido(op.monto, op.moneda);
      this.toastService.error(message);
      return;
    }

    const alert = await this.alertController.create({
      header: 'Aprobar Operación',
      message: `¿Está seguro de aprobar esta operación de ${this.formatCurrency(op.monto, op.moneda)}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aprobar',
          handler: () => {
            this.executeApprove();
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private executeApprove() {
    this.gestorService.aprobarOperacion(this.operationId).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Operación aprobada exitosamente');
          this.loadOperacion();
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

  async rejectOperation() {
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
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: (data) => {
            if (data.razon && data.razon.trim().length >= 10) {
              this.executeReject(data.razon.trim());
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

  private executeReject(razon: string) {
    this.gestorService.rechazarOperacion(this.operationId, razon).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Operación rechazada');
          this.loadOperacion();
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

  goBack() {
    this.router.navigate(['/manager/operations']);
  }
}
