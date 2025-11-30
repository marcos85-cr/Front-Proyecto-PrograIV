import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Excluir rutas públicas de autenticación
    const publicAuthRoutes = ['/auth/login', '/auth/register', '/auth/reset-password'];
    const isPublicAuthRoute = publicAuthRoutes.some(route =>
      req.url.toLowerCase().includes(route.toLowerCase())
    );

    // Si es una ruta pública de autenticación, continuar sin token
    if (isPublicAuthRoute) {
      return next.handle(req);
    }

    const token = this.authService.getToken();

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
          .set('Content-Type', 'application/json')
      });

      // Continuar con la petición modificada
      return next.handle(authReq);
    }

    // Si no hay token, continuar con la petición original
    return next.handle(req);
  }
}
