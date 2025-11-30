import { Routes } from '@angular/router';
import { CustomerDashboardComponent } from './components/tabs/customer-dashboard/customer-dashboard.component';
import { TABS_ROUTES } from './components/tabs/tabs.routes';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    children: TABS_ROUTES
  },
];
