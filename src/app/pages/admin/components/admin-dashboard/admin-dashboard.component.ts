import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { catchError, finalize, tap, forkJoin, EMPTY } from 'rxjs';

import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { AdminService } from '../../services/admin.service';
import { EstadisticasDashboard } from '../../models/admin.model';

interface MenuOption {
  icon: string;
  label: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class AdminDashboardComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  userName = signal('Administrador');
  isLoading = signal(false);
  stats = signal<EstadisticasDashboard>({
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosBloqueados: 0,
    totalClientes: 0,
    totalCuentas: 0,
    cuentasActivas: 0,
    totalProveedores: 0,
    operacionesHoy: 0,
    volumenTotal: 0
  });

  menuOptions: MenuOption[] = [
    { icon: 'people-outline', label: 'Usuarios', route: '/admin/users', color: 'primary' },
    { icon: 'wallet-outline', label: 'Cuentas', route: '/admin/accounts', color: 'success' },
    { icon: 'swap-horizontal-outline', label: 'Transferencias', route: '/admin/transfers', color: 'danger' },
    { icon: 'people-circle-outline', label: 'Clientes', route: '/admin/customers', color: 'tertiary' },
    { icon: 'business-outline', label: 'Proveedores', route: '/admin/providers', color: 'warning' },
    { icon: 'person-add-outline', label: 'Beneficiarios', route: '/admin/beneficiaries', color: 'secondary' },
    { icon: 'bar-chart-outline', label: 'Reportes', route: '/admin/reports', color: 'primary' },
    { icon: 'document-text-outline', label: 'Auditoría', route: '/admin/audit', color: 'medium' }
  ];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private authService: AuthService,
    private toastService: ToastService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    this.loadStats();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private loadUserInfo(): void {
    const user = this.authService.getUserInfo();
    this.userName.set(user?.nombre || user?.name || 'Administrador');
  }

  private resetData(): void {
    this.stats.set({
      totalUsuarios: 0,
      usuariosActivos: 0,
      usuariosBloqueados: 0,
      totalClientes: 0,
      totalCuentas: 0,
      cuentasActivas: 0,
      totalProveedores: 0,
      operacionesHoy: 0,
      volumenTotal: 0
    });
    this.isLoading.set(false);
  }

  private loadStats(): void {
    this.isLoading.set(true);

    this.adminService.getDashboardStats().pipe(
      tap(response => {
        if (response.success && response.data) {
          this.stats.set(response.data);
        }
      }),
      catchError(() => {
        this.toastService.error('Error al cargar estadísticas');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Está seguro que desea cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  refreshStats(event?: any): void {
    this.loadStats();
    if (event) setTimeout(() => event.target.complete(), 500);
  }
}
