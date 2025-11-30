import { Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { UserCreateComponent } from './user-create/user-create.component';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserListComponent,
  },
  {
    path: 'edit/:id',
    component: UserCreateComponent,
  },
  {
    path: 'create',
    component: UserCreateComponent,
  },
];
