import { Routes } from "@angular/router";
import { ManagerDashboardComponent } from "./components/manager-dashboard/manager-dashboard.component";

export const MANAGER_ROUTES: Routes = [
  {
    path: 'dashboard',
    component: ManagerDashboardComponent,
  }
]
