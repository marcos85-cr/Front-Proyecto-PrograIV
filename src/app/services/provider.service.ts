import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlerService } from './error-handler.service';
import { Provider, ProviderFilters, ProviderCreateData, ProviderUpdateData } from '../pages/admin/components/providers/models/provider.model';
import { environment } from 'src/environments/environment';
import { Result } from '../shared/models/result.dto';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private readonly baseUrl = environment.apiUrl + '/admin/proveedores';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Obtiene la lista de todos los proveedores
   *
   * @param filters - Filtros opcionales para la búsqueda
   * @returns Observable con la lista de proveedores
   */
  getProviders(filters?: ProviderFilters): Observable<Result> {
    const url = this.buildUrl(filters);

    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene un proveedor específico por ID
   *
   * @param id - ID del proveedor a buscar
   * @returns Observable con los datos del proveedor
   */
  getProviderById(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;

    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Elimina un proveedor (soft delete)
   *
   * @param id - ID del proveedor a eliminar
   * @returns Observable con el resultado de la operación
   */
  deleteProvider(id: number): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;

    return this.http.delete<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Crea un nuevo proveedor
   *
   * @param providerData - Datos del nuevo proveedor
   * @returns Observable con el resultado de la operación
   */
  createProvider(providerData: ProviderCreateData): Observable<Result> {
    return this.http.post<Result>(this.baseUrl, providerData).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'createProvider'))
    );
  }

  /**
   * Actualiza un proveedor existente
   *
   * @param providerData - Datos actualizados del proveedor
   * @returns Observable con el resultado de la operación
   */
  updateProvider(providerData: ProviderUpdateData): Observable<Result> {
    const url = `${this.baseUrl}/${providerData.id}`;
    return this.http.put<Result>(url, providerData).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'updateProvider'))
    );
  }

  /**
   * Construye la URL con parámetros de filtrado
   *
   * @param filters - Filtros a aplicar
   * @returns URL construida con parámetros
   */
  private buildUrl(filters?: ProviderFilters): string {
    if (!filters || Object.keys(filters).length === 0) {
      return this.baseUrl;
    }

    const params = new URLSearchParams();

    if (filters.nombre) params.append('nombre', filters.nombre);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
  }
}
