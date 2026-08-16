import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { ComingSoon } from './shared/ui/coming-soon/coming-soon';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { authGuard, guestGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Home, title: 'LibraEase' },
  {
    path: 'catalog',
    component: ComingSoon,
    data: { title: 'Catalog', phase: 'Phase 3' },
    title: 'Catalog · LibraEase'
  },
  {
    path: 'profile',
    component: ComingSoon,
    canActivate: [authGuard],
    data: { title: 'My loans', phase: 'Phase 4' },
    title: 'My loans · LibraEase'
  },
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
    title: 'Sign in · LibraEase'
  },
  {
    path: 'register',
    component: Register,
    canActivate: [guestGuard],
    title: 'Register · LibraEase'
  },
  { path: '**', redirectTo: '' }
];