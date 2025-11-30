export enum HighValueOperationType {
  TRANSFERENCIA_MASIVA = 'Transferencia Masiva',
  TRANSFERENCIA_INTERNACIONAL = 'Transferencia Internacional',
  RETIRO_EFECTIVO_GRANDE = 'Retiro de Efectivo Grande',
  DEPOSITO_MASIVO = 'Depósito Masivo',
  OPERACION_SOSPECHOSA = 'Operación Sospechosa',
  CAMBIO_LIMITE = 'Cambio de Límite',
  CIERRE_CUENTA = 'Cierre de Cuenta',
}

export enum HighValueOperationStatus {
  PENDIENTE = 'Pendiente',
  VERIFICADA = 'Verificada',
  APROBADA = 'Aprobada',
  RECHAZADA = 'Rechazada',
  BLOQUEADA = 'Bloqueada',
  COMPLETADA = 'Completada',
}

export enum RiskLevel {
  BAJO = 'Bajo',
  MEDIO = 'Medio',
  ALTO = 'Alto',
  CRITICO = 'Crítico',
}

export interface HighValueOperation {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  tipo: string;
  monto: number;
  moneda: string;
  estado: HighValueOperationStatus;
  nivelRiesgo: RiskLevel;
  descripcion: string;
  detalles: {
    cuentaOrigen?: string;
    cuentaDestino?: string;
    banco?: string;
    pais?: string;
    motivo?: string;
    [key: string]: any;
  };
  flagsRiesgo: string[]; // ['Monto inusual', 'Transferencia internacional', etc]
  razonBloqueo?: string;
  notas: string;
  creadoEn: Date;
  actualizadoEn: Date;
  aprobadoPor?: string;
  rechazadoPor?: string;
  razonRechazo?: string;
  requiereVerificacionAdicional: boolean;
  verificacionAdicional?: {
    tipo: string;
    estado: 'Pendiente' | 'Completada' | 'Fallida';
    fecha?: Date;
  };
}

export interface ApproveOperationRequest {
  operacionId: string;
  notas?: string;
}

export interface RejectOperationRequest {
  operacionId: string;
  razon: string;
  notas?: string;
}

export interface BlockOperationRequest {
  operacionId: string;
  razon: string;
  notas?: string;
}