import { Routes } from '@angular/router';
import { AccountListComponent } from './components/account-list/account-list.component';
import { AccountDetailComponent } from './components/account-detail/account-detail.component';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    component: AccountListComponent,
  },
  {
    path: 'detail/:id',
    component: AccountDetailComponent,
  },
];
