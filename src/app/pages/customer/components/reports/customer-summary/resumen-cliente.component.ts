import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { ReportesClienteService } from '../../../services/reportes-cliente.service';
import { ResumenClienteDto } from '../../../model/reporte.model';

@Component({
  selector: 'app-resumen-cliente',
  templateUrl: './resumen-cliente.component.html',
  styleUrls: ['./resumen-cliente.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ResumenClienteComponent implements OnInit {
  resumen = signal<ResumenClienteDto | null>(null);
  isLoading = signal(false);

  constructor(
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private reportesService: ReportesClienteService
  ) {}

  ngOnInit() {
    this.loadResumen();
  }

  loadResumen(): void {
    this.isLoading.set(true);
    this.reportesService.getResumenCliente().subscribe({
      next: (response) => {
        if (response.success) {
          this.resumen.set(response.data || null);
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
    this.loadResumen();
    event.target.complete();
  }

  goToCuenta(cuentaId: number): void {
    this.router.navigate(['/customer/cuentas', cuentaId]);
  }

  goToExtracto(cuentaId: number): void {
    this.router.navigate(['/customer/reportes/extracto', cuentaId]);
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
