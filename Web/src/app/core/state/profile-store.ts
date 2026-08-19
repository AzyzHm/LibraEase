import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { LoanApi } from '../api/loan-api';
import { UserApi } from '../api/user-api';
import { ApiErrorBody } from '../models/auth.model';
import { LoanRecordWithItem } from '../models/loan.model';
import { AuthStore } from './auth-store';

export interface ProfileEditPayload {
  firstname: string;
  lastname: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly userApi = inject(UserApi);
  private readonly loanApi = inject(LoanApi);
  private readonly authStore = inject(AuthStore);

  readonly savingProfile = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly profileSaved = signal(false);

  readonly loans = signal<LoanRecordWithItem[]>([]);
  readonly loansLoading = signal(false);
  readonly loansError = signal<string | null>(null);

  saveProfile(payload: ProfileEditPayload): void {
    const currentUser = this.authStore.user();
    if (!currentUser) return;

    this.savingProfile.set(true);
    this.profileError.set(null);
    this.profileSaved.set(false);

    this.userApi
      .update({ id: currentUser.id, type: currentUser.type, ...payload })
      .pipe(finalize(() => this.savingProfile.set(false)))
      .subscribe({
        next: (response) => {
          this.authStore.updateUser(response.updatedUser);
          this.profileSaved.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.profileError.set(this.extractErrorMessage(error, 'Unable to update your profile right now.'));
        }
      });
  }

  /** Called each time the edit-profile modal opens, so a stale success/error message from a previous visit doesn't flash in. */
  resetProfileFeedback(): void {
    this.profileError.set(null);
    this.profileSaved.set(false);
  }

  loadMyLoans(): void {
    const currentUser = this.authStore.user();
    if (!currentUser) return;

    this.loansLoading.set(true);
    this.loansError.set(null);

    this.loanApi
      .queryByPatron(currentUser.id)
      .pipe(finalize(() => this.loansLoading.set(false)))
      .subscribe({
        next: (response) => this.loans.set(response.records),
        error: (error: HttpErrorResponse) => {
          this.loans.set([]);
          this.loansError.set(this.extractErrorMessage(error, 'Unable to load your loans right now.'));
        }
      });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? fallback;
  }
}