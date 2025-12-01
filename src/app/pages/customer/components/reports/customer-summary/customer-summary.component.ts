import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerReportsService } from '../../../services/customer-reports.service';
import { ResumenClienteDto } from '../../../model/report.model';

@Component({
  selector: 'app-customer-summary',
  templateUrl: './customer-summary.component.html',
  styleUrls: ['./customer-summary.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CustomerSummaryComponent implements OnInit {
  summary = signal<ResumenClienteDto | null>(null);
  isLoading = signal(false);

  constructor(
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private reportsService: CustomerReportsService
  ) {}

  ngOnInit() {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading.set(true);
    this.reportsService.getCustomerSummary().subscribe({
      next: (response) => {
        if (response.success) {
          this.summary.set(response.data || null);
        } else {
          this.toastService.error(response.message || 'Error al cargar resumen');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar resumen');
        this.isLoading.set(false);
      }
    });
  }

  handleRefresh(event: any): void {
    this.loadSummary();
    event.target.complete();
  }

  goToAccount(accountId: number): void {
    this.router.navigate(['/customer/cuentas', accountId]);
  }

  goToStatement(accountId: number): void {
    this.router.navigate(['/customer/reportes/extracto', accountId]);
  }

  goBack(): void {
    this.location.back();
  }

  formatCurrency(amount: number | undefined, moneda: string = 'CRC'): string {
    if (amount === undefined) return '-';
    const symbol = moneda === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
