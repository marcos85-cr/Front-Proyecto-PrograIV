import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerPaymentsService } from '../../../services/customer-payments.service';
import { PagoListaDto } from '../../../model/payment.model';

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class PaymentHistoryComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  payments = signal<PagoListaDto[]>([]);
  filteredPayments = signal<PagoListaDto[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);

  constructor(
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private paymentsService: CustomerPaymentsService
  ) {}

  ngOnInit() {
    // Inicialización
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    this.loadPayments();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.payments.set([]);
    this.filteredPayments.set([]);
    this.searchTerm.set('');
    this.isLoading.set(false);
  }

  loadPayments(): void {
    this.isLoading.set(true);
    this.paymentsService.getMyPayments().subscribe({
      next: (response) => {
        if (response.success) {
          this.payments.set(response.data || []);
          this.filterPayments();
        } else {
          this.toastService.warning(response.message || 'Error al cargar pagos');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar pagos');
        this.isLoading.set(false);
      }
    });
  }

  filterPayments(): void {
    const term = this.searchTerm().trim().toLowerCase();

    let filtered = this.payments();

    if (term) {
      filtered = filtered.filter(p =>
        (p.proveedor?.toLowerCase().includes(term) || false) ||
        (p.numeroContrato?.toLowerCase().includes(term) || false) ||
        p.monto.toString().includes(term)
      );
    }

    this.filteredPayments.set(filtered);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterPayments();
  }

  goToDetail(paymentId: number): void {
    this.router.navigate(['/customer/pagos', paymentId]);
  }

  goToNewPayment(): void {
    this.router.navigate(['/customer/pagos/realizar']);
  }

  handleRefresh(event: any): void {
    this.loadPayments();
    event.target.complete();
  }

  goBack(): void {
    this.location.back();
  }

  formatCurrency(amount: number, currency: string = 'CRC'): string {
    const symbol = currency === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Exitoso': return 'success';
      case 'Pendiente': return 'warning';
      case 'Programado': return 'primary';
      case 'Fallido': return 'danger';
      default: return 'medium';
    }
  }

  getProviderIcon(provider: string | undefined): string {
    const name = provider?.toLowerCase() || '';
    if (name.includes('electric') || name.includes('ice') || name.includes('cnfl')) {
      return 'flash-outline';
    }
    if (name.includes('agua') || name.includes('aya')) {
      return 'water-outline';
    }
    if (name.includes('telefon') || name.includes('kolbi') || name.includes('claro')) {
      return 'call-outline';
    }
    if (name.includes('internet') || name.includes('tigo')) {
      return 'wifi-outline';
    }
    return 'receipt-outline';
  }
}
