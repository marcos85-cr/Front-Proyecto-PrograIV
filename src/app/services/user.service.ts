import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from './error-handler.service';
import { User, UserFilters } from '../shared/models/user.model';
import { environment } from 'src/environments/environment';
import { Result } from '../shared/models/result.dto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = environment.apiUrl + '/users';

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Obtiene la lista de todos los usuarios
   *
   * @param filters - Filtros opcionales para la búsqueda
   * @returns Observable con la lista de usuarios
   */
  getUsers(filters?: UserFilters): Observable<Result> {
    const url = this.buildUrl(filters);

    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Obtiene un usuario específico por ID
   *
   * @param id - ID del usuario a buscar
   * @returns Observable con los datos del usuario
   */
  getUserById(id: string): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;

    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Bloquea o desbloquea un usuario
   *
   * @param id - ID del usuario
   * @param bloqueado - Estado de bloqueo deseado
   * @returns Observable con el resultado de la operación
   */
  updateUserStatus(id: string): Observable<Result> {
    const url = `${this.baseUrl}/${id}/block`;

    return this.http.put<Result>(url, {}).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Elimina un usuario (soft delete)
   *
   * @param id - ID del usuario a eliminar
   * @returns Observable con el resultado de la operación
   */
  deleteUser(id: string): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;

    return this.http.delete<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, url))
    );
  }

  /**
   * Crea un nuevo usuario
   *
   * @param userData - Datos del nuevo usuario
   * @returns Observable con el resultado de la operación
   */
  createUser(userData: {
    email: string;
    password: string;
    confirmPassword: string;
    nombre: string;
    identificacion: string;
    telefono: string;
    role: string;
  }): Observable<Result> {
    return this.http.post<Result>(this.baseUrl, userData).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'createUser'))
    );
  }

  /**
   * Actualiza un usuario existente
   *
   * @param userData - Datos actualizados del usuario
   * @returns Observable con el resultado de la operación
   */
  updateUser(userData: {
    id: string;
    nombre: string;
    email: string;
    identificacion: string;
    telefono: string;
    role: string;
  }): Observable<Result> {
    const url = `${this.baseUrl}/${userData.id}`;
    return this.http.put<Result>(url, userData).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'updateUser'))
    );
  }

  /**
   * Construye la URL con parámetros de filtrado
   *
   * @param filters - Filtros a aplicar
   * @returns URL construida con parámetros
   */
  private buildUrl(filters?: UserFilters): string {
    if (!filters || Object.keys(filters).length === 0) {
      return this.baseUrl;
    }

    const params = new URLSearchParams();

    if (filters.email) params.append('email', filters.email);
    if (filters.role) params.append('role', filters.role);
    if (filters.bloqueado !== undefined) params.append('bloqueado', filters.bloqueado.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
  }
}
