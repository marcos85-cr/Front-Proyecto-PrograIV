/**
 * Modelos para pagos de servicios
 */

// Proveedor de servicio
export interface ProveedorServicioDto {
  id: number;
  nombre: string;
  categoria?: string;
  formatoContrato?: string;
  reglaValidacionContrato: string;
}

// Validación de contrato
export interface ValidarContratoRequest {
  proveedorId: number;
  numeroContrato: string;
}

export interface ValidacionContratoResponse {
  esValido: boolean;
  mensaje: string;
  nombreProveedor?: string;
}

// Contrato validado (alias para respuesta)
export interface ContratoValidadoDto {
  esValido: boolean;
  mensaje?: string;
  nombreTitular?: string;
  saldoPendiente?: number;
  montoSugerido?: number;
  fechaVencimiento?: string;
}

// Realizar pago
export interface RealizarPagoRequest {
  cuentaOrigenId: number;
  proveedorId: number;
  proveedorServicioId?: number;
  numeroContrato: string;
  monto: number;
  descripcion?: string;
}

export interface PagoRealizadoDto {
  transaccionId: number;
  comprobanteReferencia: string;
  monto: number;
  comision: number;
  montoTotal: number;
  estado: string;
  fechaEjecucion?: Date;
  proveedor?: string;
  numeroContrato: string;
}

// Programar pago
export interface ProgramarPagoRequest {
  cuentaOrigenId: number;
  proveedorServicioId: number;
  numeroContrato: string;
  monto: number;
  fechaProgramada: Date;
  descripcion?: string;
}

export interface PagoProgramadoDto {
  transaccionId: number;
  estado: string;
  fechaProgramada: Date;
  monto: number;
  comision: number;
  proveedor?: string;
}

// Detalle de pago
export interface PagoDetalleDto {
  id: number;
  proveedor?: string;
  numeroContrato: string;
  monto: number;
  moneda: string;
  comision: number;
  estado: string;
  fechaCreacion: Date;
  fechaEjecucion?: Date;
  comprobanteReferencia: string;
  descripcion?: string;
}

// Lista de pagos
export interface PagoListaDto {
  id: number;
  proveedor?: string;
  numeroContrato: string;
  monto: number;
  moneda: string;
  comision: number;
  estado: string;
  fechaCreacion: Date;
  fechaEjecucion?: Date;
  comprobanteReferencia: string;
}
