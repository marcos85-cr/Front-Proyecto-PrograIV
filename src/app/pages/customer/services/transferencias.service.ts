import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { environment } from 'src/environments/environment';
import { Result } from '../../../shared/models/result.dto';
import {
  PreCheckTransferenciaRequest,
  EjecutarTransferenciaRequest
} from '../model/transferencia.model';

@Injectable({
  providedIn: 'root'
})
export class TransferenciasService {
  private readonly baseUrl = environment.apiUrl + '/transferencias';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Pre-validación de transferencia antes de ejecutar
   * @param data - Datos de la transferencia a validar
   */
  preCheck(data: PreCheckTransferenciaRequest): Observable<Result> {
    const url = `${this.baseUrl}/pre-check`;
    return this.http.post<Result>(url, data).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Ejecuta una transferencia
   * @param data - Datos de la transferencia
   */
  ejecutar(data: EjecutarTransferenciaRequest): Observable<Result> {
    const url = `${this.baseUrl}/ejecutar`;
    const headers = new HttpHeaders({
      'Idempotency-Key': crypto.randomUUID()
    });
    return this.http.post<Result>(url, data, { headers }).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el detalle de una transferencia
   * @param id - ID de la transferencia
   */
  getTransferenciaById(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el historial de transferencias propias
   */
  getMisTransferencias(): Observable<Result> {
    const url = `${this.baseUrl}/mis-transferencias`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }
}
