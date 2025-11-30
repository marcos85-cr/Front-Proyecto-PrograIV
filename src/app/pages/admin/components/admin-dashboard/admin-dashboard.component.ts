import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { HighValueOperationService } from '../../services/high-value-operation.service';
import { ToastService } from '../../../../services/toast.service';
import { ErrorHandlerService } from '../../../../services/error-handler.service';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AdminDashboardComponent  implements OnInit {
userName: string = '';
  stats = {
    totalUsers: 0,
    totalAccounts: 0,
    todayTransactions: 0,
    pendingApprovals: 0
  };
  pendingTransactions: any[] = [];

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private operationService: HighValueOperationService,
    private router: Router,
    private alertController: AlertController,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit() {
    this.loadUserInfo();
    this.loadStats();
    this.loadPendingTransactions();
  }

  loadUserInfo() {
    const user = this.authService.getUserInfo();
    this.userName = user?.nombre || 'Administrador';
  }

  loadStats() {
    // Obtener operaciones de alto valor pendientes
    this.operationService.getPendingOperations().subscribe({
      next: (operations) => {
        this.stats = {
          totalUsers: 145,
          totalAccounts: 328,
          todayTransactions: 52,
          pendingApprovals: operations?.data?.length || 8
        };
      },
      error: (error) => {
        this.errorHandler.handleError(error, 'loadStats').subscribe({
          error: () => {
            // Valores por defecto en caso de error
            this.stats = {
              totalUsers: 0,
              totalAccounts: 0,
              todayTransactions: 0,
              pendingApprovals: 0
            };
          }
        });
      }
    });
  }

  loadPendingTransactions() {
    this.transactionService.getAllTransactions({
      estado: 'PendienteAprobacion'
    }).subscribe({
      next: (transactions) => {
        this.pendingTransactions = transactions || [];
      },
      error: (error) => {
        this.errorHandler.handleError(error, 'loadPendingTransactions').subscribe({
          error: () => {
            this.pendingTransactions = [];
          }
        });
      }
    });
  }

  async approveTransaction(id: string) {
    const alert = await this.alertController.create({
      header: 'Aprobar Transacción',
      message: '¿Está seguro de aprobar esta transacción?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aprobar',
          handler: () => {
            this.transactionService.approveTransaction(id).subscribe({
              next: () => {
                this.toastService.success('Transacción aprobada exitosamente');
                this.loadPendingTransactions();
                this.loadStats();
              },
              error: (error) => {
                this.errorHandler.handleError(error, 'approveTransaction').subscribe({
                  error: (errorDetails) => {
                    this.toastService.error(errorDetails.message);
                  }
                });
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async rejectTransaction(id: string) {
    const alert = await this.alertController.create({
      header: 'Rechazar Transacción',
      message: 'Ingrese el motivo del rechazo:',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Motivo del rechazo'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Rechazar',
          handler: (data) => {
            if (!data.reason) {
              this.toastService.warning('Debe ingresar un motivo');
              return false;
            }
            this.transactionService.rejectTransaction(id, data.reason).subscribe({
              next: () => {
                this.toastService.success('Transacción rechazada');
                this.loadPendingTransactions();
                this.loadStats();
              },
              error: (error) => {
                this.errorHandler.handleError(error, 'rejectTransaction').subscribe({
                  error: (errorDetails) => {
                    this.toastService.error(errorDetails.message);
                  }
                });
              }
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navegation(url:string) {
    this.router.navigate([url]);
  }

}
