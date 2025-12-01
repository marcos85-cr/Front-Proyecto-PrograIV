import { Routes } from "@angular/router";
import { ProviderCreateComponent } from "./components/provider-create/provider-create.component";
import { ProviderListComponent } from "./components/provider-list/provider-list.component";

export const PROVIDER_ROUTES: Routes = [
  {
    path: '',
    component: ProviderListComponent
  },
  {
    path: 'create',
    component: ProviderCreateComponent
  },
  {
    path: 'edit/:id',
    component: ProviderCreateComponent
  }
]
