import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { Router } from '@angular/router';
import { catchError, finalize, tap, EMPTY } from 'rxjs';

import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../../../services/toast.service';
import { RegistroAuditoria, FiltrosAuditoria } from '../../../models/admin.model';

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class AuditLogComponent implements OnInit, ViewWillEnter {
  // Estado
  registros = signal<RegistroAuditoria[]>([]);
  isLoading = signal(false);

  // Filtros
  searchTerm = signal('');
  filterOperacion = signal('todos');
  startDate = signal('');
  endDate = signal('');

  // Tipos de operación disponibles
  tiposOperacion = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'LOGIN', etiqueta: 'Inicio Sesión' },
    { valor: 'LOGOUT', etiqueta: 'Cierre Sesión' },
    { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
    { valor: 'CREACION_CUENTA', etiqueta: 'Creación Cuenta' },
    { valor: 'MODIFICACION', etiqueta: 'Modificación' },
    { valor: 'ELIMINACION', etiqueta: 'Eliminación' }
  ];

  // Lista filtrada computada
  filteredRegistros = computed(() => {
    const list = this.registros();
    const search = this.searchTerm().toLowerCase();
    const filter = this.filterOperacion();

    return list.filter(reg => {
      // Filtro por búsqueda
      const matchesSearch = !search ||
        reg.usuario?.toLowerCase().includes(search) ||
        reg.descripcion?.toLowerCase().includes(search) ||
        reg.ip?.includes(search);

      // Filtro por tipo de operación
      const matchesFilter = filter === 'todos' || reg.tipoOperacion === filter;

      return matchesSearch && matchesFilter;
    });
  });

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeDates();
    this.loadAuditLogs();
  }

  ionViewWillEnter(): void {
    this.loadAuditLogs();
  }

  /**
   * Inicializa las fechas por defecto (últimos 7 días)
   */
  private initializeDates(): void {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.endDate.set(this.formatDateForInput(today));
    this.startDate.set(this.formatDateForInput(lastWeek));
  }

  /**
   * Formatea fecha para input
   */
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Carga los registros de auditoría
   */
  loadAuditLogs(): void {
    this.isLoading.set(true);

    const filters: FiltrosAuditoria = {};
    if (this.startDate()) filters.fechaInicio = this.startDate();
    if (this.endDate()) filters.fechaFin = this.endDate();
    if (this.filterOperacion() !== 'todos') filters.tipoOperacion = this.filterOperacion();

    this.adminService.getAuditLogs(filters).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.registros.set(response.data);
        }
      }),
      catchError(() => {
        this.toastService.error('Error al cargar registros de auditoría');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  /**
   * Aplica los filtros
   */
  applyFilters(): void {
    this.loadAuditLogs();
  }

  /**
   * Actualiza el término de búsqueda
   */
  onSearchChange(event: any): void {
    this.searchTerm.set(event.detail.value || '');
  }

  /**
   * Actualiza el filtro de operación
   */
  onFilterChange(event: any): void {
    this.filterOperacion.set(event.detail.value || 'todos');
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
   * Refresca los registros
   */
  refreshLogs(event?: any): void {
    this.loadAuditLogs();
    if (event) {
      setTimeout(() => event.target.complete(), 500);
    }
  }

  /**
   * Obtiene el icono según el tipo de operación
   */
  getOperationIcon(tipo: string): string {
    const icons: { [key: string]: string } = {
      'LOGIN': 'log-in-outline',
      'LOGOUT': 'log-out-outline',
      'TRANSFERENCIA': 'swap-horizontal-outline',
      'CREACION_CUENTA': 'add-circle-outline',
      'MODIFICACION': 'create-outline',
      'ELIMINACION': 'trash-outline'
    };
    return icons[tipo] || 'document-outline';
  }

  /**
   * Obtiene el color según el tipo de operación
   */
  getOperationColor(tipo: string): string {
    const colors: { [key: string]: string } = {
      'LOGIN': 'success',
      'LOGOUT': 'medium',
      'TRANSFERENCIA': 'primary',
      'CREACION_CUENTA': 'tertiary',
      'MODIFICACION': 'warning',
      'ELIMINACION': 'danger'
    };
    return colors[tipo] || 'medium';
  }

  /**
   * Formatea la fecha y hora
   */
  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Navega de regreso
   */
  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
