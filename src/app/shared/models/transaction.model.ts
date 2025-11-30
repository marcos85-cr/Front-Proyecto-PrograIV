

export enum TransactionType {
  TRANSFERENCIA = 'Transferencia',
  PAGO_SERVICIO = 'Pago de Servicio',
  DEPOSITO = 'Depósito',
  RETIRO = 'Retiro'
}

export enum TransactionStatus {
  PENDIENTE_APROBACION = 'PendienteAprobacion',
  PROGRAMADA = 'Programada',
  EXITOSA = 'Exitosa',
  FALLIDA = 'Fallida',
  CANCELADA = 'Cancelada',
  RECHAZADA = 'Rechazada'
}

export interface Transaction {
  id: string;
  tipo: TransactionType;
  cuentaOrigenId: string;
  cuentaOrigenNumero: string;
  cuentaDestinoId?: string;
  cuentaDestinoNumero?: string;
  beneficiarioNombre?: string;
  monto: number;
  moneda: string;
  comision: number;
  montoTotal: number;
  estado: TransactionStatus;
  descripcion?: string;
  fecha: Date;
  fechaProgramada?: Date;
  numeroReferencia: string;
  idempotencyKey?: string;
}

export interface TransferRequest {
  cuentaOrigenId: string;
  cuentaDestinoId?: string;
  beneficiarioId?: string;
  monto: number;
  descripcion?: string;
  programada: boolean;
  fechaProgramada?: Date;
  idempotencyKey: string;
}

export interface TransferPrecheck {
  saldoAntes: number;
  monto: number;
  comision: number;
  montoTotal: number;
  saldoDespues: number;
  limiteDisponible: number;
  puedeEjecutar: boolean;
  requiereAprobacion: boolean;
  mensaje?: string;
}