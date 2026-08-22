import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Catalog } from './features/catalog/catalog';
import { Profile } from './features/profile/profile';
import { LibraryCardPage } from './features/library-card/library-card';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { AdminShell } from './features/admin/admin-shell/admin-shell';
import { adminRoutes } from './features/admin/admin.routes';
import { authGuard, guestGuard, staffGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Home, title: 'LibraEase' },
  {
    path: 'catalog',
    component: Catalog,
    title: 'Catalog · LibraEase',
  },
  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard],
    title: 'My account · LibraEase',
  },
  {
    path: 'my-card',
    component: LibraryCardPage,
    canActivate: [authGuard],
    title: 'My library card · LibraEase',
  },
  {
    path: 'admin',
    component: AdminShell,
    canActivate: [staffGuard],
    children: adminRoutes,
  },
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
    title: 'Sign in · LibraEase',
  },
  {
    path: 'register',
    component: Register,
    canActivate: [guestGuard],
    title: 'Register · LibraEase',
  },
  { path: '**', redirectTo: '' },
];
