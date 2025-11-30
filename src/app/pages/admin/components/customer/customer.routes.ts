import { Routes } from '@angular/router';
import { CustomerListComponent } from './components/customer-list/customer-list.component';
import { CustomerCreateComponent } from './components/customer-create/customer-create.component';
export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'list',
    component: CustomerListComponent,
  },
  {
    path: 'create',
    component: CustomerCreateComponent,
  },
];
