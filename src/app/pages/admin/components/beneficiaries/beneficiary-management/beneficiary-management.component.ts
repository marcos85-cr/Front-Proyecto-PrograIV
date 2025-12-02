import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { Router } from '@angular/router';
import { catchError, finalize, tap, EMPTY } from 'rxjs';

import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../../../services/toast.service';
import { BeneficiarioAdmin } from '../../../models/admin.model';

@Component({
  selector: 'app-beneficiary-management',
  templateUrl: './beneficiary-management.component.html',
  styleUrls: ['./beneficiary-management.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class BeneficiaryManagementComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  // Señales para estado
  beneficiarios = signal<BeneficiarioAdmin[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  filterEstado = signal<'todos' | 'pendientes' | 'confirmados'>('todos');

  // Lista filtrada computada
  filteredBeneficiarios = computed(() => {
    const list = this.beneficiarios();
    const search = this.searchTerm().toLowerCase();
    const filter = this.filterEstado();

    return list.filter(ben => {
      // Filtro por búsqueda
      const matchesSearch = !search ||
        ben.nombreCompleto.toLowerCase().includes(search) ||
        ben.cuentaDestino.includes(search) ||
        ben.clienteNombre?.toLowerCase().includes(search);

      // Filtro por estado
      let matchesFilter = true;
      if (filter === 'pendientes') {
        matchesFilter = !ben.confirmado;
      } else if (filter === 'confirmados') {
        matchesFilter = ben.confirmado;
      }

      return matchesSearch && matchesFilter;
    });
  });

  // Contadores computados
  totalPendientes = computed(() => this.beneficiarios().filter(b => !b.confirmado).length);
  totalConfirmados = computed(() => this.beneficiarios().filter(b => b.confirmado).length);

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Inicialización
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    this.loadBeneficiarios();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.beneficiarios.set([]);
    this.isLoading.set(false);
    this.searchTerm.set('');
    this.filterEstado.set('todos');
  }

  /**
   * Carga la lista de beneficiarios desde el servicio
   */
  loadBeneficiarios(): void {
    this.isLoading.set(true);

    this.adminService.getBeneficiarios().pipe(
      tap(response => {
        if (response.success && response.data) {
          this.beneficiarios.set(response.data);
        }
      }),
      catchError(() => {
        this.toastService.error('Error al cargar beneficiarios');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  /**
   * Confirma un beneficiario pendiente
   */
  async confirmBeneficiary(beneficiario: BeneficiarioAdmin): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar Beneficiario',
      message: `¿Está seguro que desea confirmar al beneficiario "${beneficiario.nombreCompleto}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          role: 'confirm',
          handler: () => this.executeConfirm(beneficiario)
        }
      ]
    });
    await alert.present();
  }

  /**
   * Ejecuta la confirmación del beneficiario
   */
  private executeConfirm(beneficiario: BeneficiarioAdmin): void {
    this.adminService.confirmBeneficiary(beneficiario.id).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Beneficiario confirmado exitosamente');
          // Actualizar localmente
          this.beneficiarios.update(list =>
            list.map(b => b.id === beneficiario.id ? { ...b, confirmado: true } : b)
          );
        } else {
          this.toastService.error(response.message || 'Error al confirmar');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al confirmar beneficiario');
        return EMPTY;
      })
    ).subscribe();
  }

  /**
   * Actualiza el término de búsqueda
   */
  onSearchChange(event: any): void {
    this.searchTerm.set(event.detail.value || '');
  }

  /**
   * Actualiza el filtro de estado
   */
  onFilterChange(filter: 'todos' | 'pendientes' | 'confirmados'): void {
    this.filterEstado.set(filter);
  }

  /**
   * Refresca la lista de beneficiarios
   */
  refreshBeneficiarios(event?: any): void {
    this.loadBeneficiarios();
    if (event) {
      setTimeout(() => event.target.complete(), 500);
    }
  }

  /**
   * Navega al dashboard
   */
  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  /**
   * Obtiene el color del badge según el estado
   */
  getStatusColor(confirmado: boolean): string {
    return confirmado ? 'success' : 'warning';
  }

  /**
   * Obtiene el texto del estado
   */
  getStatusText(confirmado: boolean): string {
    return confirmado ? 'Confirmado' : 'Pendiente';
  }

  /**
   * Formatea la fecha
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
