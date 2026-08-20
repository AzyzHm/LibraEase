import { Routes } from '@angular/router';
import { AdminUsers } from './admin-users/admin-users';
import { AdminBooks } from './admin-books/admin-books';
import { AdminLoans } from './admin-loans/admin-loans';
import { AdminCards } from './admin-cards/admin-cards';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', component: AdminUsers, title: 'Manage users · Admin · LibraEase' },
  { path: 'books', component: AdminBooks, title: 'Manage books · Admin · LibraEase' },
  { path: 'loans', component: AdminLoans, title: 'Manage loans · Admin · LibraEase' },
  { path: 'cards', component: AdminCards, title: 'Library cards · Admin · LibraEase' }
];