import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerTransfersService } from '../../../services/customer-transfers.service';
import { TransferenciaTransaccionListaDto } from '../../../model/transfer.model';

@Component({
  selector: 'app-transfer-history',
  templateUrl: './transfer-history.component.html',
  styleUrls: ['./transfer-history.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class TransferHistoryComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  transfers = signal<TransferenciaTransaccionListaDto[]>([]);
  filteredTransfers = signal<TransferenciaTransaccionListaDto[]>([]);
  searchTerm = signal('');
  statusFilter = signal('todos');
  isLoading = signal(false);

  constructor(
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private transfersService: CustomerTransfersService
  ) {}

  ngOnInit() {
    // Inicialización
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    this.loadTransfers();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.transfers.set([]);
    this.filteredTransfers.set([]);
    this.searchTerm.set('');
    this.statusFilter.set('todos');
    this.isLoading.set(false);
  }

  loadTransfers(): void {
    this.isLoading.set(true);
    this.transfersService.getMyTransfers().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.transfers.set(response.data || []);
          this.filterTransfers();
        } else {
          this.toastService.warning(response.message || 'Error al cargar transferencias');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar transferencias');
        this.isLoading.set(false);
      }
    });
  }

  filterTransfers(): void {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    let filtered = this.transfers();

    // Filtrar por estado
    if (status !== 'todos') {
      filtered = filtered.filter(t => t.estado === status);
    }

    // Filtrar por término de búsqueda
    if (term) {
      filtered = filtered.filter(t =>
        (t.descripcion?.toLowerCase().includes(term) || false) ||
        (t.comprobanteReferencia?.toLowerCase().includes(term) || false) ||
        t.monto.toString().includes(term)
      );
    }

    this.filteredTransfers.set(filtered);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('todos');
    this.filterTransfers();
  }

  goToDetail(transferId: number): void {
    this.router.navigate(['/customer/transferencias', transferId]);
  }

  goToNewTransfer(): void {
    this.router.navigate(['/customer/transferencias/nueva']);
  }

  handleRefresh(event: any): void {
    this.loadTransfers();
    event.target.complete();
  }

  goBack(): void {
    this.location.back();
  }

  formatCurrency(amount: number, currency: string): string {
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
      case 'Exitosa': return 'success';
      case 'PendienteAprobacion': return 'warning';
      case 'Programada': return 'primary';
      case 'Fallida': return 'danger';
      case 'Cancelada': return 'medium';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PendienteAprobacion': return 'Pendiente';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Exitosa': return 'checkmark-circle-outline';
      case 'PendienteAprobacion': return 'time-outline';
      case 'Programada': return 'calendar-outline';
      case 'Fallida': return 'close-circle-outline';
      case 'Cancelada': return 'ban-outline';
      default: return 'help-circle-outline';
    }
  }
}
