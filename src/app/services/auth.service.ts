import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ErrorHandlerService } from './error-handler.service';
import { Result } from '../shared/models/result.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
private token!: string;
  private baseUrl: string;
  menus: any[] = [];
  private loginSuccessSubject = new Subject<void>();
  public loginSuccess$ = this.loginSuccessSubject.asObservable();
  private readonly errorHandler = inject(ErrorHandlerService);

  constructor(private http: HttpClient, private router: Router) {
    this.baseUrl = `${environment.apiUrl}`;
  }

  /**
   * Guarda el token de acceso  en localStorage
   * Actualiza el token en memoria y notifica que el login fue exitoso
   */
  saveToken(token: string) {
    localStorage.setItem('ACCESS_TOKEN_BANCO', token);

    this.token = token;
    this.loginSuccessSubject.next();
  }

  getToken(): string | null {
    if (!this.token) {
      return localStorage.getItem('ACCESS_TOKEN_BANCO');
    }
    return this.token;
  }

  /**
   * Cierra la sesión del usuario
   * Limpia los tokens y redirige al login
   */
  logout() {
    this.token = '';
    localStorage.removeItem('ACCESS_TOKEN_BANCO');
    this.router.navigateByUrl('/login');
  }

  /**
   * Obtiene la información del usuario decodificada del token JWT
   */
  getUserInfo() {
    const token = this.getToken();
    if (token) {
      try {
        const payload = token.split('.')[1];
        return JSON.parse(window.atob(payload));
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  /**
   * Verifica si el usuario está autenticado
   * No hace logout automático - eso lo maneja el guard
   */
  isLogged(): boolean {
    const user = this.getUserInfo();
    if (!user || !user.exp) {
      return false;
    }
    return user.exp > Date.now() / 1000;
  }

  /**
   * Verifica si el token ha expirado
   */
  isTokenExpired(): boolean {
    return !this.isLogged();
  }

  /**
   * Retorna el token si el usuario está autenticado, null si no
   */
  returnToken(): string | null {
    return this.isLogged() ? this.getToken() : null;
  }


  signIn(data: any): Observable<Result> {
    return this.http
      .post<Result>(`${this.baseUrl}/auth/login`, data)
      .pipe(catchError((error) => this.errorHandler.handleError(error, this.baseUrl)));
  }

}
