import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminUsersStore, StatusFilter } from '../../../core/state/admin-users-store';
import { AuthStore } from '../../../core/state/auth-store';
import { AdminUser } from '../../../core/models/admin.model';
import { LoadingState } from '../../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [LoadingState, EmptyState, ErrorState],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  readonly store = inject(AdminUsersStore);
  readonly authStore = inject(AuthStore);

  readonly filters: { label: string; value: StatusFilter }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'All', value: 'ALL' },
  ];

  /** Id of the user currently targeted by the delete confirmation, if any. */
  readonly confirmingDeleteId = signal<string | null>(null);

  ngOnInit(): void {
    this.store.load();
  }

  onRetry(): void {
    this.store.load();
  }

  onFilterChange(filter: StatusFilter): void {
    this.store.setStatusFilter(filter);
  }

  onApprove(user: AdminUser): void {
    this.store.approve(user.id);
  }

  onReject(user: AdminUser): void {
    this.store.reject(user.id);
  }

  onPromote(user: AdminUser): void {
    this.store.promote(user.id);
  }

  onDemote(user: AdminUser): void {
    this.store.demote(user.id);
  }

  onDeleteRequest(user: AdminUser): void {
    this.confirmingDeleteId.set(user.id);
  }

  onDeleteCancel(): void {
    this.confirmingDeleteId.set(null);
  }

  onDeleteConfirm(user: AdminUser): void {
    this.confirmingDeleteId.set(null);
    this.store.remove(user.id);
  }
}
