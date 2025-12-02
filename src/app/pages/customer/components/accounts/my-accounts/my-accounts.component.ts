import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, AlertController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerAccountsService } from '../../../services/customer-accounts.service';
import { CuentaListaDto } from '../../../model/account.model';

@Component({
  selector: 'app-my-accounts',
  templateUrl: './my-accounts.component.html',
  styleUrls: ['./my-accounts.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class MyAccountsComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  // Signals para estado reactivo
  accounts = signal<CuentaListaDto[]>([]);
  filteredAccounts = signal<CuentaListaDto[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);
  filterStatus = signal('todos');

  // Signal computado para estadísticas
  stats = computed(() => {
    const accounts = this.accounts();
    const balanceCRC = accounts
      .filter(c => c.moneda === 'CRC' && c.estado === 'Activa')
      .reduce((sum, c) => sum + c.saldo, 0);
    const balanceUSD = accounts
      .filter(c => c.moneda === 'USD' && c.estado === 'Activa')
      .reduce((sum, c) => sum + c.saldo, 0);
    return {
      totalCuentas: accounts.length,
      cuentasActivas: accounts.filter(c => c.estado === 'Activa').length,
      saldoTotalCRC: balanceCRC,
      saldoTotalUSD: balanceUSD
    };
  });

  constructor(
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private toastService: ToastService,
    private accountsService: CustomerAccountsService
  ) {}

  ngOnInit() {
    // Inicialización
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    this.loadAccounts();
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.accounts.set([]);
    this.filteredAccounts.set([]);
    this.searchTerm.set('');
    this.filterStatus.set('todos');
    this.isLoading.set(false);
  }

  loadAccounts(): void {
    this.isLoading.set(true);
    this.accountsService.getMisCuentas().subscribe({
      next: (response) => {
        if (response.success) {
          this.accounts.set(response.data || []);
          this.filterAccounts();
        } else {
          this.toastService.warning(response.message || 'Error al cargar cuentas');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar cuentas:', error);
        this.toastService.error('Error al cargar cuentas');
        this.isLoading.set(false);
      }
    });
  }

  filterAccounts(): void {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.filterStatus();

    let filtered = this.accounts();

    // Filtrar por estado
    if (status !== 'todos') {
      filtered = filtered.filter(c => c.estado === status);
    }

    // Filtrar por término de búsqueda
    if (term) {
      filtered = filtered.filter(account =>
        account.numero.toLowerCase().includes(term) ||
        account.tipo.toLowerCase().includes(term) ||
        account.moneda.toLowerCase().includes(term)
      );
    }

    this.filteredAccounts.set(filtered);
  }

  goToAccountDetail(accountId: number): void {
    this.router.navigate(['/customer/cuentas', accountId]);
  }

  goToCreateAccount(): void {
    this.router.navigate(['/customer/cuentas/crear']);
  }

  async toggleBlock(account: CuentaListaDto): Promise<void> {
    const accion = account.estado === 'Bloqueada' ? 'desbloquear' : 'bloquear';
    const accionCapitalizada = accion.charAt(0).toUpperCase() + accion.slice(1);

    const alert = await this.alertController.create({
      header: `${accionCapitalizada} Cuenta`,
      message: `¿Está seguro que desea ${accion} la cuenta ${account.numero.slice(-4)}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          role: 'confirm',
          handler: () => this.executeToggleBlock(account, accionCapitalizada)
        }
      ]
    });

    await alert.present();
  }

  private executeToggleBlock(account: CuentaListaDto, accion: string): void {
    this.accountsService.toggleBloqueo(account.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(`Cuenta ${accion.toLowerCase()}da exitosamente`);
          this.loadAccounts();
        } else {
          this.toastService.error(response.message || `Error al ${accion.toLowerCase()} cuenta`);
        }
      },
      error: () => this.toastService.error(`Error al ${accion.toLowerCase()} cuenta`)
    });
  }

  async closeAccount(account: CuentaListaDto): Promise<void> {
    if (account.saldo !== 0) {
      this.toastService.warning('La cuenta debe tener saldo 0 para poder cerrarla');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cerrar Cuenta',
      message: `¿Está seguro que desea cerrar la cuenta ****${account.numero.slice(-4)}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar',
          role: 'destructive',
          handler: () => this.executeCloseAccount(account)
        }
      ]
    });

    await alert.present();
  }

  private executeCloseAccount(account: CuentaListaDto): void {
    this.accountsService.cerrarCuenta(account.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Cuenta cerrada exitosamente');
          this.loadAccounts();
        } else {
          this.toastService.error(response.message || 'Error al cerrar cuenta');
        }
      },
      error: () => this.toastService.error('Error al cerrar cuenta')
    });
  }

  handleRefresh(event: any): void {
    this.loadAccounts();
    event.target.complete();
  }

  goBack(): void {
    this.location.back();
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Activa': return 'success';
      case 'Bloqueada': return 'warning';
      case 'Cerrada': return 'medium';
      default: return 'medium';
    }
  }

  getTypeIcon(type: string): string {
    return type === 'Ahorro' ? 'wallet-outline' : 'card-outline';
  }
}
