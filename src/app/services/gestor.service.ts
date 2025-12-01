import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandlerService } from './error-handler.service';
import { environment } from 'src/environments/environment';

// Import models from shared
import {
  GestorDashboard,
  OperacionPendiente,
  ClienteGestor,
  ClienteDetalleGestor,
  CuentaGestor,
  OperacionGestor,
  OperacionDetalle,
  CrearCuentaRequest,
  RechazarOperacionRequest,
  TransaccionGestor,
  ClientesResponse,
  OperacionesResponse,
  OperacionResultado,
  CuentaCreadaGestor,
  ClienteFilters,
  OperacionFilters,
  TransaccionFilters,
  Result
} from '../shared/models/gestor.model';

@Injectable({
  providedIn: 'root'
})
export class GestorService {
  private readonly baseUrl = `${environment.apiUrl}/gestor`;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  // ============================================
  // DASHBOARD METHODS
  // ============================================

  /**
   * Obtiene estadísticas del dashboard del gestor
   */
  getDashboardStats(): Observable<Result<GestorDashboard>> {
    const url = `${this.baseUrl}/dashboard/stats`;
    return this.http.get<Result<GestorDashboard>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene operaciones pendientes de aprobación
   */
  getPendingOperations(): Observable<Result<OperacionPendiente[]>> {
    const url = `${this.baseUrl}/operaciones-pendientes`;
    return this.http.get<Result<OperacionPendiente[]>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  // ============================================
  // CLIENTES METHODS
  // ============================================

  /**
   * Obtiene todos los clientes asignados al gestor
   */
  getClientes(filters?: ClienteFilters): Observable<Result<ClientesResponse>> {
    const url = this.buildUrlWithFilters(`${this.baseUrl}/mis-clientes`, filters);
    return this.http.get<Result<ClientesResponse>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene detalle de un cliente específico
   */
  getClienteDetalle(id: number): Observable<Result<ClienteDetalleGestor>> {
    const url = `${this.baseUrl}/clientes/${id}`;
    return this.http.get<Result<ClienteDetalleGestor>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene las cuentas de un cliente
   */
  getCuentasCliente(clienteId: number): Observable<Result<CuentaGestor[]>> {
    const url = `${this.baseUrl}/clientes/${clienteId}/cuentas`;
    return this.http.get<Result<CuentaGestor[]>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene historial de transacciones de un cliente
   */
  getTransaccionesCliente(
    clienteId: number,
    filters?: TransaccionFilters
  ): Observable<Result<TransaccionGestor[]>> {
    const url = this.buildUrlWithFilters(`${this.baseUrl}/clientes/${clienteId}/transacciones`, filters);
    return this.http.get<Result<TransaccionGestor[]>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Crea una nueva cuenta para un cliente
   */
  crearCuenta(clienteId: number, request: CrearCuentaRequest): Observable<Result<CuentaCreadaGestor>> {
    const url = `${this.baseUrl}/clientes/${clienteId}/cuentas`;
    return this.http.post<Result<CuentaCreadaGestor>>(url, request).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  // ============================================
  // OPERACIONES METHODS
  // ============================================

  /**
   * Obtiene todas las operaciones de clientes de la cartera
   */
  getOperaciones(filters?: OperacionFilters): Observable<Result<OperacionesResponse>> {
    const url = this.buildUrlWithFilters(`${this.baseUrl}/operaciones`, filters);
    return this.http.get<Result<OperacionesResponse>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene detalle de una operación específica
   */
  getOperacionDetalle(id: number): Observable<Result<OperacionDetalle>> {
    const url = `${this.baseUrl}/operaciones/${id}`;
    return this.http.get<Result<OperacionDetalle>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Aprueba una operación pendiente
   */
  aprobarOperacion(id: number): Observable<Result<OperacionResultado>> {
    const url = `${this.baseUrl}/operaciones/${id}/aprobar`;
    return this.http.put<Result<OperacionResultado>>(url, {}).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Rechaza una operación pendiente
   */
  rechazarOperacion(id: number, razon: string): Observable<Result<OperacionResultado>> {
    const url = `${this.baseUrl}/operaciones/${id}/rechazar`;
    const request: RechazarOperacionRequest = { razon };
    return this.http.put<Result<OperacionResultado>>(url, request).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Construye URL con parámetros de filtrado
   */
  private buildUrlWithFilters(baseUrl: string, filters?: any): string {
    if (!filters || Object.keys(filters).length === 0) {
      return baseUrl;
    }

    const params = new HttpParams();

    // Add filters to params
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Verifica si una operación puede ser aprobada por el gestor (límite de 5 millones)
   */
  puedeAprobarOperacion(monto: number, moneda: string): boolean {
    const LIMITE_APROBACION_CRC = 5000000; // 5 millones de colones
    const LIMITE_APROBACION_USD = 8000; // Aproximado, puede ajustarse

    if (moneda === 'CRC') {
      return monto <= LIMITE_APROBACION_CRC;
    } else if (moneda === 'USD') {
      return monto <= LIMITE_APROBACION_USD;
    }
    return false;
  }

  /**
   * Obtiene el límite de aprobación para una moneda
   */
  getLimiteAprobacion(moneda: string): number {
    if (moneda === 'CRC') return 5000000;
    if (moneda === 'USD') return 8000;
    return 0;
  }

  /**
   * Formatea el mensaje de error de límite excedido
   */
  getMensajeLimiteExcedido(monto: number, moneda: string): string {
    const limite = this.getLimiteAprobacion(moneda);
    const simbolo = moneda === 'CRC' ? '₡' : '$';
    return `El monto ${simbolo}${monto.toLocaleString()} excede el límite de autorización del gestor (${simbolo}${limite.toLocaleString()}). Requiere aprobación de un administrador.`;
  }
}
