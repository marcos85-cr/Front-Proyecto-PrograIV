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

// Volumen Diario - /reports/daily-volume
export interface ReporteVolumenDiario {
  resumen: {
    periodo: {
      desde: string;
      hasta: string;
    };
    totalDias: number;
    promedioDiarioCantidad: number;
    promedioDiarioMontoCRC: number;
    promedioDiarioMontoUSD: number;
  };
  volumenDiario: VolumenDiarioDetalle[];
}

export interface VolumenDiarioDetalle {
  fecha: string;
  cantidadTransacciones: number;
  montoTotalCRC: number;
  montoTotalUSD: number;
  comisionesTotales: number;
}

// Clientes más activos - /reports/most-active-clients
export interface ClientesActivosResponse {
  periodo: {
    desde: string;
    hasta: string;
  };
  top: number;
  clientesMasActivos: ClienteActivo[];
}

export interface ClienteActivo {
  clienteId: number;
  clienteNombre: string;
  clienteEmail: string;
  totalTransacciones: number;
  transaccionesExitosas: number;
  montoTotalCRC: number;
  montoTotalUSD: number;
  ultimaTransaccion: string;
}

// Totales del período - /reports/period-totals
export interface ReporteTotalesPeriodo {
  periodo: {
    desde: string;
    hasta: string;
  };
  transacciones: {
    total: number;
    exitosas: number;
    fallidas: number;
    pendientes: number;
  };
  montos: {
    totalCRC: number;
    totalUSD: number;
    comisionesTotales: number;
  };
  porTipo: TotalPorTipo[];
}

export interface TotalPorTipo {
  tipo: string;
  cantidad: number;
  montoCRC: number;
  montoUSD: number;
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
