import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
 import { Customer, CustomerRequest } from '../models/customer.dto';
import { environment } from 'src/environments/environment';
import { ErrorHandlerService } from 'src/app/services/error-handler.service';
import { Result } from 'src/app/shared/models/result.dto';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly baseUrl = `${environment.apiUrl}/clientes`;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Obtiene la lista de todos los clientes
   */
  getCustomers(): Observable<Result> {
    return this.http.get<Result>(this.baseUrl).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'getCustomers'))
    );
  }

  /**
   * Obtiene un cliente específico por ID
   */
  getCustomerById(id: string): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'getCustomerById'))
    );
  }

   getUserById(id: string): Observable<Result> {
    const url = `${this.baseUrl}/por-usuario/${id}`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'getCustomerById'))
    );
  }

  /**
   * Crea un nuevo cliente
   */
  createCustomer(customerData: CustomerRequest): Observable<Result> {
    return this.http.post<Result>(this.baseUrl, customerData).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'createCustomer'))
    );
  }

  /**
   * Actualiza un cliente existente
   */
  updateCustomer(id: string, customerData: Partial<CustomerRequest>): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.put<Result>(url, customerData).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'updateCustomer'))
    );
  }

  /**
   * Elimina un cliente
   */
  deleteCustomer(id: string): Observable<Result> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'deleteCustomer'))
    );
  }

  /**
   * Obtiene usuarios disponibles para vincular con clientes
   */
  getUsuarios(): Observable<Result> {
    const url = `${environment.apiUrl}/users`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'getUsuarios'))
    );
  }

  /**
   * Obtiene gestores disponibles para asignar a clientes
   */
  getGestores(): Observable<Result> {
    const url = `${environment.apiUrl}/users`;
    return this.http.get<Result>(url).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'getGestores'))
    );
  }

  changePassword(data: { usuarioId: string; contrasenaActual: string; nuevaContrasena: string }): Observable<Result> {
    const url = `${environment.apiUrl}/users/${data.usuarioId}/change-password`;
    return this.http.put<Result>(url, data).pipe(
      catchError((error) => this.errorHandler.handleError(error, 'changePassword'))
    );
  }
}
