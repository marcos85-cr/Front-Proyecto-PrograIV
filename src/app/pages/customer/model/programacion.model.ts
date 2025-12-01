/**
 * Modelos para operaciones programadas
 */

// Lista de programaciones
export interface ProgramacionListaDto {
  transaccionId: number;
  tipo?: string;
  monto?: number;
  moneda?: string;
  descripcion?: string;
  fechaProgramada: Date;
  fechaLimiteCancelacion: Date;
  estadoJob: string;
  puedeCancelarse: boolean;
}

// Detalle de programación
export interface ProgramacionDetalleDto {
  id: number;
  transaccionId: number;
  tipo?: string;
  monto?: number;
  moneda?: string;
  descripcion?: string;
  fechaProgramada: Date;
  fechaLimiteCancelacion: Date;
  estadoJob: string;
  puedeCancelarse: boolean;
  cuentaOrigen?: string;
  cuentaDestino?: string;
}

// Estados de programación
export type EstadoJob = 'Pendiente' | 'Ejecutado' | 'Cancelado' | 'Fallido';
