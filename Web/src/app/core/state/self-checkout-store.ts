import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoanApi } from '../api/loan-api';
import { ApiErrorBody } from '../models/auth.model';
import { SelfCheckoutResponse } from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class SelfCheckoutStore {
  private readonly loanApi = inject(LoanApi);

  readonly availability = signal<Record<string, boolean>>({});

  /** Fires the availability check for a book if it hasn't been checked yet. Safe to call from every card that renders it. */
  checkAvailability(bookId: string): void {
    if (bookId in this.availability()) return;

    this.loanApi.checkAvailability(bookId).subscribe({
      next: (response) =>
        this.availability.update((map) => ({ ...map, [bookId]: response.available })),
      // Leave the key unset on failure so a later re-check (e.g. revisiting the page) can retry,
      // instead of permanently guessing at a state we don't actually know.
      error: () => {},
    });
  }

  checkout(bookId: string, dueDateIso: string): Observable<SelfCheckoutResponse> {
    return this.loanApi
      .selfCheckout({ item: bookId, dueDate: dueDateIso })
      .pipe(tap(() => this.availability.update((map) => ({ ...map, [bookId]: false }))));
  }

  extractErrorMessage(error: HttpErrorResponse): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? 'Unable to check out this book right now.';
  }
}
