import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { LibraryCardApi } from '../api/library-card-api';
import { ApiErrorBody } from '../models/auth.model';
import { LibraryCardWithUser } from '../models/library-card.model';

@Injectable({ providedIn: 'root' })
export class MyLibraryCardStore {
  private readonly libraryCardApi = inject(LibraryCardApi);

  readonly card = signal<LibraryCardWithUser | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  /** True specifically when the backend 404s because no admin/employee has issued a card yet - distinct from a real failure. */
  readonly notIssued = signal(false);

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.notIssued.set(false);

    this.libraryCardApi
      .getMine()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.card.set(response.card),
        error: (error: HttpErrorResponse) => {
          this.card.set(null);
          if (error.status === 404) {
            this.notIssued.set(true);
            return;
          }
          this.errorMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? 'Unable to load your library card right now.';
  }
}
