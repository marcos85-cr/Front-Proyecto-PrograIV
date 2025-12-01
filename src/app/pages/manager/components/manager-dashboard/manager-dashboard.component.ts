import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { TransactionService } from '../../../../services/transaction.service';
import { ToastController, AlertController, ModalController } from '@ionic/angular';
import { catchError, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

interface Client {
  id: string;
  nombre: string;
  email?: string;
  identificacion: string;
  telefono?: string;
  cuentasActivas: number;
  ultimaOperacion?: Date;
  estado: 'Activo' | 'Inactivo';
  volumenTotal?: number;
}

interface Operation {
  id: string;
  clienteNombre: string;
  descripcion: string;
  monto: number;
  moneda: string;
}

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
  ],
})
export class ManagerDashboardComponent implements OnInit {
  userName = signal<string>('');

  stats = signal({
    myClients: 0,
    activeAccounts: 0,
    todayOperations: 0,
    pendingApprovals: 0
  });

  pendingOperations = signal<Operation[]>([]);
  myClients = signal<Client[]>([]);

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router,
    private toastController: ToastController,
    private modalController: ModalController,
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
    } catch (error) {
      console.error('Error loading user info:', error);
      this.userName.set('Gestor');
    }
  }

  loadStats(): void {
    const currentClients = this.myClients();
    this.stats.set({
      myClients: currentClients.length,
      activeAccounts: currentClients.reduce((sum, client) => sum + client.cuentasActivas, 0),
      todayOperations: 12,
      pendingApprovals: 3
    });
  }

  loadMyClients(): void {
    // Clientes simulados del gestor
    const clients: Client[] = [
      {
        id: '1',
        nombre: 'Carlos Sánchez Mora',
        email: 'carlos.sanchez@email.com',
        identificacion: '1-1234-5678',
        telefono: '8888-9999',
        cuentasActivas: 3,
        ultimaOperacion: new Date('2025-11-07'),
        estado: 'Activo',
        volumenTotal: 5600000
      },
      {
        id: '2',
        nombre: 'Ana Rodríguez Pérez',
        email: 'ana.rodriguez@email.com',
        identificacion: '2-2345-6789',
        telefono: '7777-8888',
        cuentasActivas: 2,
        ultimaOperacion: new Date('2025-11-06'),
        estado: 'Activo',
        volumenTotal: 3200000
      },
      {
        id: '3',
        nombre: 'José Martínez López',
        email: 'jose.martinez@email.com',
        identificacion: '3-3456-7890',
        telefono: '6666-7777',
        cuentasActivas: 4,
        ultimaOperacion: new Date('2025-11-05'),
        estado: 'Activo',
        volumenTotal: 8900000
      }
    ];

    this.myClients.set(clients);
  }

  loadPendingOperations(): void {
    const operations: Operation[] = [
      {
        id: '1',
        clienteNombre: 'Carlos Sánchez',
        descripcion: 'Transferencia internacional',
        monto: 150000,
        moneda: 'CRC'
      },
      {
        id: '2',
        clienteNombre: 'Ana Rodríguez',
        descripcion: 'Transferencia a tercero',
        monto: 80000,
        moneda: 'CRC'
      }
    ];

    this.pendingOperations.set(operations);
  }

  approveOperation(id: string): void {
    this.transactionService.approveTransaction(id).pipe(
      tap(() => {
        this.showToast('Operación aprobada exitosamente', 'success');
        this.loadPendingOperations();
        this.loadStats();
      }),
      catchError(error => {
        this.showToast('Error al aprobar la operación', 'danger');
        return EMPTY;
      })
    ).subscribe();
  }

  rejectOperation(id: string): void {
    this.transactionService.rejectTransaction(id, 'Rechazado por gestor').pipe(
      tap(() => {
        this.showToast('Operación rechazada exitosamente', 'warning');
        this.loadPendingOperations();
        this.loadStats();
      }),
      catchError(error => {
        this.showToast('Error al rechazar la operación', 'danger');
        return EMPTY;
      })
    ).subscribe();
  }

  openAccount(): void {
    if (this.myClients().length === 0) {
      this.showToast('No tienes clientes asignados', 'warning');
      return;
    }

    const currentClients = this.myClients();
    if (currentClients.length === 1) {
      this.openCreateAccountForClient(currentClients[0]);
    } else {
      this.showClientSelector();
    }
  }

  private async showClientSelector(): Promise<void> {
    const currentClients = this.myClients();
    const alert = await this.alertController.create({
      header: 'Seleccionar Cliente',
      message: 'Selecciona el cliente para crear una nueva cuenta',
      inputs: currentClients.map(client => ({
        type: 'radio' as const,
        label: client.nombre,
        value: client.id
      })),
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Siguiente',
          handler: (clientId: string) => {
            if (clientId) {
              const client = currentClients.find(c => c.id === clientId);
              if (client) {
                this.openCreateAccountForClient(client);
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private openCreateAccountForClient(client: Client): void {
    // Aquí iría la lógica para crear cuenta
    this.showToast(`Creando cuenta para ${client.nombre}`, 'primary');
    // this.router.navigate([`/gestor/accounts/create/${client.id}`]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }
}