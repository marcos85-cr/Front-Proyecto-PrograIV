import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY, Subscription } from 'rxjs';

import { GestorService } from '../../../../services/gestor.service';
import { ToastService } from '../../../../services/toast.service';
import { AlertController, LoadingController } from '@ionic/angular';

import {
  ClienteDetalleGestor,
  CuentaGestor,
  TransaccionGestor,
  Result
} from '../../../../shared/models/gestor.model';

@Component({
  selector: 'app-cliente-detalle',
  templateUrl: './cliente-detalle.component.html',
  styleUrls: ['./cliente-detalle.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
  ],
})
export class ClienteDetalleComponent implements OnInit, OnDestroy {
  // Signals
  cliente = signal<ClienteDetalleGestor | null>(null);
  cuentas = signal<CuentaGestor[]>([]);
  transacciones = signal<TransaccionGestor[]>([]);
  isLoading = signal(false);
  activeTab = signal<'info' | 'cuentas' | 'transacciones'>('info');

  // Computed properties
  hasCliente = computed(() => this.cliente() !== null);
  hasCuentas = computed(() => this.cuentas().length > 0);
  hasTransacciones = computed(() => this.transacciones().length > 0);

  private routeSub: Subscription | null = null;

  constructor(
    private gestorService: GestorService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.routeSub = this.route.params.subscribe(params => {
      const clienteId = +params['id'];
      if (clienteId) {
        this.loadClienteDetalle(clienteId);
      }
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  loadClienteDetalle(clienteId: number) {
    this.isLoading.set(true);

    // Load client details and related data in parallel
    this.gestorService.getClienteDetalle(clienteId).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.cliente.set(response.data);
          // After loading client, load their accounts
          this.loadCuentasCliente(clienteId);
          // Load recent transactions
          this.loadTransaccionesCliente(clienteId);
        }
      }),
      catchError(error => {
        console.error('Error loading cliente detalle:', error);
        this.toastService.error('Error al cargar información del cliente');
        this.goBack();
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  loadCuentasCliente(clienteId: number) {
    this.gestorService.getCuentasCliente(clienteId).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.cuentas.set(response.data);
        }
      }),
      catchError(error => {
        console.error('Error loading cuentas:', error);
        this.toastService.error('Error al cargar cuentas del cliente');
        return EMPTY;
      })
    ).subscribe();
  }

  loadTransaccionesCliente(clienteId: number, limit: number = 10) {
    this.gestorService.getTransaccionesCliente(clienteId, { limit }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.transacciones.set(response.data);
        }
      }),
      catchError(error => {
        console.error('Error loading transacciones:', error);
        this.toastService.error('Error al cargar transacciones del cliente');
        return EMPTY;
      })
    ).subscribe();
  }

  setActiveTab(tab: any) {
    this.activeTab.set(tab);
  }

  createAccount() {
    const cliente = this.cliente();
    if (cliente) {
      this.router.navigate([`/gestor/clientes/${cliente.id}/crear-cuenta`]);
    }
  }

  async viewCuentaDetail(cuenta: CuentaGestor) {
    const alert = await this.alertController.create({
      header: 'Detalles de Cuenta',
      subHeader: cuenta.numero,
      message: `
        <div style="text-align: left;">
          <p><strong>Tipo:</strong> ${cuenta.tipo}</p>
          <p><strong>Moneda:</strong> ${cuenta.moneda}</p>
          <p><strong>Saldo:</strong> ${this.formatCurrency(cuenta.saldo, cuenta.moneda)}</p>
          <p><strong>Estado:</strong> ${cuenta.estado}</p>
          <p><strong>Fecha Apertura:</strong> ${this.formatDate(cuenta.fechaApertura)}</p>
        </div>
      `,
      buttons: ['OK']
    });
    await alert.present();
  }

  async refreshData() {
    const cliente = this.cliente();
    if (cliente) {
      await this.loadClienteDetalle(cliente.id);
    }
  }

  formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'CRC' ? '₡' : '$';
    return `${symbol}${amount.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activo':
      case 'actviva':
        return 'success';
      case 'inactivo':
      case 'inactiva':
        return 'danger';
      case 'suspendido':
        return 'warning';
      case 'bloqueada':
        return 'medium';
      default:
        return 'primary';
    }
  }

  getTipoColor(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'transferencia':
        return 'primary';
      case 'deposito':
        return 'success';
      case 'retiro':
        return 'warning';
      case 'pago':
        return 'secondary';
      default:
        return 'medium';
    }
  }

  goBack() {
    this.router.navigate(['/gestor/clientes']);
  }

  goToDashboard() {
    this.router.navigate(['/gestor/dashboard']);
  }

  // View all transactions
  viewAllTransactions() {
    const cliente = this.cliente();
    if (cliente) {
      // Navigate to transactions page with client filter
      this.router.navigate(['/gestor/operaciones'], {
        queryParams: { clienteId: cliente.id }
      });
    }
  }
}