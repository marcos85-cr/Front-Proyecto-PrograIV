import { Routes } from '@angular/router';

export const content: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('../../pages/admin/admin.routes').then((m) => m.MAIN_ROUTES),
  },
  {
    path: 'customer',
    loadChildren: () =>
      import('../../pages/customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
  }
];
