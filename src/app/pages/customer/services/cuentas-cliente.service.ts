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
} from '../model/cuenta.model';

@Injectable({
  providedIn: 'root'
})
export class CuentasClienteService {
  private readonly baseUrl = environment.apiUrl + '/cuentas';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Obtiene las cuentas propias del cliente autenticado
   */
  getMisCuentas(): Observable<Result> {
    const url = `${this.baseUrl}/my-accounts`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el detalle completo de una cuenta específica
   * @param id - ID de la cuenta
   */
  getCuentaById(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el balance de una cuenta
   * @param id - ID de la cuenta
   */
  getBalance(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}/balance`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Crea una nueva cuenta propia
   * @param data - Datos para crear la cuenta
   */
  crearCuenta(data: CrearCuentaRequest): Observable<Result> {
    return this.http.post<Result>(this.baseUrl, data).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'crearCuenta'))
    );
  }

  /**
   * Bloquea o desbloquea una cuenta propia (toggle)
   * @param id - ID de la cuenta
   */
  toggleBloqueo(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}/block`;
    return this.http.put<Result>(url, {}).pipe(
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
}
