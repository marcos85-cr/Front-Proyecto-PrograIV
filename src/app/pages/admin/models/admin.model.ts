/**
 * Modelos para el módulo de administración
 */

// Dashboard
export interface EstadisticasDashboard {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosBloqueados: number;
  totalClientes: number;
  totalCuentas: number;
  cuentasActivas: number;
  totalProveedores: number;
  operacionesHoy: number;
  volumenTotal: number;
}

export interface EstadisticasOperativas {
  transaccionesHoy: number;
  montoTotalHoy: number;
  clientesActivos: number;
  operacionesPendientes: number;
  alertasSistema: number;
}

// Usuarios
export interface UsuarioLista {
  id: number;
  email: string;
  rol: string;
  estaBloqueado: boolean;
  fechaCreacion: string;
  ultimoAcceso: string;
  intentosFallidos: number;
}

export interface CrearUsuarioRequest {
  email: string;
  password: string;
  rol: 'Cliente' | 'Gestor' | 'Administrador';
}

export interface CambiarContrasenaRequest {
  usuarioId: number;
  oldPassword?: string;
  newPassword: string;
}

// Beneficiarios Admin
export interface BeneficiarioAdmin {
  id: number;
  clienteId: number;
  clienteNombre: string;
  nombreCompleto: string;
  cuentaDestino: string;
  numeroCuenta: string;
  banco: string;
  tipoCuenta: string;
  alias: string;
  confirmado: boolean;
  fechaCreacion: string;
  fechaConfirmacion?: string;
  tieneOperacionesPendientes: boolean;
}

// Proveedores
export interface Proveedor {
  id: number;
  nombre: string;
  reglaValidacionContrato: string;
  formatoContrato: string;
}

export interface CrearProveedorRequest {
  nombre: string;
  reglaValidacionContrato: string;
  formatoContrato: string;
}

export interface ActualizarProveedorRequest {
  nombre?: string;
  reglaValidacion?: string;
  formatoContrato?: string;
}

// Auditoría
export interface RegistroAuditoria {
  id: number;
  fecha: string;
  fechaHora: string;
  tipoOperacion: string;
  descripcion: string;
  usuarioId: number;
  usuario: string;
  usuarioEmail: string;
  ip: string;
  detalles: string;
  detalleJson: string;
}

export interface AuditoriaResumen {
  id: number;
  fechaHora: string;
  tipoOperacion: string;
  descripcion: string;
}

export interface FiltrosAuditoria {
  fechaInicio?: string;
  fechaFin?: string;
  tipoOperacion?: string;
}

// Reportes
export interface FiltrosReporteTransacciones {
  startDate?: string;
  endDate?: string;
  tipo?: string;
  estado?: string;
  clienteId?: number;
}

export interface ReporteVolumenDiario {
  totalDia: number;
  cantidadOperaciones: number;
  promedioOperacion: number;
  periodo: {
    inicio: string;
    fin: string;
  };
  resumenGeneral: {
    totalDias: number;
    totalTransacciones: number;
    montoTotal: number;
    promedioTransaccionesDiarias: number;
    promedioMontoDiario: number;
  };
  detallesDiarios: DetalleDiario[];
  tendencias: {
    diaConMasTransacciones: { fecha: string; cantidad: number };
    diaConMayorVolumen: { fecha: string; monto: number };
  };
}

export interface DetalleDiario {
  fecha: string;
  transacciones: number;
  montoTotal: number;
  porTipo: {
    Transferencia: number;
    PagoServicio: number;
    Retiro: number;
    Deposito: number;
  };
}

export interface ClienteActivo {
  posicion: number;
  clienteId: number;
  clienteNombre: string;
  nombreCliente: string;
  clienteEmail: string;
  totalTransacciones: number;
  cantidadOperaciones: number;
  montoTotal: number;
  montoPromedio: number;
  tipoMasFrecuente: string;
  ultimaOperacion: string;
}

export interface ReporteTotalesPeriodo {
  totalTransacciones: number;
  montoTotal: number;
  promedioTransaccion: number;
  clientesUnicos: number;
  periodo: {
    inicio: string;
    fin: string;
    totalDias: number;
  };
  totales: {
    totalTransacciones: number;
    montoTotal: number;
    totalComisiones: number;
    montoPromedioPorTransaccion: number;
  };
  porTipo: TotalPorTipo[];
  porEstado: TotalPorEstado[];
  tendencias: {
    crecimientoRespectoPeriodoAnterior: number;
    transaccionesPorDia: number;
    montoPorDia: number;
  };
}

export interface TotalPorTipo {
  tipo: string;
  cantidad: number;
  monto: number;
  comisiones: number;
  porcentaje: number;
}

export interface TotalPorEstado {
  estado: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
}

// Extracto de cuenta
export interface ExtractoCuenta {
  numeroCuenta: string;
  cliente: string;
  fechaInicio: string;
  fechaFin: string;
  saldoInicial: number;
  saldoFinal: number;
  moneda: string;
  transacciones: TransaccionExtracto[];
  totalDebitos: number;
  totalCreditos: number;
}

export interface TransaccionExtracto {
  fecha: string;
  descripcion: string;
  referencia: string;
  debito: number | null;
  credito: number | null;
  saldo: number;
}

// Resumen de cliente
export interface ResumenCliente {
  cliente: {
    id: number;
    nombre: string;
    email: string;
    identificacion: string;
    telefono: string;
    fechaRegistro: string;
  };
  cuentas: CuentaResumen[];
  beneficiarios: BeneficiarioResumen[];
  estadisticas: {
    totalTransacciones: number;
    montoTotalTransferido: number;
    ultimaOperacion: string;
    promedioMensual: number;
  };
}

export interface CuentaResumen {
  id: number;
  numeroCuenta: string;
  tipoCuenta: string;
  moneda: string;
  saldo: number;
  estado: string;
  fechaApertura: string;
}

export interface BeneficiarioResumen {
  id: number;
  numeroCuenta: string;
  banco: string;
  alias: string;
  confirmado: boolean;
}
