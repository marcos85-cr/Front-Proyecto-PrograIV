/**
 * Modelos para transferencias del cliente
 */

// Pre-validación de transferencia
export interface PreCheckTransferenciaRequest {
  cuentaOrigenId: number;
  cuentaDestinoNumero?: string;
  cuentaDestinoId?: number;
  beneficiarioId?: number;
  monto: number;
  moneda?: 'CRC' | 'USD';
}

export interface PreCheckTransferenciaResponse {
  esValida: boolean;
  nombreDestinatario?: string;
  saldoAntes: number;
  monto: number;
  comision: number;
  totalDebitar: number;
  montoTotal: number;
  saldoDespues: number;
  requiereAprobacion: boolean;
  limiteDisponible: number;
  mensaje?: string;
}

// Mantener compatibilidad
export type PreCheckResultDto = PreCheckTransferenciaResponse;

// Ejecutar transferencia
export interface EjecutarTransferenciaRequest {
  cuentaOrigenId: number;
  cuentaDestinoNumero?: string;
  cuentaDestinoId?: number;
  beneficiarioId?: number;
  monto: number;
  moneda?: 'CRC' | 'USD';
  descripcion?: string;
  programada?: boolean;
  fechaProgramada?: Date;
}

export interface TransferenciaEjecutadaDto {
  transaccionId: number;
  estado: string;
  requiereAprobacion?: boolean;
  comprobanteReferencia?: string;
  fechaCreacion: Date;
  fechaEjecucion?: Date;
}

// Detalle de transferencia
export interface TransferenciaTransaccionDetalleDto {
  id: number;
  tipo: string;
  estado: string;
  monto: number;
  moneda: string;
  comision: number;
  descripcion?: string;
  comprobanteReferencia?: string;
  fechaCreacion: Date;
  fechaEjecucion?: Date;
  cuentaOrigenNumero?: string;
  cuentaDestinoNumero?: string;
  beneficiarioAlias?: string;
  saldoAnterior: number;
  saldoPosterior: number;
}

// Lista de transferencias
export interface TransferenciaTransaccionListaDto {
  id: number;
  tipo: string;
  estado: string;
  monto: number;
  moneda: string;
  comision: number;
  descripcion?: string;
  comprobanteReferencia?: string;
  fechaCreacion: Date;
  fechaEjecucion?: Date;
}

// Estados de transferencia
export type EstadoTransferencia = 'Exitosa' | 'PendienteAprobacion' | 'Programada' | 'Fallida' | 'Cancelada';
