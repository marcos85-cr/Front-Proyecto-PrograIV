import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { environment } from 'src/environments/environment';
import { Result } from '../../../shared/models/result.dto';
import {
  CuentaListaDto,
  CuentaCompletaDto,
  CuentaBalanceDto,
  CrearCuentaRequest,
  CuentaCreacionDto,
  CuentaEstadoDto
} from '../model/account.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerAccountsService {
  private readonly baseUrl = environment.apiUrl + '/cuentas';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Obtiene las cuentas propias del cliente autenticado
   */
  getMisCuentas(): Observable<Result<CuentaListaDto[]>> {
    const url = `${this.baseUrl}/my-accounts`;
    return this.http.get<Result<CuentaListaDto[]>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el detalle completo de una cuenta específica
   * @param id - ID de la cuenta
   */
  getAccountById(id: number): Observable<Result<CuentaCompletaDto>> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<Result<CuentaCompletaDto>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el balance de una cuenta
   * @param id - ID de la cuenta
   */
  getBalance(id: number): Observable<Result<CuentaBalanceDto>> {
    const url = `${this.baseUrl}/${id}/balance`;
    return this.http.get<Result<CuentaBalanceDto>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Crea una nueva cuenta propia
   * @param data - Datos para crear la cuenta
   */
  createAccount(data: CrearCuentaRequest): Observable<Result<CuentaCreacionDto>> {
    return this.http.post<Result<CuentaCreacionDto>>(this.baseUrl, data).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'createAccount'))
    );
  }

  /**
   * Bloquea o desbloquea una cuenta propia (toggle)
   * @param id - ID de la cuenta
   */
  toggleBloqueo(id: number): Observable<Result<CuentaEstadoDto>> {
    const url = `${this.baseUrl}/${id}/block`;
    return this.http.put<Result<CuentaEstadoDto>>(url, {}).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Cierra una cuenta propia (saldo debe ser 0)
   * @param id - ID de la cuenta
   */
  cerrarCuenta(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}/close`;
    return this.http.put<Result>(url, {}).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Alias en inglés para toggleBloqueo
   */
  toggleLock(id: number): Observable<Result<CuentaEstadoDto>> {
    return this.toggleBloqueo(id);
  }

  /**
   * Alias en inglés para cerrarCuenta
   */
  closeAccount(id: number): Observable<Result> {
    return this.cerrarCuenta(id);
  }
}
