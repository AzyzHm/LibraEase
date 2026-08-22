import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { LibraryCardApi } from '../api/library-card-api';
import { UserApi } from '../api/user-api';
import { ApiErrorBody } from '../models/auth.model';
import { AdminUser } from '../models/admin.model';
import { LibraryCardWithUser } from '../models/library-card.model';

@Injectable({ providedIn: 'root' })
export class AdminCardsStore {
  private readonly cardApi = inject(LibraryCardApi);
  private readonly userApi = inject(UserApi);

  readonly cards = signal<LibraryCardWithUser[]>([]);
  readonly cardsLoading = signal(false);
  readonly cardsError = signal<string | null>(null);

  readonly users = signal<AdminUser[]>([]);
  readonly usersLoading = signal(false);
  readonly usersError = signal<string | null>(null);

  /** userId of the card currently being issued, so only that row's button shows a spinner. */
  readonly issuePendingUserId = signal<string | null>(null);
  readonly issueError = signal<string | null>(null);

  /** Set of user ids that already have a card, derived from the loaded card list. */
  readonly userIdsWithCard = computed(() => new Set(this.cards().map((card) => card.user)));

  loadCards(): void {
    this.cardsLoading.set(true);
    this.cardsError.set(null);

    this.cardApi
      .getAll()
      .pipe(finalize(() => this.cardsLoading.set(false)))
      .subscribe({
        next: (response) => this.cards.set(response.cards),
        error: (error: HttpErrorResponse) => {
          this.cards.set([]);
          this.cardsError.set(
            this.extractErrorMessage(error, 'Unable to load library cards right now.'),
          );
        },
      });
  }

  loadUsers(): void {
    this.usersLoading.set(true);
    this.usersError.set(null);

    this.userApi
      .getAll()
      .pipe(finalize(() => this.usersLoading.set(false)))
      .subscribe({
        next: (response) => this.users.set(response.users),
        error: (error: HttpErrorResponse) => {
          this.users.set([]);
          this.usersError.set(this.extractErrorMessage(error, 'Unable to load users right now.'));
        },
      });
  }

  issue(userId: string): void {
    this.issuePendingUserId.set(userId);
    this.issueError.set(null);

    this.cardApi
      .issue(userId)
      .pipe(finalize(() => this.issuePendingUserId.set(null)))
      .subscribe({
        next: (response) => {
          // Idempotent on the backend - de-dupe locally too rather than assuming this was new.
          this.cards.update((cards) => {
            const withoutExisting = cards.filter((card) => card.id !== response.savedCard.id);
            return [...withoutExisting, response.savedCard];
          });
        },
        error: (error: HttpErrorResponse) => {
          this.issueError.set(
            this.extractErrorMessage(error, 'Unable to issue a card for this user right now.'),
          );
        },
      });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? fallback;
  }
}
