/**
 * Constantes para roles de usuarios del sistema bancario
 */
export const USER_ROLES = {
  ADMINISTRADOR: 'Administrador',
  GESTOR: 'Gestor',
  CLIENTE: 'Cliente'
} as const;

// Array de roles para usar en selects y validaciones
export const AVAILABLE_ROLES = [
  USER_ROLES.ADMINISTRADOR,
  USER_ROLES.GESTOR,
  USER_ROLES.CLIENTE
] as const;

// Type para los roles de usuario
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Utilidades para roles
export const ROLES_UTILS = {
  /**
   * Verifica si un rol es válido
   */
  isValidRole(role: string): role is UserRole {
    return AVAILABLE_ROLES.includes(role as UserRole);
  },

  /**
   * Obtiene el color asociado a un rol
   */
  getRoleColor(role: UserRole): string {
    switch (role) {
      case USER_ROLES.ADMINISTRADOR:
        return 'danger';
      case USER_ROLES.GESTOR:
        return 'warning';
      case USER_ROLES.CLIENTE:
        return 'success';
      default:
        return 'medium';
    }
  },

  /**
   * Obtiene el ícono asociado a un rol
   */
  getRoleIcon(role: UserRole): string {
    switch (role) {
      case USER_ROLES.ADMINISTRADOR:
        return 'shield-checkmark-outline';
      case USER_ROLES.GESTOR:
        return 'business-outline';
      case USER_ROLES.CLIENTE:
        return 'person-outline';
      default:
        return 'help-outline';
    }
  }
};