import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { environment } from 'src/environments/environment';
import { Result } from '../../../shared/models/result.dto';
import {
  ValidarContratoRequest,
  RealizarPagoRequest,
  ProgramarPagoRequest
} from '../model/pago.model';

@Injectable({
  providedIn: 'root'
})
export class PagosServiciosService {
  private readonly baseUrl = environment.apiUrl + '/pagos-servicios';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Obtiene la lista de proveedores de servicio disponibles
   */
  getProveedores(): Observable<Result> {
    const url = `${this.baseUrl}/proveedores`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Valida un número de contrato antes de pagar
   * @param data - Datos para validar el contrato
   */
  validarContrato(data: ValidarContratoRequest): Observable<Result> {
    const url = `${this.baseUrl}/validar-contrato`;
    return this.http.post<Result>(url, data).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Realiza un pago de servicio inmediato
   * @param data - Datos del pago
   */
  realizarPago(data: RealizarPagoRequest): Observable<Result> {
    const url = `${this.baseUrl}/realizar-pago`;
    const headers = new HttpHeaders({
      'Idempotency-Key': crypto.randomUUID()
    });
    return this.http.post<Result>(url, data, { headers }).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Programa un pago de servicio para fecha futura
   * @param data - Datos del pago programado
   */
  programarPago(data: ProgramarPagoRequest): Observable<Result> {
    const url = `${this.baseUrl}/programar-pago`;
    const headers = new HttpHeaders({
      'Idempotency-Key': crypto.randomUUID()
    });
    return this.http.post<Result>(url, data, { headers }).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el detalle de un pago específico
   * @param id - ID del pago
   */
  getPagoById(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el historial de pagos del cliente
   */
  getMisPagos(): Observable<Result> {
    const url = `${this.baseUrl}/mis-pagos`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }
}
