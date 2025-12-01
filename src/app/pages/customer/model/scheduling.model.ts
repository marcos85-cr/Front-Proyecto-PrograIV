/**
 * Modelos para operaciones programadas
 *
 * NOTA: Los nombres de las interfaces y atributos están en español
 * ya que corresponden a la estructura de datos del API backend.
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
