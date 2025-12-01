/**
 * Modelos para reportes y extractos
 */

import { CuentaListaDto } from './cuenta.model';

// Extracto de cuenta
export interface ExtractoCuentaDto {
  cuenta?: CuentaListaDto;
  periodo?: PeriodoDto;
  saldoInicial?: number;
  saldoFinal?: number;
  totalCreditos?: number;
  totalDebitos?: number;
  saldo?: SaldoResumenDto;
  movimientos?: MovimientoDto[];
  resumen?: ResumenExtractoDto;
}

export interface PeriodoDto {
  desde: Date;
  hasta: Date;
}

export interface SaldoResumenDto {
  inicial: number;
  final: number;
}

export interface MovimientoDto {
  id: number;
  fecha: Date;
  tipo: 'Credito' | 'Debito' | string;
  descripcion?: string;
  monto: number;
  comision?: number;
  referencia?: string;
  estado?: string;
}

export interface ResumenExtractoDto {
  totalTransacciones: number;
  totalDebitos: number;
  totalCreditos: number;
}

// Resumen del cliente
export interface ResumenClienteDto {
  cliente?: ClienteInfoDto;
  patrimonioTotalCRC?: number;
  patrimonioTotalUSD?: number;
  cuentas?: CuentaListaDto[];
  ingresosMes?: number;
  gastosMes?: number;
  transferenciasMes?: number;
  pagosMes?: number;
  ultimasTransacciones?: TransaccionResumenDto[];
  actividad?: ResumenActividadDto;
}

export interface TransaccionResumenDto {
  id: number;
  tipo: 'Credito' | 'Debito' | string;
  descripcion: string;
  monto: number;
  moneda: string;
  fecha: Date;
}

export interface ClienteInfoDto {
  id: number;
  nombre: string;
  identificacion: string;
  correo: string;
  telefono?: string;
  fechaRegistro: Date;
}

export interface ResumenCuentasDto {
  total: number;
  activas: number;
  saldoTotalCRC: number;
  saldoTotalUSD: number;
  detalle: CuentaListaDto[];
}

export interface ResumenActividadDto {
  totalTransacciones: number;
  transaccionesUltimoMes: number;
  montoTransferidoMes: number;
  ultimaTransaccion?: Date;
}

// Formato de exportación
export type FormatoExportacion = 'json' | 'pdf' | 'csv';
