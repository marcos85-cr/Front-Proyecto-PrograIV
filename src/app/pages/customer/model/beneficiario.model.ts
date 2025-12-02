/**
 * Modelos para gestión de beneficiarios
 */

// Crear beneficiario
export interface CrearBeneficiarioRequest {
  alias: string;
  banco: string;
  moneda: 'CRC' | 'USD';
  numeroCuentaDestino: string;
  pais?: string;
}

export interface BeneficiarioCreacionDto {
  id: number;
  alias: string;
  banco: string;
  numeroCuenta: string;
  estado: string;
}

// Confirmación de beneficiario
export interface BeneficiarioConfirmacionDto {
  id: number;
  alias: string;
  estado: string;
}

// Lista de beneficiarios
export interface BeneficiarioListaDto {
  id: number;
  alias: string;
  banco: string;
  moneda: string;
  numeroCuenta: string;
  nombreDestinatario: string;
  pais?: string;
  estado: 'Inactivo' | 'Confirmado' | 'Rechazado';
  fechaCreacion: Date;
}

// Detalle de beneficiario
export interface BeneficiarioDetalleDto {
  id: number;
  alias: string;
  banco: string;
  moneda: string;
  numeroCuenta: string;
  pais?: string;
  estado: string;
  fechaCreacion: Date;
  tieneOperacionesPendientes: boolean;
}

// Actualizar beneficiario
export interface ActualizarBeneficiarioRequest {
  nuevoAlias: string;
}

export interface BeneficiarioActualizacionDto {
  id: number;
  alias: string;
  estado: string;
}

// Estados de beneficiario
export type EstadoBeneficiario = 'Inactivo' | 'Confirmado' | 'Rechazado';
