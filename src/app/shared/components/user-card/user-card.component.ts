import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule
  ]
})
export class UserCardComponent {
  @Input({ required: true }) user: User = {} as User;

  @Input() showActions: boolean = true;

  @Input() compact: boolean = false;

  @Input() actions: Array<{
    label: string;
    icon: string;
    color: string;
    action: () => void;
  }> = [];

  @Output() action = new EventEmitter<{
    type: string;
    user: User;
    data?: any;
  }>();

  /**
   * Maneja una acción específica
   *
   * @param action - Datos de la acción
   */
  handleAction(actionItem: any): void {
    if (actionItem.action) {
      actionItem.action();
    } else {
      this.action.emit({
        type: actionItem.label.toLowerCase(),
        user: this.user
      });
    }
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
