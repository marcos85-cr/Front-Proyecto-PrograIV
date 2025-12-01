import { Routes } from '@angular/router';
import { TabsComponent } from './components/tabs/tabs.component';
import { TABS_ROUTES } from './components/tabs/tabs.routes';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    component: TabsComponent,
    children: TABS_ROUTES
  }
];
