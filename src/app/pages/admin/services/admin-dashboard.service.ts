import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './../../../../environments/environment';

export interface DashboardStats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosBloqueados: number;
  totalClientes: number;
  totalCuentas: number;
  cuentasActivas: number;
  totalProveedores: number;
  operacionesHoy: number;
  volumenTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {

  private apiUrl = `${environment.apiUrl}/Admin/dashboard/stats`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las estadísticas del dashboard
   */
  getDashboardStats(): Observable<{success: boolean, data: DashboardStats}> {
    return this.http.get<{success: boolean, data: DashboardStats}>(this.apiUrl);
  }
}
