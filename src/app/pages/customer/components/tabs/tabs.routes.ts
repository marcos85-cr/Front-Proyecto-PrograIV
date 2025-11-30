
import { Routes } from '@angular/router';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { CardComponent } from './card/card.component';
import { CashComponent } from './cash/cash.component';
import { TransactionComponent } from './transaction/transaction.component';

export const TABS_ROUTES: Routes = [
  {
    path: 'dashboard',
    component: CustomerDashboardComponent
  },
  {
    path: 'settings',
   component : SettingsComponent
  },
  {
      path: 'card',
      component: CardComponent
  },
  {
    path: 'cash',
    component: CashComponent
  },
  {
    path: 'transactions',
    component: TransactionComponent
  },
];
