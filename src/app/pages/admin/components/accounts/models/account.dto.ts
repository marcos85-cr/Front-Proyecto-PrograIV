// DTOs para las cuentas bancarias

export interface AccountClient {
  id: number;
  direccion?: string;
  fechaNacimiento?: string;
  estado: string;
  fechaRegistro: string;
}

export interface AccountUser {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  identificacion?: string;
  rol: string;
}

export interface AccountGestor {
  id: number;
  nombre: string;
  email: string;
}

export interface Account {
  id: number;
  numero: string;
  tipo: string;
  moneda: string;
  saldo: number;
  estado: string;
  fechaApertura: string;
  cliente?: AccountClient;
  usuario?: AccountUser;
  gestor?: AccountGestor;
}

export interface AccountFilters {
  tipo?: string;
  moneda?: string;
  estado?: string;
}
