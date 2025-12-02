import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { Result } from '../../../shared/models/result.dto';
import {
  FiltrosReporteTransacciones,
  ReporteVolumenDiario,
  ClientesActivosResponse,
  ReporteTotalesPeriodo,
  ExtractoCuenta,
  ResumenCliente
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly reportsUrl = `${environment.apiUrl}/reports`;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  getDailyVolume(startDate?: string, endDate?: string): Observable<Result<ReporteVolumenDiario>> {
    let params = new HttpParams();
    if (startDate) params = params.append('startDate', startDate);
    if (endDate) params = params.append('endDate', endDate);

    return this.http.get<Result<ReporteVolumenDiario>>(`${this.reportsUrl}/daily-volume`, { params }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getDailyVolume'))
    );
  }

  getMostActiveClients(startDate?: string, endDate?: string, top: number = 10): Observable<Result<ClientesActivosResponse>> {
    let params = new HttpParams().append('top', top.toString());
    if (startDate) params = params.append('startDate', startDate);
    if (endDate) params = params.append('endDate', endDate);

    return this.http.get<Result<ClientesActivosResponse>>(`${this.reportsUrl}/most-active-clients`, { params }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getMostActiveClients'))
    );
  }

  getPeriodTotals(startDate?: string, endDate?: string): Observable<Result<ReporteTotalesPeriodo>> {
    let params = new HttpParams();
    if (startDate) params = params.append('startDate', startDate);
    if (endDate) params = params.append('endDate', endDate);

    return this.http.get<Result<ReporteTotalesPeriodo>>(`${this.reportsUrl}/period-totals`, { params }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getPeriodTotals'))
    );
  }

  getTransactionsReport(filters: FiltrosReporteTransacciones): Observable<Result> {
    let params = new HttpParams();
    if (filters.startDate) params = params.append('startDate', filters.startDate);
    if (filters.endDate) params = params.append('endDate', filters.endDate);
    if (filters.tipo) params = params.append('tipo', filters.tipo);
    if (filters.estado) params = params.append('estado', filters.estado);
    if (filters.clienteId) params = params.append('clienteId', filters.clienteId.toString());

    return this.http.get<Result>(`${this.reportsUrl}/transactions-report`, { params }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getTransactionsReport'))
    );
  }

  getAccountStatement(cuentaId: number, startDate?: string, endDate?: string, format: string = 'json'): Observable<any> {
    let params = new HttpParams().append('format', format);
    if (startDate) params = params.append('startDate', startDate);
    if (endDate) params = params.append('endDate', endDate);

    if (format === 'pdf' || format === 'csv') {
      return this.http.get(`${this.reportsUrl}/account-statement/${cuentaId}`, {
        params,
        responseType: 'blob'
      }).pipe(
        catchError(error => this.errorHandler.handleError(error, 'getAccountStatement'))
      );
    }

    return this.http.get<Result<ExtractoCuenta>>(`${this.reportsUrl}/account-statement/${cuentaId}`, { params }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getAccountStatement'))
    );
  }

  getClientSummary(clienteId: number, format: string = 'json'): Observable<any> {
    const params = new HttpParams().append('format', format);

    if (format === 'pdf') {
      return this.http.get(`${this.reportsUrl}/client-summary/${clienteId}`, {
        params,
        responseType: 'blob'
      }).pipe(
        catchError(error => this.errorHandler.handleError(error, 'getClientSummary'))
      );
    }

    return this.http.get<Result<ResumenCliente>>(`${this.reportsUrl}/client-summary/${clienteId}`, { params }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'getClientSummary'))
    );
  }

  // ==================== EXPORTACIONES ====================

  /**
   * Exporta el reporte de totales del período en PDF o Excel
   */
  exportPeriodTotals(startDate?: string, endDate?: string, format: 'pdf' | 'xlsx' = 'pdf'): Observable<Blob> {
    let params = new HttpParams().append('format', format);
    if (startDate) params = params.append('startDate', startDate);
    if (endDate) params = params.append('endDate', endDate);

    return this.http.get(`${this.reportsUrl}/period-totals`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'exportPeriodTotals'))
    );
  }

  /**
   * Exporta el reporte de top clientes más activos en PDF o Excel
   */
  exportTopClients(startDate?: string, endDate?: string, top: number = 10, format: 'pdf' | 'xlsx' = 'pdf'): Observable<Blob> {
    let params = new HttpParams()
      .append('top', top.toString())
      .append('format', format);
    if (startDate) params = params.append('startDate', startDate);
    if (endDate) params = params.append('endDate', endDate);

    return this.http.get(`${this.reportsUrl}/top-clients`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'exportTopClients'))
    );
  }

  /**
   * Exporta el reporte de volumen diario en PDF o Excel
   */
  exportDailyVolume(startDate?: string, endDate?: string, format: 'pdf' | 'xlsx' = 'pdf'): Observable<Blob> {
    let params = new HttpParams().append('format', format);
    if (startDate) params = params.append('startDate', startDate);
    if (endDate) params = params.append('endDate', endDate);

    return this.http.get(`${this.reportsUrl}/daily-volume`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => this.errorHandler.handleError(error, 'exportDailyVolume'))
    );
  }
}
