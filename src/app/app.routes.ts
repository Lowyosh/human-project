import { Routes } from '@angular/router';
import { Login } from './auth/login';
import { authGuard } from './core/auth.guard';
import { Portal } from './portal/portal';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: Portal, canActivate: [authGuard] },
];
