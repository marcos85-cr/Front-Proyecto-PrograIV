import { Routes } from '@angular/router';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
 import { CrearCuentaFormComponent } from './components/cuentas/crear-cuenta-form.component';
import { OperacionesListComponent } from './components/operaciones/operaciones-list.component';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  {
    path: 'dashboard',
    component: ManagerDashboardComponent,
  },
  {
    path: 'clientes/:id/crear-cuenta',
    component: CrearCuentaFormComponent,
  },
  {
    path: 'operations',
    component: OperacionesListComponent,
  },
  {
    path: 'customers',
    loadChildren: () =>
      import('../../shared/components/customer/customer.routes').then(
        (m) => m.CUSTOMER_ROUTES
      ),
  },
];
