import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, finalize, tap, forkJoin } from 'rxjs';
import { EMPTY } from 'rxjs';

import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { CustomerAccountsService } from '../../services/customer-accounts.service';
import { CustomerTransfersService } from '../../services/customer-transfers.service';
import { CuentaListaDto } from '../../model/account.model';

interface Transaction {
  id: number;
  descripcion: string;
  fecha: string;
  monto: number;
  tipo: string;
  estado: string;
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class CustomerDashboardComponent implements OnInit {
  userName = signal('');
  accounts = signal<CuentaListaDto[]>([]);
  transactions = signal<Transaction[]>([]);
  isLoading = signal(false);

  totalBalance = computed(() => {
    const cuentasCRC = this.accounts().filter(c => c.moneda === 'CRC');
    const cuentasUSD = this.accounts().filter(c => c.moneda === 'USD');
    return {
      CRC: cuentasCRC.reduce((sum, acc) => sum + acc.saldo, 0),
      USD: cuentasUSD.reduce((sum, acc) => sum + acc.saldo, 0)
    };
  });

  recentTransactions = computed(() =>
    this.transactions()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5)
  );

  quickActions = [
    { icon: 'swap-horizontal-outline', label: 'Transferir', route: '/customer/transferencias/nueva' },
    { icon: 'wallet-outline', label: 'Cuentas', route: '/customer/cuentas' },
    { icon: 'card-outline', label: 'Pagos', route: '/customer/pagos/realizar' },
    { icon: 'time-outline', label: 'Historial', route: '/customer/transferencias' }
  ];

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private accountsService: CustomerAccountsService,
    private transfersService: CustomerTransfersService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadDashboardData();
  }

  private loadUserInfo(): void {
    const user = this.authService.getUserInfo();
    this.userName.set(user?.nombre || user?.name || 'Cliente');
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    forkJoin({
      accounts: this.accountsService.getMisCuentas(),
      transfers: this.transfersService.getMyTransfers()
    }).pipe(
      tap(({ accounts, transfers }) => {
        if (accounts.success && accounts.data) {
          this.accounts.set(accounts.data);
        }
        if (transfers.success && transfers.data) {
          this.transactions.set(transfers.data);
        }
      }),
      catchError(() => {
        this.toastService.error('Error al cargar datos');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  formatCurrency(amount: number, currency: string = 'CRC'): string {
    const symbol = currency === 'USD' ? '$' : '₡';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short'
    });
  }

  getTransactionIcon(tipo: string): string {
    const icons: Record<string, string> = {
      transferencia: 'swap-horizontal-outline',
      deposito: 'arrow-down-outline',
      retiro: 'arrow-up-outline',
      pago: 'card-outline'
    };
    return icons[tipo?.toLowerCase()] || 'cash-outline';
  }

  isIncome(tipo: string): boolean {
    return ['deposito', 'ingreso'].includes(tipo?.toLowerCase());
  }

  refreshDashboard(event?: any): void {
    this.loadDashboardData();
    if (event) setTimeout(() => event.target.complete(), 500);
  }
}
