/**
 * Modelos para gestión de cuentas del cliente
 * Los atributos se mantienen en español según especificación de API
 */

// Cuenta en lista
export interface CuentaListaDto {
  id: number;
  numero: string;
  tipo: 'Ahorro' | 'Corriente';
  moneda: 'CRC' | 'USD';
  saldo: number;
  estado: 'Activa' | 'Bloqueada' | 'Cerrada';
  fechaApertura?: Date;
  titular?: string;
  clienteId?: number;
  limiteDiario: number;
  saldoDisponible?: number;
}

// Cuenta completa con relaciones
export interface CuentaCompletaDto {
  id: number;
  numero: string;
  iban: string;
  tipo: string;
  moneda: string;
  saldo: number;
  estado: string;
  fechaApertura?: string;
  cliente?: CuentaRelacionClienteDto;
  usuario?: CuentaRelacionUsuarioDto;
  gestor?: CuentaRelacionGestorDto;
}

export interface CuentaRelacionClienteDto {
  id: number;
  direccion?: string;
  fechaNacimiento?: Date;
  estado: string;
  fechaRegistro: Date;
}

export interface CuentaRelacionUsuarioDto {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  identificacion?: string;
  rol: string;
}

export interface CuentaRelacionGestorDto {
  id: number;
  nombre: string;
  email: string;
}

// Balance de cuenta
export interface CuentaBalanceDto {
  saldo: number;
  total: number;
  disponible: number;
  retenido: number;
  moneda: string;
}

// Crear cuenta
export interface CrearCuentaRequest {
  tipo: 'Ahorro' | 'Corriente';
  moneda: 'CRC' | 'USD';
  saldoInicial?: number;
}

export interface CuentaCreacionDto {
  id: number;
  numero: string;
  tipo: string;
  moneda: string;
  saldo: number;
  estado: string;
}

// Estado de cuenta (bloquear/cerrar)
export interface CuentaEstadoDto {
  id: number;
  numero: string;
  estado: string;
  mensaje: string;
}
