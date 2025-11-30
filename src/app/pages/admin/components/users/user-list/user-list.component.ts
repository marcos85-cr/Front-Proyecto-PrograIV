import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../../services/user.service';
import { ToastService } from '../../../../../services/toast.service';
import { ErrorHandlerService } from '../../../../../services/error-handler.service';
import { User } from '../../../../../shared/models/user.model';
import { IonicModule } from '@ionic/angular';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
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
export class UserListComponent implements OnInit {
  /** Lista de usuarios cargados desde la API */
  users: User[] = [];

  /** Estado de carga del componente */
  isLoading = false;

  /** Término de búsqueda para filtrar usuarios */
  searchTerm = '';

  /** Estado del filtro de usuarios bloqueados */
  filterBloqueados: boolean | null = null;

  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
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
  toggleUserStatus(user: User, bloquear: boolean): void {
    const action = bloquear ? 'bloquear' : 'desbloquear';
    const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);

    this.userService.updateUserStatus(user.id, bloquear).subscribe({
      next: () => {
        // Actualizar el estado local del usuario
        user.bloqueado = bloquear;
        this.toastService.success(`Usuario ${actionCapitalized} exitosamente`);
      },
      error: () => {
        this.toastService.error(`Error al ${action} usuario`);
      }
    });
  }

  /**
   * Elimina un usuario del sistema
   *
   * @param user - Usuario a eliminar
   */
  deleteUser(user: User): void {
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        // Remover el usuario de la lista local
        this.users = this.users.filter(u => u.id !== user.id);
        this.toastService.success('Usuario eliminado exitosamente');
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

  /**
   * Obtiene el color del rol para mostrar en la UI
   *
   * @param role - Rol del usuario
   * @returns Color de Ionic
   */
  getRoleColor(role: string): string {
    switch (role) {
      case 'Administrador':
        return 'danger';
      case 'Gestor':
        return 'warning';
      case 'Cliente':
        return 'success';
      default:
        return 'medium';
    }
  }

  /**
   * Obtiene el ícono del rol
   *
   * @param role - Rol del usuario
   * @returns Nombre del ícono
   */
  getRoleIcon(role: string): string {
    switch (role) {
      case 'Administrador':
        return 'shield-checkmark-outline';
      case 'Gestor':
        return 'business-outline';
      case 'Cliente':
        return 'person-outline';
      default:
        return 'help-outline';
    }
  }

  /**
   * Formatea la fecha para mostrar
   *
   * @param dateString - Fecha en formato string
   * @returns Fecha formateada
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
