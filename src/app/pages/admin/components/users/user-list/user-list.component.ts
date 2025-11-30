import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../../services/user.service';
import { ToastService } from '../../../../../services/toast.service';
import { ErrorHandlerService } from '../../../../../services/error-handler.service';
import { User } from '../../../../../shared/models/user.model';
import { ROLES_UTILS, USER_ROLES } from '../../../../../shared/constants/user-roles.constants';
import { AlertController, IonicModule, ViewWillEnter } from '@ionic/angular';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
  ],
})
export class UserListComponent implements OnInit, ViewWillEnter {
  users: User[] = [];
  isLoading = false;
  searchTerm = '';
  filterBloqueados: boolean | null = null;

  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private alertController: AlertController,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Se ejecuta cada vez que la vista está a punto de entrar
   * Útil para refrescar datos cuando se vuelve de otra página
   */
  ionViewWillEnter(): void {
    this.loadUsers();
  }

  /**
   * Carga la lista de usuarios desde el servicio
   */
  loadUsers(): void {
    this.isLoading = true;

    this.userService.getUsers().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.users = response.data;
          this.toastService.success(`Se cargaron ${response.data.length} usuarios`, 2000);
        } else {
          this.toastService.warning(response.message || 'Error al cargar usuarios');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorHandler.handleError(error, 'loadUsers').subscribe({
          error: (errorDetails: any) => {
            this.toastService.error(errorDetails.message);
            this.isLoading = false;
          }
        });
      }
    });
  }

  /**
   * Cambia el estado de bloqueo de un usuario
   *
   * @param user - Usuario a modificar
   * @param bloquear - Nuevo estado de bloqueo
   */
  async toggleUserStatus(user: User, bloquear: boolean): Promise<void> {
    const action = bloquear ? 'bloquear' : 'desbloquear';
    const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);

    const alert = await this.alertController.create({
      header: `${actionCapitalized} Usuario`,
      message: `¿Está seguro que desea ${action} al usuario  ${user.nombre}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aceptar',
          role: 'confirm',
          handler: () => {
            this.executeToggleUserStatus(user, bloquear, actionCapitalized);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Ejecuta el cambio de estado del usuario después de la confirmación
   */
  private executeToggleUserStatus(user: User, bloquear: boolean, actionCapitalized: string): void {
    this.userService.updateUserStatus(user.id, bloquear).subscribe({
      next: () => {
        // Actualizar el estado local del usuario
        user.bloqueado = bloquear;
        this.toastService.success(`Usuario ${actionCapitalized} exitosamente`);
        this.refreshUsers();
      },
      error: () => {
        this.toastService.error(`Error al ${actionCapitalized.toLowerCase()} usuario`);
      }
    });
  }


  async deleteUser(user: User): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Usuario',
      message: `¿Está seguro que desea eliminar al usuario ${user.nombre}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.executeDeleteUser(user);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Ejecuta la eliminación del usuario después de la confirmación
   */
  private executeDeleteUser(user: User): void {
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        // Remover el usuario de la lista local
        this.users = this.users.filter(u => u.id !== user.id);
        this.toastService.success('Usuario eliminado exitosamente');
        this.refreshUsers();
      },
      error: () => {
        this.toastService.error('Error al eliminar usuario');
      }
    });
  }

  /**
   * Obtiene los usuarios filtrados según los criterios de búsqueda
   *
   * @returns Lista de usuarios filtrados
   */
  get filteredUsers(): User[] {
    return this.users.filter(user => {
      // Filtrar por término de búsqueda
      const matchesSearch = !this.searchTerm ||
        user.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.identificacion.includes(this.searchTerm);

      // Filtrar por estado de bloqueo
      const matchesBloqueados = this.filterBloqueados === null ||
        user.bloqueado === this.filterBloqueados;

      return matchesSearch && matchesBloqueados;
    });
  }

  /**
   * Recarga la lista de usuarios
   */
  refreshUsers(): void {
    this.loadUsers();
  }

  getRoleColor(role: string): string {
    return ROLES_UTILS.getRoleColor(role as any);
  }


  getRoleIcon(role: string): string {
    return ROLES_UTILS.getRoleIcon(role as any);
  }

  goToCreateUser(): void {
    this.router.navigate(['/admin/users/create']);
  }

  goToEditUser(userId: string): void {
    this.router.navigate([`/admin/users/edit/${userId}`]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
