import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { environment } from './../../../../environments/environment';
import { Result } from '../../../shared/models/result.dto';

@Injectable({
  providedIn: 'root'
})
export class CustomerSchedulingService {
  private readonly baseUrl = environment.apiUrl + '/programacion';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Obtiene todas las programaciones del cliente autenticado
   */
  getMyScheduledOperations(): Observable<Result> {
    const url = `${this.baseUrl}/mis-programaciones`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el detalle de una programación específica
   * @param transaccionId - ID de la transacción programada
   */
  getScheduledOperationById(transaccionId: number): Observable<Result> {
    const url = `${this.baseUrl}/${transaccionId}`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Cancela una operación programada
   * @param transaccionId - ID de la transacción programada
   */
  cancel(transaccionId: number): Observable<Result> {
    const url = `${this.baseUrl}/${transaccionId}/cancelar`;
    return this.http.put<Result>(url, {}).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }
}
