import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { ToastService } from '../../../../../services/toast.service';
import { CustomerAccountsService } from '../../../services/customer-accounts.service';
import { CuentaCompletaDto, CuentaBalanceDto, CuentaEstadoDto } from '../../../model/account.model';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AccountDetailComponent implements OnInit {
  account = signal<CuentaCompletaDto | null>(null);
  balance = signal<CuentaBalanceDto | null>(null);
  isLoading = signal(false);
  accountId = signal<number>(0);

  // Signal computado para verificar si se puede cerrar
  canClose = computed(() => {
    const account = this.account();
    const bal = this.balance();
    return account?.estado === 'Activa' && bal?.disponible === 0;
  });

  constructor(
    private alertController: AlertController,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private accountsService: CustomerAccountsService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.accountId.set(+id);
      this.loadAccount();
    }
  }

  loadAccount(): void {
    this.isLoading.set(true);

    // Cargar datos de la cuenta
    this.accountsService.getAccountById(this.accountId()).subscribe({
      next: (response) => {
        if (response.success) {
          this.account.set(response.data || null);
          this.loadBalance();
        } else {
          this.toastService.error(response.message || 'Error al cargar cuenta');
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.toastService.error('Error al cargar cuenta');
        this.isLoading.set(false);
      }
    });
  }

  loadBalance(): void {
    this.accountsService.getBalance(this.accountId()).subscribe({
      next: (response) => {
        if (response.success) {
          this.balance.set(response.data || null);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  async toggleLock(): Promise<void> {
    const account = this.account();
    if (!account) return;

    const accion = account.estado === 'Bloqueada' ? 'desbloquear' : 'bloquear';
    const accionCapitalizada = accion.charAt(0).toUpperCase() + accion.slice(1);

    const alert = await this.alertController.create({
      header: `${accionCapitalizada} Cuenta`,
      message: `¿Está seguro que desea ${accion} esta cuenta?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          role: 'confirm',
          handler: () => this.executeToggleLock(accionCapitalizada)
        }
      ]
    });

    await alert.present();
  }

  private executeToggleLock(accion: string): void {
    this.accountsService.toggleLock(this.accountId()).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(`Cuenta ${accion.toLowerCase()}da exitosamente`);
          this.loadAccount();
        } else {
          this.toastService.error(response.message || `Error al ${accion.toLowerCase()} cuenta`);
        }
      },
      error: () => this.toastService.error(`Error al ${accion.toLowerCase()} cuenta`)
    });
  }

  async closeAccount(): Promise<void> {
    if (!this.canClose()) {
      this.toastService.warning('La cuenta debe tener saldo disponible 0 y estar activa para cerrarla');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cerrar Cuenta',
      message: '¿Está seguro que desea cerrar esta cuenta? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar',
          role: 'destructive',
          handler: () => this.executeCloseAccount()
        }
      ]
    });

    await alert.present();
  }

  private executeCloseAccount(): void {
    this.accountsService.closeAccount(this.accountId()).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Cuenta cerrada exitosamente');
          this.router.navigate(['/customer/cuentas']);
        } else {
          this.toastService.error(response.message || 'Error al cerrar cuenta');
        }
      },
      error: () => this.toastService.error('Error al cerrar cuenta')
    });
  }

  goToTransfer(): void {
    this.router.navigate(['/customer/transferencias/nueva'], {
      queryParams: { cuentaOrigen: this.accountId() }
    });
  }

  goToStatement(): void {
    this.router.navigate(['/customer/reportes/extracto', this.accountId()]);
  }

  handleRefresh(event: any): void {
    this.loadAccount();
    event.target.complete();
  }

  goBack(): void {
    this.location.back();
  }

  formatCurrency(amount: number | undefined, moneda: string | undefined): string {
    if (amount === undefined) return '-';
    const symbol = moneda === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getEstadoColor(estado: string | undefined): string {
    switch (estado) {
      case 'Activa': return 'success';
      case 'Bloqueada': return 'warning';
      case 'Cerrada': return 'medium';
      default: return 'medium';
    }
  }

  getStatusColor(estado: string | undefined): string {
    return this.getEstadoColor(estado);
  }
}
