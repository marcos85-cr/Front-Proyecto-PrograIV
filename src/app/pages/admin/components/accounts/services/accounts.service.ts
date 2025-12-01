import { environment } from './../../../../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from '../../../../../services/error-handler.service';
import { Result } from '../../../../../shared/models/result.dto';
import { AccountFilters } from '../models/account.dto';

@Injectable({
  providedIn: 'root',
})
export class AccountsService {
  private readonly baseUrl = environment.apiUrl + '/cuentas';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Obtiene la lista de todas las cuentas
   *
   * @param filters - Filtros opcionales para la búsqueda
   * @returns Observable con la lista de cuentas
   */
  getAccounts(filters?: AccountFilters): Observable<Result> {
    const url = this.buildUrl(filters);

    return this.http
      .get<Result>(url)
      .pipe(catchError((error) => this.errorHandler.handleError(error, url)));
  }

  /**
   * Obtiene una cuenta específica por ID
   *
   * @param id - ID de la cuenta a buscar
   * @returns Observable con los datos de la cuenta
   */
  getAccountById(id: string): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;

    return this.http
      .get<Result>(url)
      .pipe(catchError((error) => this.errorHandler.handleError(error, url)));
  }

  /**
   * Actualiza el estado de una cuenta (Activa/Inactiva)
   *
   * @param id - ID de la cuenta
   * @param estado - Nuevo estado de la cuenta
   * @returns Observable con el resultado de la operación
   */
  updateAccountStatus(id: string, estado: string): Observable<Result> {
    const url = `${this.baseUrl}/${id}/block`;

    return this.http
      .put<Result>(url, { estado })
      .pipe(catchError((error) => this.errorHandler.handleError(error, url)));
  }

  /**
   * Elimina una cuenta
   *
   * @param id - ID de la cuenta a eliminar
   * @returns Observable con el resultado de la operación
   */
  deleteAccount(id: string): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;

    return this.http
      .delete<Result>(url)
      .pipe(catchError((error) => this.errorHandler.handleError(error, url)));
  }

  /**
   * Construye la URL con los filtros aplicados
   *
   * @param filters - Filtros a aplicar
   * @returns URL con query params
   */
  private buildUrl(filters?: AccountFilters): string {
    if (!filters) {
      return this.baseUrl;
    }

    const params = new URLSearchParams();

    if (filters.tipo) {
      params.append('tipo', filters.tipo);
    }
    if (filters.moneda) {
      params.append('moneda', filters.moneda);
    }
    if (filters.estado) {
      params.append('estado', filters.estado);
    }

    const queryString = params.toString();
    return queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
  }
}
