import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError, catchError, retry, timer } from 'rxjs';
import { ErrorType } from '../shared/models/enums';
import { ErrorDetails } from '../shared/models/error';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  /**
   * Maneja errores HTTP de manera centralizada
   * @param error - Error capturado
   * @param context - Contexto adicional (opcional)
   * @returns Observable con el error formateado
   */
  handleError(error: unknown, context?: string): Observable<never> {
    const errorDetails = this.processError(error, context);

    // Log del error para debugging
    this.logError(errorDetails);

    return throwError(() => errorDetails);
  }

  private processError(error: unknown, context?: string): ErrorDetails {
    const timestamp = new Date();

    // Error HTTP
    if (error instanceof HttpErrorResponse) {
      return this.handleHttpError(error, context, timestamp);
    }

    // Error de red/conexión
    if (error instanceof Error) {
      if (error.name === 'NetworkError' || error.message.includes('network')) {
        return {
          code: ErrorType.NETWORK_ERROR,
          message: 'Error de conexión. Verifica tu conectividad a internet.',
          details: error.message,
          timestamp,
          url: context,
        };
      }

      // Error de timeout
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return {
          code: ErrorType.TIMEOUT_ERROR,
          message: 'La solicitud ha tardado demasiado en responder. Inténtalo nuevamente.',
          details: error.message,
          timestamp,
          url: context,
        };
      }

      // Error genérico de JavaScript
      return {
        code: ErrorType.CLIENT_ERROR,
        message: error.message || 'Ha ocurrido un error inesperado.',
        details: error.stack,
        timestamp,
        url: context,
      };
    }

    // Error desconocido
    return {
      code: ErrorType.UNKNOWN_ERROR,
      message: 'Ha ocurrido un error desconocido.',
      details: error,
      timestamp,
      url: context,
    };
  }

  private handleHttpError(
    error: HttpErrorResponse,
    context?: string,
    timestamp?: Date
  ): ErrorDetails {
    let message = '';
    let errorType: ErrorType;

    // Errores del cliente (4xx)
    if (error.status >= 400 && error.status < 500) {
      errorType = ErrorType.CLIENT_ERROR;

      switch (error.status) {
        case 400:
          message = 'Solicitud incorrecta. Verifica los datos enviados.';
          break;
        case 401:
          message = 'No autorizado. Verifica tus credenciales.';
          break;
        case 403:
          message = 'Acceso prohibido. No tienes permisos para esta acción.';
          break;
        case 404:
          message = 'Recurso no encontrado.';
          break;
        case 422:
          message = 'Datos de entrada inválidos.';
          break;
        case 429:
          message = 'Demasiadas solicitudes. Inténtalo más tarde.';
          break;
        default:
          message = `Error del cliente: ${error.status}`;
      }
    }
    // Errores del servidor (5xx)
    else if (error.status >= 500) {
      errorType = ErrorType.SERVER_ERROR;

      switch (error.status) {
        case 500:
          message = 'Error interno del servidor. Inténtalo más tarde.';
          break;
        case 502:
          message = 'Servicio no disponible temporalmente.';
          break;
        case 503:
          message = 'Servicio no disponible. Inténtalo más tarde.';
          break;
        case 504:
          message = 'Tiempo de espera agotado del servidor.';
          break;
        default:
          message = `Error del servidor: ${error.status}`;
      }
    }
    // Error de red (status 0)
    else if (error.status === 0) {
      errorType = ErrorType.NETWORK_ERROR;
      message = 'Error de conexión. Verifica tu conectividad a internet.';
    }
    // Otros errores
    else {
      errorType = ErrorType.UNKNOWN_ERROR;
      message = `Error desconocido: ${error.status}`;
    }

    // Si hay mensaje específico del servidor, usarlo como detalle adicional
    let serverMessage = '';
    if (error.error) {
      if (typeof error.error === 'string') {
        serverMessage = error.error;
      } else if (error.error.message) {
        serverMessage = error.error.message;
      } else if (error.error.error) {
        serverMessage = error.error.error;
      }
    }

    return {
      code: error.status || errorType,
      message: serverMessage || message,
      details: {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error,
        headers: error.headers,
      },
      timestamp: timestamp || new Date(),
      url: context || error.url || undefined,
    };
  }

  private logError(errorDetails: ErrorDetails): void {
    console.group(`🚨 Error [${errorDetails.code}] - ${errorDetails.timestamp.toISOString()}`);
    console.error('Message:', errorDetails.message);
    if (errorDetails.url) {
      console.error('URL:', errorDetails.url);
    }
    if (errorDetails.details) {
      console.error('Details:', errorDetails.details);
    }
    console.groupEnd();
  }
}


/*

// Ejemplo de uso en un servicio
@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly baseUrl = 'https://api.example.com';

  private readonly headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  postSale(sale: Sale): Observable<Sale> {
    const url = `${this.baseUrl}/sales`;

    return this.http
      .post<Sale>(url, sale, {
        headers: this.headers,
      })
      .pipe(catchError((error) => this.errorHandler.handleError(error, url)));
  }

  // Ejemplo con manejo específico de errores
  postSaleWithCustomHandling(sale: Sale): Observable<Sale> {
    const url = `${this.baseUrl}/sales`;

    return this.http
      .post<Sale>(url, sale, {
        headers: this.headers,
      })
      .pipe(
        catchError((error) => {
          // Manejo específico para este endpoint
          if (error instanceof HttpErrorResponse && error.status === 409) {
            return throwError(
              () =>
                ({
                  code: 'DUPLICATE_SALE',
                  message: 'Esta venta ya existe en el sistema.',
                  timestamp: new Date(),
                } as ErrorDetails)
            );
          }

          // Fallback al manejo general
          return this.errorHandler.handleError(error, url);
        })
      );
  }

  // Ejemplo con retry automático
  postSaleWithRetry(sale: Sale): Observable<Sale> {
    const url = `${this.baseUrl}/sales`;

    return this.http
      .post<Sale>(url, sale, {
        headers: this.headers,
      })
      .pipe(
        retry({
          count: 3,
          delay: (error, retryCount) => {
            // Solo reintentar en errores de red o servidor
            if (error instanceof HttpErrorResponse) {
              if (error.status >= 500 || error.status === 0) {
                return timer(1000 * retryCount); // Backoff exponencial
              }
            }
            throw error; // No reintentar otros errores
          },
        }),
        catchError((error) => this.errorHandler.handleError(error, url))
      );
  }
}
*/
