/**
 * Modelo de usuario para el sistema bancario
 */
export interface User {
  id: string;
  email: string;
  role: 'Administrador' | 'Gestor' | 'Cliente';
  nombre: string;
  identificacion: string;
  telefono: string;
  bloqueado: boolean;
  intentosFallidos: number;
  fechaCreacion: string;
  cuentasActivas: number;
}


/**
 * Filtros para búsqueda de usuarios
 */
export interface UserFilters {
  email?: string;
  role?: string;
  bloqueado?: boolean;
  page?: number;
  limit?: number;
}
