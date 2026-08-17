import { Routes } from '@angular/router';
import { AdminUsers } from './admin-users/admin-users';
import { AdminBooks } from './admin-books/admin-books';
import { AdminCards } from './admin-cards/admin-cards';
import { ComingSoon } from '../../shared/ui/coming-soon/coming-soon';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', component: AdminUsers, title: 'Manage users · Admin · LibraEase' },
  { path: 'books', component: AdminBooks, title: 'Manage books · Admin · LibraEase' },
  {
    path: 'loans',
    component: ComingSoon,
    data: { title: 'Loan management', phase: 'a later admin phase' },
    title: 'Manage loans · Admin · LibraEase'
  },
  { path: 'cards', component: AdminCards, title: 'Library cards · Admin · LibraEase' }
];