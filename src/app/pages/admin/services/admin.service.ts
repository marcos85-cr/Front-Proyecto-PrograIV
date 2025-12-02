import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { Result } from '../../../shared/models/result.dto';
import {
  EstadisticasDashboard,
  EstadisticasOperativas,
  UsuarioLista,
  CrearUsuarioRequest,
  CambiarContrasenaRequest,
  BeneficiarioAdmin,
  Proveedor,
  CrearProveedorRequest,
  ActualizarProveedorRequest,
  RegistroAuditoria,
  FiltrosAuditoria
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly adminUrl = `${environment.apiUrl}/admin`;
  private readonly usersUrl = `${environment.apiUrl}/users`;
  private readonly beneficiariosUrl = `${environment.apiUrl}/beneficiarios`;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  // ==================== DASHBOARD ====================

  getDashboardStats(): Observable<Result<EstadisticasDashboard>> {
    return this.http.get<Result<EstadisticasDashboard>>(`${this.adminUrl}/dashboard/stats`).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getDashboardStats'))
    );
  }

  getOperationalStats(): Observable<Result<EstadisticasOperativas>> {
    return this.http.get<Result<EstadisticasOperativas>>(`${environment.apiUrl}/reports/dashboard-stats`).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getOperationalStats'))
    );
  }

  // ==================== USUARIOS ====================

  getUsers(): Observable<Result<UsuarioLista[]>> {
    return this.http.get<Result<UsuarioLista[]>>(`${this.adminUrl}/usuarios`).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getUsers'))
    );
  }

  createUser(data: CrearUsuarioRequest): Observable<Result> {
    return this.http.post<Result>(this.usersUrl, data).pipe(
      catchError(error => this.errorHandler.handleError(error, 'createUser'))
    );
  }

  unlockUser(usuarioId: number): Observable<Result> {
    return this.http.put<Result>(`${this.adminUrl}/usuarios/${usuarioId}/desbloquear`, {}).pipe(
      catchError(error => this.errorHandler.handleError(error, 'unlockUser'))
    );
  }

  changePassword(data: CambiarContrasenaRequest): Observable<Result> {
    return this.http.post<Result>(`${this.usersUrl}/change-password`, data).pipe(
      catchError(error => this.errorHandler.handleError(error, 'changePassword'))
    );
  }

  // ==================== BENEFICIARIOS ====================

  getBeneficiarios(confirmado?: boolean): Observable<Result<BeneficiarioAdmin[]>> {
    let params = new HttpParams();
    if (confirmado !== undefined) {
      params = params.append('confirmado', confirmado.toString());
    }
    return this.http.get<Result<BeneficiarioAdmin[]>>(this.beneficiariosUrl, { params }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getBeneficiarios'))
    );
  }

  confirmBeneficiary(id: number): Observable<Result> {
    return this.http.put<Result>(`${this.beneficiariosUrl}/${id}/confirmar`, {}).pipe(
      catchError(error => this.errorHandler.handleError(error, 'confirmBeneficiary'))
    );
  }

  // ==================== PROVEEDORES ====================

  getProviders(): Observable<Result<Proveedor[]>> {
    return this.http.get<Result<Proveedor[]>>(`${this.adminUrl}/proveedores`).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getProviders'))
    );
  }

  createProvider(data: CrearProveedorRequest): Observable<Result<Proveedor>> {
    return this.http.post<Result<Proveedor>>(`${this.adminUrl}/proveedores`, data).pipe(
      catchError(error => this.errorHandler.handleError(error, 'createProvider'))
    );
  }

  updateProvider(id: number, data: ActualizarProveedorRequest): Observable<Result<Proveedor>> {
    return this.http.put<Result<Proveedor>>(`${this.adminUrl}/proveedores/${id}`, data).pipe(
      catchError(error => this.errorHandler.handleError(error, 'updateProvider'))
    );
  }

  deleteProvider(id: number): Observable<Result> {
    return this.http.delete<Result>(`${this.adminUrl}/proveedores/${id}`).pipe(
      catchError(error => this.errorHandler.handleError(error, 'deleteProvider'))
    );
  }

  // ==================== AUDITORÍA ====================

  getAuditLogs(filters?: FiltrosAuditoria): Observable<Result<RegistroAuditoria[]>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.fechaInicio) params = params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params = params.append('fechaFin', filters.fechaFin);
      if (filters.tipoOperacion) params = params.append('tipoOperacion', filters.tipoOperacion);
    }
    return this.http.get<Result<RegistroAuditoria[]>>(`${this.adminUrl}/auditoria`, { params }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getAuditLogs'))
    );
  }

  getUserAudit(usuarioId: number): Observable<Result<RegistroAuditoria[]>> {
    return this.http.get<Result<RegistroAuditoria[]>>(`${this.adminUrl}/auditoria/usuario/${usuarioId}`).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getUserAudit'))
    );
  }

  // ==================== CUENTAS ====================

  closeAccount(id: number): Observable<Result> {
    return this.http.delete<Result>(`${environment.apiUrl}/cuentas/${id}`).pipe(
      catchError(error => this.errorHandler.handleError(error, 'closeAccount'))
    );
  }

  // ==================== TRANSFERENCIAS ====================

  getPendingTransfers(): Observable<Result> {
    return this.http.get<Result>(`${this.adminUrl}/operaciones`).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getPendingTransfers'))
    );
  }

  aprobarTransferencia(id: number): Observable<Result> {
    return this.http.put<Result>(`${environment.apiUrl}/transferencias/${id}/aprobar`, {}).pipe(
      catchError(error => this.errorHandler.handleError(error, 'aprobarTransferencia'))
    );
  }

  rechazarTransferencia(id: number, razon: string): Observable<Result> {
    return this.http.put<Result>(`${environment.apiUrl}/transferencias/${id}/rechazar`, { razon }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'rechazarTransferencia'))
    );
  }
}
