import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { catchError, finalize, tap, forkJoin, EMPTY } from 'rxjs';

import { ReportService } from '../../../services/report.service';
import { ToastService } from '../../../../../services/toast.service';
import {
  ReporteVolumenDiario,
  ClienteActivo,
  ReporteTotalesPeriodo
} from '../../../models/admin.model';

@Component({
  selector: 'app-reports-dashboard',
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ReportsDashboardComponent implements OnInit {
  // Estado de carga
  isLoading = signal(false);

  // Datos de reportes
  dailyVolume = signal<ReporteVolumenDiario | null>(null);
  activeClients = signal<ClienteActivo[]>([]);
  periodTotals = signal<ReporteTotalesPeriodo | null>(null);

  // Filtros de fecha
  startDate = signal('');
  endDate = signal('');

  constructor(
    private reportService: ReportService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeDates();
    this.loadReports();
  }

  /**
   * Inicializa las fechas por defecto (último mes)
   */
  private initializeDates(): void {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    this.endDate.set(this.formatDateForInput(today));
    this.startDate.set(this.formatDateForInput(lastMonth));
  }

  /**
   * Formatea fecha para input date
   */
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Carga todos los reportes
   */
  loadReports(): void {
    this.isLoading.set(true);
    const start = this.startDate();
    const end = this.endDate();

    forkJoin({
      dailyVolume: this.reportService.getDailyVolume(start, end).pipe(
        catchError(() => {
          console.error('Error cargando volumen diario');
          return EMPTY;
        })
      ),
      activeClients: this.reportService.getMostActiveClients(start, end, 5).pipe(
        catchError(() => {
          console.error('Error cargando clientes activos');
          return EMPTY;
        })
      ),
      periodTotals: this.reportService.getPeriodTotals(start, end).pipe(
        catchError(() => {
          console.error('Error cargando totales del período');
          return EMPTY;
        })
      )
    }).pipe(
      tap(results => {
        if (results.dailyVolume?.success && results.dailyVolume.data) {
          this.dailyVolume.set(results.dailyVolume.data);
        }
        if (results.activeClients?.success && results.activeClients.data) {
          this.activeClients.set(results.activeClients.data.topClientes || []);
        }
        if (results.periodTotals?.success && results.periodTotals.data) {
          this.periodTotals.set(results.periodTotals.data);
        }
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  /**
   * Aplica los filtros de fecha
   */
  applyFilters(): void {
    if (!this.startDate() || !this.endDate()) {
      this.toastService.warning('Seleccione ambas fechas');
      return;
    }
    this.loadReports();
  }

  /**
   * Refresca los reportes
   */
  refreshReports(event?: any): void {
    this.loadReports();
    if (event) {
      setTimeout(() => event.target.complete(), 500);
    }
  }

  /**
   * Actualiza fecha de inicio
   */
  onStartDateChange(event: any): void {
    this.startDate.set(event.detail.value?.split('T')[0] || '');
  }

  /**
   * Actualiza fecha de fin
   */
  onEndDateChange(event: any): void {
    this.endDate.set(event.detail.value?.split('T')[0] || '');
  }

  /**
   * Formatea moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  }

  /**
   * Formatea número
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CR').format(value || 0);
  }

  /**
   * Navega de regreso al dashboard
   */
  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
