import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

export const MAIN_ROUTES: Routes = [
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
      import('./components/customer/customer.routes').then(
        (m) => m.CUSTOMER_ROUTES
      ),
  },
  {
    path: 'accounts',
    loadChildren: () =>
      import('./components/accounts/account.route').then(
        (m) => m.ACCOUNT_ROUTES
      ),
  }
];
