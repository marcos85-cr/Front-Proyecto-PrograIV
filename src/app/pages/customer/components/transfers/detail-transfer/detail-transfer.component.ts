import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Location } from '@angular/common';

import { CustomerTransfersService } from '../../../services/customer-transfers.service';
import { ToastService } from '../../../../../services/toast.service';
import { TransferenciaTransaccionDetalleDto } from '../../../model/transfer.model';

@Component({
  selector: 'app-detail-transfer',
  templateUrl: './detail-transfer.component.html',
  styleUrls: ['./detail-transfer.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DetailTransferComponent implements OnInit {
  transferId: number | null = null;
  transfer = signal<TransferenciaTransaccionDetalleDto | null>(null);
  isLoading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private transfersService: CustomerTransfersService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.transferId = parseInt(id, 10);
      this.loadTransferDetail();
    } else {
      this.toastService.error('ID de transferencia no válido');
      this.goBack();
    }
  }

  loadTransferDetail(): void {
    if (!this.transferId) return;

    this.isLoading.set(true);
    this.transfersService.getTransferById(this.transferId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.transfer.set(response.data);
        } else {
          this.toastService.error(response.message || 'Error al cargar detalle de transferencia');
          this.goBack();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar detalle de transferencia:', error);
        this.toastService.error('Error al cargar detalle de transferencia');
        this.isLoading.set(false);
        this.goBack();
      }
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Exitosa': return 'success';
      case 'Fallida': return 'danger';
      case 'PendienteAprobacion': return 'warning';
      case 'Programada': return 'medium';
      case 'Cancelada': return 'medium';
      default: return 'medium';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'Exitosa': return 'checkmark-circle';
      case 'Fallida': return 'close-circle';
      case 'PendienteAprobacion': return 'time';
      case 'Programada': return 'calendar';
      case 'Cancelada': return 'ban';
      default: return 'help-circle';
    }
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  formatDateTime(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.location.back();
  }

  retryTransfer(): void {
    const transfer = this.transfer();
    if (transfer && transfer.estado === 'Fallida') {
      this.router.navigate(['/customer/transferencias/nueva'], {
        queryParams: {
          cuentaDestino: transfer.cuentaDestinoNumero,
          monto: transfer.monto,
          moneda: transfer.moneda
        }
      });
    }
  }
}
