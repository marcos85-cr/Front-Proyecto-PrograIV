import { Result } from './result.dto';

// Re-export Result for convenience
export { Result } from './result.dto';

// Dashboard Models
export interface GestorDashboard {
  myClients: number;
  activeAccounts: number;
  todayOperations: number;
  pendingApprovals: number;
  totalVolume: number;
}

export interface OperacionPendiente {
  id: number;
  clienteId: number;
  clienteNombre: string;
  tipo: string;
  descripcion?: string;
  monto: number;
  moneda: string;
  comision: number;
  estado: string;
  fecha: Date;
  cuentaOrigenNumero?: string;
  cuentaDestinoNumero?: string;
  requiereAprobacion: boolean;
  esUrgente: boolean;
}

// Client Models
export interface ClienteGestor {
  id: number;
  nombre: string;
  email: string;
  identificacion: string;
  telefono: string;
  cuentasActivas: number;
  ultimaOperacion?: Date;
  estado: string;
  volumenTotal: number;
}

export interface ClienteDetalleGestor {
  id: number;
  identificacion: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  fechaRegistro: Date;
  ultimaOperacion?: Date;
  cuentasActivas: number;
  volumenTotal: number;
  totalTransacciones: number;
  cuentas: CuentaSimple[];
}

export interface CuentaSimple {
  id: number;
  numero: string;
  tipo: string;
  moneda: string;
  saldo: number;
  estado: string;
  fechaApertura?: Date;
}

// Account Management Models
export interface CrearCuentaRequest {
  tipo: 'Ahorro' | 'Corriente';
  moneda: 'CRC' | 'USD';
  saldoInicial?: number;
}

export interface CuentaGestor {
  id: number;
  numero: string;
  tipo: string;
  moneda: string;
  saldo: number;
  estado: string;
  fechaApertura: Date;
  clienteId: number;
  clienteNombre: string;
}

// Transaction Models
export interface OperacionGestor {
  id: number;
  clienteId: number;
  clienteNombre: string;
  tipo: string;
  descripcion?: string;
  monto: number;
  moneda: string;
  comision: number;
  estado: string;
  fecha: Date;
  cuentaOrigenNumero?: string;
  cuentaDestinoNumero?: string;
  requiereAprobacion: boolean;
  esUrgente: boolean;
}

export interface OperacionDetalle extends OperacionGestor {
  fechaEjecucion?: Date;
  beneficiarioAlias?: string;
  comprobanteReferencia?: string;
  saldoAnterior: number;
  saldoPosterior: number;
}

export interface RechazarOperacionRequest {
  razon: string;
}

// Response Models
export interface ClientesResponse {
  data: ClienteGestor[];
  stats: {
    totalClients: number;
    totalAccounts: number;
    totalVolume: number;
  };
}

export interface OperacionesResponse {
  data: OperacionGestor[];
  summary: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface TransaccionGestor {
  id: number;
  tipo: string;
  descripcion?: string;
  monto: number;
  moneda: string;
  comision: number;
  estado: string;
  fecha: Date;
  fechaEjecucion?: Date;
  cuentaOrigenNumero?: string;
  cuentaDestinoNumero?: string;
  comprobanteReferencia?: string;
}

export interface OperacionResultado {
  id: number;
  estado: string;
  fechaEjecucion?: Date;
}

export interface CuentaCreadaGestor {
  id: number;
  numero: string;
  tipo: string;
  moneda: string;
  saldo: number;
  estado: string;
  clienteId: number;
  clienteNombre: string;
  fechaApertura: Date;
}

// Filter Models
export interface ClienteFilters {
  nombre?: string;
  identificacion?: string;
  email?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface OperacionFilters {
  clienteId?: number;
  estado?: string;
  tipo?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  page?: number;
  limit?: number;
}

export interface TransaccionFilters {
  tipo?: string;
  estado?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  page?: number;
  limit?: number;
}

// API Response Types
export type GestorDashboardResponse = Result<GestorDashboard>;
export type OperacionesPendientesResponse = Result<OperacionPendiente[]>;
export type ClientesGestorResponse = Result<ClientesResponse>;
export type ClienteDetalleResponse = Result<ClienteDetalleGestor>;
export type CuentasClienteResponse = Result<CuentaGestor[]>;
export type TransaccionesClienteResponse = Result<TransaccionGestor[]>;
export type OperacionesGestorResponse = Result<OperacionesResponse>;
export type OperacionDetalleResponse = Result<OperacionDetalle>;
export type CrearCuentaResponse = Result<CuentaCreadaGestor>;
export type OperacionResultadoResponse = Result<OperacionResultado>;