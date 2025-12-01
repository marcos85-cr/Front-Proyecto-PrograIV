import { Routes } from '@angular/router';
import { CustomerListComponent } from './components/customer-list/customer-list.component';
import { CustomerCreateComponent } from './components/customer-create/customer-create.component';
import { CustomerDetailComponent } from './components/customer-detail/customer-detail.component';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    component: CustomerListComponent,
  },
  {
    path: 'create',
    component: CustomerCreateComponent,
  },
  {
    path: 'detail/:id',
    component: CustomerDetailComponent,
  },
  {
    path: 'edit/:id',
    component: CustomerCreateComponent,
  },
];
