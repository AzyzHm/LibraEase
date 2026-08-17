import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminCardsStore } from '../../../core/state/admin-cards-store';
import { AdminUser } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-cards',
  standalone: true,
  imports: [FormsModule],
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

  hasCard(user: AdminUser): boolean {
    return this.store.userIdsWithCard().has(user.id);
  }

  onIssue(user: AdminUser): void {
    this.store.issue(user.id);
  }
}