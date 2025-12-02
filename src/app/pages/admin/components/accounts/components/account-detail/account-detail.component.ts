import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { AccountsService } from '../../services/accounts.service';
import { ToastService } from '../../../../../../services/toast.service';
import { Account } from '../../models/account.dto';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AccountDetailComponent implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  account = signal<Account | null>(null);
  isLoading = signal(false);
  accountId = signal<string | null>(null);

  formattedBalance = computed(() => {
    const acc = this.account();
    if (!acc) return '₡0.00';
    const symbol = acc.moneda === 'USD' ? '$' : '₡';
    return `${symbol}${acc.saldo.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  });

  currencyName = computed(() => {
    const acc = this.account();
    return acc?.moneda === 'USD' ? 'Dólares Estadounidenses' : 'Colones Costarricenses';
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountsService: AccountsService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.accountId.set(id);
    }
  }

  ngOnDestroy(): void {
    this.resetData();
  }

  ionViewWillEnter(): void {
    const id = this.accountId();
    if (id) {
      this.loadAccount(id);
    } else {
      this.toastService.error('ID de cuenta no válido');
      this.goBack();
    }
  }

  ionViewWillLeave(): void {
    this.resetData();
  }

  private resetData(): void {
    this.account.set(null);
    this.isLoading.set(false);
  }

  loadAccount(id: string): void {
    this.isLoading.set(true);
    this.accountsService
      .getAccountById(id)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.account.set(response.data);
          } else {
            this.toastService.error('Cuenta no encontrada');
            this.goBack();
          }
        }),
        catchError(() => {
          this.toastService.error('Error al cargar la cuenta');
          this.goBack();
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  async toggleAccountStatus(): Promise<void> {
    const acc = this.account();
    if (!acc) return;

    const newStatus = acc.estado === 'Activa' ? 'Inactiva' : 'Activa';
    const action = newStatus === 'Activa' ? 'activar' : 'desactivar';

    const alert = await this.alertController.create({
      header: `${action.charAt(0).toUpperCase() + action.slice(1)} Cuenta`,
      message: `¿Está seguro que desea ${action} esta cuenta?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aceptar',
          role: 'confirm',
          handler: () => this.executeToggleStatus(newStatus),
        },
      ],
    });
    await alert.present();
  }

  private executeToggleStatus(newStatus: string): void {
    const id = this.accountId();
    if (!id) return;

    this.accountsService.updateAccountStatus(id, newStatus).subscribe({
      next: () => {
        this.account.update((acc) => (acc ? { ...acc, estado: newStatus } : acc));
        this.toastService.success(
          `Cuenta ${newStatus === 'Activa' ? 'activada' : 'desactivada'} exitosamente`
        );
      },
      error: () => this.toastService.error('Error al cambiar estado de la cuenta'),
    });
  }

  async deleteAccount(): Promise<void> {
    const acc = this.account();
    if (!acc) return;

    const alert = await this.alertController.create({
      header: 'Eliminar Cuenta',
      message: `¿Está seguro que desea eliminar la cuenta ${acc.numero}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.executeDeleteAccount(),
        },
      ],
    });
    await alert.present();
  }

  private executeDeleteAccount(): void {
    const id = this.accountId();
    if (!id) return;

    this.accountsService.deleteAccount(id).subscribe({
      next: () => {
        this.toastService.success('Cuenta eliminada exitosamente');
        this.goBack();
      },
      error: (error) => this.toastService.error(error?.message || 'Error al eliminar la cuenta'),
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusColor(estado: string | undefined): string {
    return estado === 'Activa' || estado === 'Activo' ? 'success' : 'danger';
  }

  getTypeColor(tipo: string | undefined): string {
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

  getTypeIcon(tipo: string | undefined): string {
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

  goBack(): void {
    this.router.navigate(['/admin/accounts']);
  }

  goToCustomerDetail(): void {
    const acc = this.account();
    if (acc?.cliente?.id) {
      this.router.navigate([`/admin/customer/detail/${acc.cliente.id}`]);
    }
  }
}
