import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { UserApi } from '../api/user-api';
import { ApiErrorBody } from '../models/auth.model';
import { AdminUser, UserStatus } from '../models/admin.model';

export type StatusFilter = UserStatus | 'ALL';

@Injectable({ providedIn: 'root' })
export class AdminUsersStore {
  private readonly userApi = inject(UserApi);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Which status tab is active. Defaults to PENDING since that's the actionable queue. */
  readonly statusFilter = signal<StatusFilter>('PENDING');

  /** Id of the row currently running an approve/reject/delete call, so only that row shows a spinner. */
  readonly actionPendingId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly filteredUsers = computed(() => {
    const filter = this.statusFilter();
    const users = this.users();
    return filter === 'ALL' ? users : users.filter((user) => user.status === filter);
  });

  readonly pendingCount = computed(() => this.users().filter((user) => user.status === 'PENDING').length);

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userApi
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        // The admin manages everyone else's account here, not their own -
        // exclude the admin row entirely rather than showing it with a
        // meaningless delete/promote button next to it.
        next: (response) => this.users.set(response.users.filter((user) => user.type !== 'ADMIN')),
        error: (error: HttpErrorResponse) => {
          this.users.set([]);
          this.errorMessage.set(this.extractErrorMessage(error, 'Unable to load users right now.'));
        }
      });
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  approve(userId: string): void {
    this.runAction(userId, this.userApi.approve(userId), 'Unable to approve this user right now.');
  }

  reject(userId: string): void {
    this.runAction(userId, this.userApi.reject(userId), 'Unable to reject this user right now.');
  }

  promote(userId: string): void {
    this.runAction(userId, this.userApi.promote(userId), 'Unable to promote this user right now.');
  }

  demote(userId: string): void {
    this.runAction(userId, this.userApi.demote(userId), 'Unable to demote this user right now.');
  }

  remove(userId: string): void {
    this.actionPendingId.set(userId);
    this.actionError.set(null);

    this.userApi
      .remove(userId)
      .pipe(finalize(() => this.actionPendingId.set(null)))
      .subscribe({
        next: () => this.users.update((users) => users.filter((user) => user.id !== userId)),
        error: (error: HttpErrorResponse) => {
          this.actionError.set(this.extractErrorMessage(error, 'Unable to delete this user right now.'));
        }
      });
  }

  /** Shared plumbing for approve/reject: both PUT a status change and splice the updated row back in. */
  private runAction(
    userId: string,
    request: ReturnType<UserApi['approve']>,
    fallbackError: string
  ): void {
    this.actionPendingId.set(userId);
    this.actionError.set(null);

    request.pipe(finalize(() => this.actionPendingId.set(null))).subscribe({
      next: (response) => {
        this.users.update((users) => users.map((user) => (user.id === userId ? response.user : user)));
      },
      error: (error: HttpErrorResponse) => {
        this.actionError.set(this.extractErrorMessage(error, fallbackError));
      }
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? fallback;
  }
}