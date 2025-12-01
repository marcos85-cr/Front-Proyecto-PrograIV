import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Result } from 'src/app/shared/models/result.dto';
import { environment } from './../../../../environments/environment';
import { HighValueOperation, HighValueOperationStatus, RiskLevel, ApproveOperationRequest, RejectOperationRequest, BlockOperationRequest } from '../models/high-value-operation.model';

@Injectable({
  providedIn: 'root'
})
export class HighValueOperationService {

private apiUrl = `${environment.apiUrl}/high-value-operations`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las operaciones de alto valor
   */
  getAllOperations(filters?: any): Observable<Result> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<Result>(this.apiUrl, { params });
  }

  /**
   * Obtiene una operación por ID
   */
  getOperationById(id: string): Observable<Result> {
    return this.http.get<Result>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene operaciones pendientes
   */
  getPendingOperations(): Observable<Result> {
    return this.http.get<Result>(
      `${this.apiUrl}/pending`,
      { params: new HttpParams().set('estado', HighValueOperationStatus.PENDIENTE) }
    );
  }

  /**
   * Obtiene operaciones por estado
   */
  getOperationsByStatus(status: HighValueOperationStatus): Observable<Result> {
    return this.http.get<Result>(this.apiUrl, {
      params: new HttpParams().set('estado', status),
    });
  }

  /**
   * Obtiene operaciones de alto riesgo
   */
  getHighRiskOperations(): Observable<Result> {
    return this.http.get<Result>(
      `${this.apiUrl}/high-risk`,
      { params: new HttpParams().set('nivelRiesgo', RiskLevel.CRITICO) }
    );
  }

  /**
   * Obtiene operaciones por cliente
   */
  getOperationsByClient(clienteId: string): Observable<Result> {
    return this.http.get<Result>(this.apiUrl, {
      params: new HttpParams().set('clienteId', clienteId),
    });
  }

  /**
   * Aprueba una operación
   */
  approveOperation(request: ApproveOperationRequest): Observable<Result> {
    return this.http.put<Result>(
      `${this.apiUrl}/${request.operacionId}/approve`,
      request
    );
  }

  /**
   * Rechaza una operación
   */
  rejectOperation(request: RejectOperationRequest): Observable<Result> {
    return this.http.put<Result>(
      `${this.apiUrl}/${request.operacionId}/reject`,
      request
    );
  }

  /**
   * Bloquea una operación
   */
  blockOperation(request: BlockOperationRequest): Observable<Result> {
    return this.http.put<Result>(
      `${this.apiUrl}/${request.operacionId}/block`,
      request
    );
  }

  /**
   * Agrega notas a una operación
   */
  addNotes(operacionId: string, notas: string): Observable<Result> {
    return this.http.put<Result>(
      `${this.apiUrl}/${operacionId}/notes`,
      { notas }
    );
  }

  /**
   * Obtiene estadísticas
   */
  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }

  /**
   * Exporta operaciones a CSV
   */
  exportToCsv(filters?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/export/csv`, {
      params,
      responseType: 'blob',
    });
  }

  /**
   * Exporta operaciones a PDF
   */
  exportToPdf(filters?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/export/pdf`, {
      params,
      responseType: 'blob',
    });
  }
}
