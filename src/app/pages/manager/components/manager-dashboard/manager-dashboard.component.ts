import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { catchError, tap, finalize } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { AuthService } from '../../../../services/auth.service';
import { GestorService } from '../../../../services/gestor.service';
import { ToastService } from '../../../../services/toast.service';
import { GestorDashboard, OperacionPendiente, ClienteGestor } from '../../../../shared/models/gestor.model';

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class ManagerDashboardComponent implements OnInit {
  userName = signal<string>('');
  isLoading = signal(false);
  stats = signal<GestorDashboard>({
    myClients: 0,
    activeAccounts: 0,
    todayOperations: 0,
    pendingApprovals: 0,
    totalVolume: 0,
  });
  pendingOperations = signal<OperacionPendiente[]>([]);
  myClients = signal<ClienteGestor[]>([]);

  puedeAprobarOperacion = computed(() => (monto: number, moneda: string) =>
    this.gestorService.puedeAprobarOperacion(monto, moneda)
  );

  getMensajeLimiteExcedido = computed(() => (monto: number, moneda: string) =>
    this.gestorService.getMensajeLimiteExcedido(monto, moneda)
  );

  constructor(
    private authService: AuthService,
    private gestorService: GestorService,
    private router: Router,
    private toastService: ToastService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadUserInfo();
    this.loadStats();
    this.loadPendingOperations();
    this.loadMyClients();
  }

  loadUserInfo(): void {
    try {
      const user = this.authService.getUserInfo();
      this.userName.set(user?.nombre || user?.name || 'Gestor');
    } catch {
      this.userName.set('Gestor');
    }
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.gestorService.getDashboardStats().pipe(
      tap(response => {
        if (response.success && response.data) this.stats.set(response.data);
      }),
      catchError(() => {
        this.toastService.error('Error al cargar estadísticas');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  loadMyClients(): void {
    this.gestorService.getClientes({ limit: 3 }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.myClients.set(response.data.data.slice(0, 3));
        }
      }),
      catchError(() => {
        this.toastService.error('Error al cargar clientes');
        return EMPTY;
      })
    ).subscribe();
  }

  loadPendingOperations(): void {
    this.gestorService.getPendingOperations().pipe(
      tap(response => {
        if (response.success && response.data) this.pendingOperations.set(response.data);
      }),
      catchError(() => {
        this.toastService.error('Error al cargar operaciones pendientes');
        return EMPTY;
      })
    ).subscribe();
  }

  approveOperation(id: number): void {
    const operation = this.pendingOperations().find(op => op.id === id);
    if (!operation) return;

    if (!this.gestorService.puedeAprobarOperacion(operation.monto, operation.moneda)) {
      this.toastService.error(this.gestorService.getMensajeLimiteExcedido(operation.monto, operation.moneda));
      return;
    }

    this.gestorService.aprobarOperacion(id).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Operación aprobada exitosamente');
          this.loadPendingOperations();
          this.loadStats();
        } else {
          this.toastService.error(response.message || 'Error al aprobar la operación');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al aprobar la operación');
        return EMPTY;
      })
    ).subscribe();
  }

  rejectOperation(id: number): void {
    this.showRejectConfirmation(id);
  }

  private async showRejectConfirmation(id: number): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Rechazar Operación',
      inputs: [{
        name: 'razon',
        type: 'textarea',
        placeholder: 'Ingrese la razón del rechazo...',
        attributes: { minlength: 10, required: true }
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: (data) => {
            if (data.razon?.trim().length >= 10) {
              this.executeReject(id, data.razon.trim());
              return true;
            }
            this.toastService.warning('La razón debe tener al menos 10 caracteres');
            return false;
          }
        }
      ]
    });
    await alert.present();
  }

  private executeReject(id: number, razon: string): void {
    this.gestorService.rechazarOperacion(id, razon).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Operación rechazada exitosamente');
          this.loadPendingOperations();
          this.loadStats();
        } else {
          this.toastService.error(response.message || 'Error al rechazar la operación');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al rechazar la operación');
        return EMPTY;
      })
    ).subscribe();
  }

  openAccount(): void {
    if (this.myClients().length === 0) {
      this.toastService.warning('No tienes clientes asignados');
      return;
    }
    this.showClientSelector();
  }

  private async showClientSelector(): Promise<void> {
    const currentClients = this.myClients();
    const alert = await this.alertController.create({
      header: 'Seleccionar Cliente',
      message: 'Selecciona el cliente para crear una nueva cuenta',
      inputs: currentClients.map(client => ({
        type: 'radio' as const,
        label: `${client.nombre} - ${client.identificacion}`,
        value: client.id.toString(),
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (clientId: string) => {
            if (clientId) {
              const client = currentClients.find(c => c.id === parseInt(clientId));
              if (client) this.router.navigate([`/manager/clientes/${client.id}/crear-cuenta`]);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  navegation(url: string) {
    this.router.navigate([url]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
