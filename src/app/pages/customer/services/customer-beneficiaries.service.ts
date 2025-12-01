import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { environment } from 'src/environments/environment';
import { Result } from '../../../shared/models/result.dto';
import {
  CrearBeneficiarioRequest,
  ActualizarBeneficiarioRequest
} from '../model/beneficiary.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerBeneficiariesService {
  private readonly baseUrl = environment.apiUrl + '/beneficiarios';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Crea un nuevo beneficiario (inicia en estado "Inactivo")
   * @param data - Datos del beneficiario
   */
  create(data: CrearBeneficiarioRequest): Observable<Result> {
    const url = `${this.baseUrl}/crear`;
    return this.http.post<Result>(url, data).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Confirma un beneficiario para poder usarlo en transferencias
   * @param id - ID del beneficiario
   * @param codigo - Código de confirmación enviado por email/sms
   */
  confirm(id: number, codigo?: string): Observable<Result> {
    const url = `${this.baseUrl}/${id}/confirmar`;
    const body = codigo ? { codigo } : {};
    return this.http.put<Result>(url, body).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene la lista de beneficiarios propios
   */
  getMyBeneficiaries(): Observable<Result> {
    const url = `${this.baseUrl}/mis-beneficiarios`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene el detalle de un beneficiario
   * @param id - ID del beneficiario
   */
  getBeneficiaryById(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Actualiza el alias de un beneficiario
   * @param id - ID del beneficiario
   * @param data - Nuevo alias
   */
  update(id: number, data: ActualizarBeneficiarioRequest): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.put<Result>(url, data).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Elimina un beneficiario
   * @param id - ID del beneficiario
   */
  delete(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }
}
