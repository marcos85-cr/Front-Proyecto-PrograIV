import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
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
export class AuditLogComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  // Estado
  registros = signal<RegistroAuditoria[]>([]);
  isLoading = signal(false);

  // Filtros
  searchTerm = signal('');
  filterOperacion = signal('todos');
  startDate = signal('');
  endDate = signal('');

  // Tipos de operación disponibles (se cargan dinámicamente)
  tiposOperacion = signal<{ valor: string; etiqueta: string }[]>([
    { valor: 'todos', etiqueta: 'Todos' }
  ]);

  // Lista filtrada computada
  filteredRegistros = computed(() => {
    const list = this.registros();
    const search = this.searchTerm().toLowerCase();
    const filter = this.filterOperacion();

    return list.filter(reg => {
      // Filtro por búsqueda
      const matchesSearch = !search ||
        reg.usuario?.toLowerCase().includes(search) ||
        reg.usuarioEmail?.toLowerCase().includes(search) ||
        reg.descripcion?.toLowerCase().includes(search) ||
        reg.ip?.includes(search) ||
        reg.tipoOperacion?.toLowerCase().includes(search);

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
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    this.loadAuditLogs();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.registros.set([]);
    this.isLoading.set(false);
    this.searchTerm.set('');
    this.filterOperacion.set('todos');
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
          this.loadTiposOperacion(response.data);
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
   * Carga los tipos de operación desde los registros
   */
  private loadTiposOperacion(registros: RegistroAuditoria[]): void {
    const tiposUnicos = [...new Set(registros.map(r => r.tipoOperacion).filter(Boolean))];
    const tipos = [
      { valor: 'todos', etiqueta: 'Todos' },
      ...tiposUnicos.map(tipo => ({
        valor: tipo,
        etiqueta: this.formatTipoOperacion(tipo)
      }))
    ];
    this.tiposOperacion.set(tipos);
  }

  /**
   * Formatea el tipo de operación para mostrar
   */
  private formatTipoOperacion(tipo: string): string {
    const labels: { [key: string]: string } = {
      'LOGIN': 'Inicio Sesión',
      'LOGOUT': 'Cierre Sesión',
      'TRANSFERENCIA': 'Transferencia',
      'CREACION_CUENTA': 'Creación Cuenta',
      'MODIFICACION': 'Modificación',
      'ELIMINACION': 'Eliminación',
      'APROBACION': 'Aprobación',
      'RECHAZO': 'Rechazo',
      'AprobacionTransferencia': 'Aprobación Transferencia',
      'RechazoTransferencia': 'Rechazo Transferencia',
      'CreacionTransferencia': 'Creación Transferencia'
    };
    return labels[tipo] || tipo.replace(/([A-Z])/g, ' $1').trim();
  }

  /**
   * Formatea el tipo de operación para mostrar en el template
   */
  formatTipoOperacionDisplay(tipo: string): string {
    return this.formatTipoOperacion(tipo);
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
      'ELIMINACION': 'trash-outline',
      'AprobacionTransferencia': 'checkmark-circle-outline',
      'RechazoTransferencia': 'close-circle-outline',
      'CreacionTransferencia': 'add-outline'
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
      'ELIMINACION': 'danger',
      'AprobacionTransferencia': 'success',
      'RechazoTransferencia': 'danger',
      'CreacionTransferencia': 'primary'
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
