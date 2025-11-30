import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AlertController, IonicModule, ViewWillEnter } from '@ionic/angular';
import { AccountsService } from '../../services/accounts.service';
import { ToastService } from '../../../../../../services/toast.service';
import { ErrorHandlerService } from '../../../../../../services/error-handler.service';
import { Account } from '../../models/account.dto';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class AccountListComponent implements OnInit, ViewWillEnter {
  accounts = signal<Account[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  filterTipo = signal('todos');
  filterMoneda = signal('todas');
  filterEstado = signal('todos');

  filteredAccounts = computed(() => {
    const accounts = this.accounts();
    const search = this.searchTerm().toLowerCase();
    const tipo = this.filterTipo();
    const moneda = this.filterMoneda();
    const estado = this.filterEstado();

    return accounts.filter((account) => {
      const matchesSearch =
        !search ||
        account.numero.toLowerCase().includes(search) ||
        account.usuario?.nombre?.toLowerCase().includes(search) ||
        account.usuario?.email?.toLowerCase().includes(search);
      const matchesTipo = tipo === 'todos' || account.tipo === tipo;
      const matchesMoneda = moneda === 'todas' || account.moneda === moneda;
      const matchesEstado = estado === 'todos' || account.estado === estado;
      return matchesSearch && matchesTipo && matchesMoneda && matchesEstado;
    });
  });

  constructor(
    private accountsService: AccountsService,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  ionViewWillEnter(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading.set(true);
    this.accountsService.getAccounts().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.accounts.set(response.data || []);
        } else {
          this.toastService.warning(response.message || 'Error al cargar cuentas');
        }
        this.isLoading.set(false);
      },
      error: (error: any) => {
        this.errorHandler.handleError(error, 'loadAccounts').subscribe({
          error: (errorDetails: any) => {
            this.toastService.error(errorDetails.message);
            this.isLoading.set(false);
          },
        });
      },
    });
  }

  onSearchChange(event: any): void {
    this.searchTerm.set(event.detail.value || '');
  }

  onTipoChange(event: any): void {
    this.filterTipo.set(event.detail.value);
  }

  toggleMoneda(moneda: string): void {
    this.filterMoneda.set(this.filterMoneda() === moneda ? 'todas' : moneda);
  }

  toggleEstado(estado: string): void {
    this.filterEstado.set(this.filterEstado() === estado ? 'todos' : estado);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterTipo.set('todos');
    this.filterMoneda.set('todas');
    this.filterEstado.set('todos');
  }

  async toggleAccountStatus(account: Account): Promise<void> {
    const newStatus = account.estado === 'Activa' ? 'Inactiva' : 'Activa';
    const action = newStatus === 'Activa' ? 'activar' : 'desactivar';

    const alert = await this.alertController.create({
      header: `${action.charAt(0).toUpperCase() + action.slice(1)} Cuenta`,
      message: `¿Está seguro que desea ${action} la cuenta ${account.numero}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aceptar',
          role: 'confirm',
          handler: () => this.executeToggleStatus(account, newStatus),
        },
      ],
    });
    await alert.present();
  }

  private executeToggleStatus(account: Account, newStatus: string): void {
    this.accountsService.updateAccountStatus(account.id.toString(), newStatus).subscribe({
      next: () => {
        this.accounts.update((accounts) =>
          accounts.map((a) => (a.id === account.id ? { ...a, estado: newStatus } : a))
        );
        this.toastService.success(
          `Cuenta ${newStatus === 'Activa' ? 'activada' : 'desactivada'} exitosamente`
        );
      },
      error: (error) => this.toastService.error(error?.message || 'Error al cambiar estado de la cuenta'),
    });
  }

  async deleteAccount(account: Account): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Cuenta',
      message: `¿Está seguro que desea eliminar la cuenta ${account.numero}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.executeDeleteAccount(account),
        },
      ],
    });
    await alert.present();
  }

  private executeDeleteAccount(account: Account): void {
    this.accountsService.deleteAccount(account.id.toString()).subscribe({
      next: () => {
        this.accounts.update((accounts) => accounts.filter((a) => a.id !== account.id));
        this.toastService.success('Cuenta eliminada exitosamente');
      },
      error: (error) => this.toastService.error(error?.message || 'Error al eliminar cuenta'),
    });
  }

  refreshAccounts(): void {
    this.loadAccounts();
  }

  goToAccountDetail(accountId: number): void {
    this.router.navigate([`/admin/accounts/detail/${accountId}`]);
  }

  formatBalance(account: Account): string {
    const symbol = account.moneda === 'USD' ? '$' : '₡';
    return `${symbol}${account.saldo.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getTypeColor(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'ahorro':
      case 'ahorros':
        return 'success';
      case 'corriente':
        return 'primary';
      default:
        return 'medium';
    }
  }

  getStatusColor(estado: string): string {
    return estado === 'Activa' ? 'success' : 'danger';
  }

  getTypeIcon(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'ahorro':
      case 'ahorros':
        return 'wallet-outline';
      case 'corriente':
        return 'card-outline';
      default:
        return 'cash-outline';
    }
  }
}

