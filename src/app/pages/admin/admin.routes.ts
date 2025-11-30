import { Routes } from "@angular/router";
import { AdminDashboardComponent } from "./components/admin-dashboard/admin-dashboard.component";

export const MAIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
  },
  {
    path: 'users',
    loadChildren: () =>
      import('./components/users/user.routes').then((m) => m.USER_ROUTES),
  }
]
