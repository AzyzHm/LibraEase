import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { ComingSoon } from './shared/ui/coming-soon/coming-soon';

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
    data: { title: 'My loans', phase: 'Phase 4' },
    title: 'My loans · LibraEase'
  },
  {
    path: 'login',
    component: ComingSoon,
    data: { title: 'Sign in', phase: 'Phase 2' },
    title: 'Sign in · LibraEase'
  },
  { path: '**', redirectTo: '' }
];