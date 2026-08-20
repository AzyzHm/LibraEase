import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminCardsStore } from '../../../core/state/admin-cards-store';
import { AdminUser } from '../../../core/models/admin.model';
import { LoadingState } from '../../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';

@Component({
  selector: 'app-admin-cards',
  standalone: true,
  imports: [FormsModule, LoadingState, EmptyState, ErrorState],
  templateUrl: './admin-cards.html',
  styleUrl: './admin-cards.css'
})
export class AdminCards implements OnInit {
  readonly store = inject(AdminCardsStore);

  readonly searchTerm = signal('');

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const users = this.store.users();
    if (!term) return users;

    return users.filter((user) =>
      `${user.firstname} ${user.lastname} ${user.email}`.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.store.loadCards();
    this.store.loadUsers();
  }

  onRetryCards(): void {
    this.store.loadCards();
  }

  onRetryUsers(): void {
    this.store.loadUsers();
  }

  hasCard(user: AdminUser): boolean {
    return this.store.userIdsWithCard().has(user.id);
  }

  onIssue(user: AdminUser): void {
    this.store.issue(user.id);
  }
}