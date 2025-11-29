import { Routes } from "@angular/router";

export const content: Routes = [
   {
    path: 'dashboard',
    loadChildren: () => import('../../pages/dashboard/dashboard.routes').then((m) => m.MAIN_ROUTES),
  },
]
