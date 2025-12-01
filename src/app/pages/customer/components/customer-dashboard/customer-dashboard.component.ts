import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element/bundle';

interface Account {
  id: number;
  acc_no: string;
  acc_type: string;
  balance: number;
}

interface Transaction {
  id: number;
  to: string;
  date: string;
  amount: number;
  type?: 'income' | 'expense';
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CustomerDashboardComponent implements OnInit {
  // Signals para estado reactivo
  accounts = signal<Account[]>([]);
  transactions = signal<Transaction[]>([]);
  isLoading = signal(false);
  userName = signal('Marcos Vargas');

  // Computed signals
  totalBalance = computed(() =>
    this.accounts().reduce((sum, acc) => sum + acc.balance, 0)
  );

  recentTransactions = computed(() =>
    this.transactions()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  );

  // Acciones rápidas del dashboard
  quickActions = signal([
    {
      icon: 'swap-horizontal-outline',
      label: 'Transferir',
      route: '/customer/transferencias/nueva',
      color: 'primary'
    },
    {
      icon: 'wallet-outline',
      label: 'Mis Cuentas',
      route: '/customer/cuentas',
      color: 'success'
    },
    {
      icon: 'cash-outline',
      label: 'Pagar Servicio',
      route: '/customer/pagos/realizar',
      color: 'warning'
    },
    {
      icon: 'document-outline',
      label: 'Reportes',
      route: '/customer/reportes',
      color: 'tertiary'
    },
  ]);

  ngOnInit(): void {
    // Registrar Swiper elementos personalizados
    register();
    this.loadDashboardData();
  }

  /**
   * Carga los datos del dashboard
   */
  private loadDashboardData(): void {
    this.isLoading.set(true);

    // TODO: Reemplazar con llamadas reales al servicio
    this.accounts.set([
      { id: 1, acc_no: '1234567890', acc_type: 'Corriente', balance: 2500.75 },
      { id: 2, acc_no: '0987654321', acc_type: 'Ahorros', balance: 10500.00 },
      { id: 3, acc_no: '1122334455', acc_type: 'Inversión', balance: 50000.50 },
    ]);

    this.transactions.set([
      { id: 1, to: 'Pedro Sanchez', date: '2025-05-22', amount: 5000, type: 'income' },
      { id: 2, to: 'Marta Porras', date: '2025-03-02', amount: 7000, type: 'income' },
      { id: 3, to: 'Ezequiel Santos', date: '2025-07-28', amount: -3250, type: 'expense' },
      { id: 4, to: 'Tomas Cerrano', date: '2025-01-09', amount: 1000, type: 'income' },
      { id: 5, to: 'Juan Perez', date: '2025-04-13', amount: -800, type: 'expense' },
    ]);

    this.isLoading.set(false);
  }

  /**
   * Formatea el balance como moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Formatea la fecha
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Obtiene el ícono según el tipo de transacción
   */
  getTransactionIcon(amount: number): string {
    return amount >= 0 ? 'arrow-down-circle' : 'arrow-up-circle';
  }

  /**
   * Obtiene el color según el tipo de transacción
   */
  getTransactionColor(amount: number): string {
    return amount >= 0 ? 'success' : 'danger';
  }

  /**
   * Refresca los datos del dashboard
   */
  refreshDashboard(event?: any): void {
    this.loadDashboardData();
    if (event) {
      event.target.complete();
    }
  }

  /**
   * Trackby para optimizar el renderizado de listas
   */
  trackByAccountId(index: number, account: Account): number {
    return account.id;
  }

  trackByTransactionId(index: number, transaction: Transaction): number {
    return transaction.id;
  }
}
