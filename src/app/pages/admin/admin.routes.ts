import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

export const MAIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
  },
  {
    path: 'users',
    loadChildren: () =>
      import('./components/users/user.routes').then((m) => m.USER_ROUTES),
  },
  {
    path: 'customers',
    loadChildren: () =>
      import('../../shared/components/customer/customer.routes').then(
        (m) => m.CUSTOMER_ROUTES
      ),
  },
  {
    path: 'accounts',
    loadChildren: () =>
      import('./components/accounts/account.route').then(
        (m) => m.ACCOUNT_ROUTES
      ),
  },
  {
    path: 'providers',
    loadChildren: () =>
      import('./components/providers/provider.routes').then(
        (m) => m.PROVIDER_ROUTES
      ),
  },
  {
    path: 'beneficiaries',
    loadChildren: () =>
      import('./components/beneficiaries/beneficiary.routes').then(
        (m) => m.BENEFICIARY_ADMIN_ROUTES
      ),
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('./components/reports/report.routes').then(
        (m) => m.REPORT_ROUTES
      ),
  },
  {
    path: 'audit',
    loadChildren: () =>
      import('./components/audit/audit.routes').then(
        (m) => m.AUDIT_ROUTES
      ),
  }
];
