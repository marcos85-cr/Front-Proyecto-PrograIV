export interface Customer {
  id: number;
  usuarioId: number;
  identificacion: string;
  nombreCompleto: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fechaNacimiento?: string;
  estado: 'Activo' | 'Inactivo';
  fechaRegistro: string;
  cuentasActivas: number;
  gestorId?: number;
  gestorNombre?: string;
  cuentas?: CustomerAccount[];
}

export interface CustomerAccount {
  id?: number;
  tipo: string;
  moneda: string;
  saldoInicial: number;
}

export interface CustomerRequest {
  direccion: string;
  fechaNacimiento: string;
  usuarioId: number;
  gestorId?: number;
  cuentas?: CustomerAccount[];
}
