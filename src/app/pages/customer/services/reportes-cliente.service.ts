import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { environment } from 'src/environments/environment';
import { Result } from '../../../shared/models/result.dto';
import { FormatoExportacion, ExtractoCuentaDto, ResumenClienteDto } from '../model/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReportesClienteService {
  private readonly baseUrl = environment.apiUrl + '/reports';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Genera extracto de cuenta
   * @param cuentaId - ID de la cuenta
   * @param startDate - Fecha inicio del período (string ISO o Date)
   * @param endDate - Fecha fin del período (string ISO o Date)
   * @param format - Formato de exportación (json, pdf, csv)
   */
  getExtractoCuenta(
    cuentaId: number,
    startDate?: string | Date,
    endDate?: string | Date,
    format: FormatoExportacion = 'json'
  ): Observable<Result<ExtractoCuentaDto>> {
    const url = `${this.baseUrl}/account-statement/${cuentaId}`;
    let params = new HttpParams().set('format', format);

    if (startDate) {
      const dateStr = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
      params = params.set('startDate', dateStr);
    }
    if (endDate) {
      const dateStr = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
      params = params.set('endDate', dateStr);
    }

    return this.http.get<Result<ExtractoCuentaDto>>(url, { params }).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Descarga extracto en formato PDF o CSV
   */
  getExtractoAsBlob(
    cuentaId: number,
    startDate?: string | Date,
    endDate?: string | Date,
    format: 'pdf' | 'csv' = 'pdf'
  ): Observable<Blob> {
    const url = `${this.baseUrl}/account-statement/${cuentaId}`;
    let params = new HttpParams().set('format', format);

    if (startDate) {
      const dateStr = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
      params = params.set('startDate', dateStr);
    }
    if (endDate) {
      const dateStr = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
      params = params.set('endDate', dateStr);
    }

    return this.http.get(url, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el resumen general del cliente autenticado
   */
  getResumenCliente(): Observable<Result<ResumenClienteDto>> {
    const url = `${this.baseUrl}/my-summary`;
    return this.http.get<Result<ResumenClienteDto>>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Descarga un archivo blob
   * @param blob - Blob del archivo
   * @param filename - Nombre del archivo
   */
  descargarArchivo(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
