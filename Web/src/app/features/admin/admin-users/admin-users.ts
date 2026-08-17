import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminUsersStore, StatusFilter } from '../../../core/state/admin-users-store';
import { AdminUser } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  readonly store = inject(AdminUsersStore);

  readonly filters: { label: string; value: StatusFilter }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'All', value: 'ALL' }
  ];

  /** Id of the user currently targeted by the delete confirmation, if any. */
  readonly confirmingDeleteId = signal<string | null>(null);

  ngOnInit(): void {
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