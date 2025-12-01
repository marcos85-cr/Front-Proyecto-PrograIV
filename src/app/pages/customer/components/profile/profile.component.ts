import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { CustomerService } from 'src/app/shared/components/customer/services/customer.service';

export interface ClienteProfile {
  id: number;
  usuarioId: number;
  identificacion: string;
  nombreCompleto: string;
  telefono: string;
  email: string;
  direccion: string;
  fechaNacimiento: string;
  estado: string;
  fechaRegistro: string;
  cuentasActivas: number;
  saldoTotal: number;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ProfileComponent implements OnInit {
  profile = signal<ClienteProfile | null>(null);
  isLoading = signal(false);
  isChangingPassword = signal(false);

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private customerService: CustomerService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    const userInfo = this.authService.getUserInfo();
    const clienteId = userInfo?.sub;

    if (!clienteId) {
      this.toastService.error('No se encontró información del cliente');
      return;
    }

    this.isLoading.set(true);
    this.customerService.getUserById(clienteId).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.profile.set(response.data);
        } else {
          this.toastService.error(response.message || 'Error al cargar el perfil');
        }
      }),
      catchError(() => {
        this.toastService.error('Error al cargar el perfil');
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Cambiar Contraseña',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Contraseña actual'
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nueva contraseña'
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirmar nueva contraseña'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cambiar',
          handler: (data) => {
            if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
              this.toastService.warning('Todos los campos son requeridos');
              return false;
            }
            if (data.newPassword.length < 6) {
              this.toastService.warning('La contraseña debe tener al menos 6 caracteres');
              return false;
            }
            if (data.newPassword !== data.confirmPassword) {
              this.toastService.warning('Las contraseñas no coinciden');
              return false;
            }
            this.executeChangePassword(data.currentPassword, data.newPassword);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private executeChangePassword(currentPassword: string, newPassword: string) {
    this.isChangingPassword.set(true);
    const userInfo = this.authService.getUserInfo();

    this.customerService.changePassword({
      usuarioId: userInfo?.sub,
      contrasenaActual: currentPassword,
      nuevaContrasena: newPassword
    }).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.success('Contraseña actualizada correctamente');
        } else {
          this.toastService.error(response.message || 'Error al cambiar la contraseña');
        }
      }),
      catchError((error) => {
        this.toastService.error(error?.message || 'Error al cambiar la contraseña');
        return EMPTY;
      }),
      finalize(() => this.isChangingPassword.set(false))
    ).subscribe();
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Está seguro que desea cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => this.logout()
        }
      ]
    });
    await alert.present();
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return `₡${amount.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getEstadoColor(estado: string): string {
    return estado?.toLowerCase() === 'activo' ? 'success' : 'danger';
  }

  goBack() {
    this.router.navigate(['/customer/dashboard']);
  }

  logout() {
    this.authService.logout();
  }
}
