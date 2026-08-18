import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../core/state/auth-store';
import { ProfileStore } from '../../core/state/profile-store';
import { LoadingState } from '../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../shared/ui/error-state/error-state';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, LoadingState, EmptyState, ErrorState],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  readonly store = inject(ProfileStore);

  readonly submitted = signal(false);

  /** Book cover URLs that failed to load, keyed by loan id, so we can fall back to a placeholder. */
  readonly failedCovers = signal<Set<string>>(new Set());

  readonly form = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  readonly loans = computed(() =>
    this.store.loans().map((loan) => ({
      ...loan,
      isOverdue: loan.status === 'LOANED' && new Date(loan.dueDate).getTime() < Date.now()
    }))
  );

  ngOnInit(): void {
    const user = this.authStore.user();
    if (user) {
      this.form.setValue({ firstname: user.firstname, lastname: user.lastname, email: user.email });
    }
    this.store.loadMyLoans();
  }

  onRetryLoans(): void {
    this.store.loadMyLoans();
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.store.saveProfile(this.form.getRawValue());
  }

  onCoverError(loanId: string): void {
    this.failedCovers.update((set) => new Set(set).add(loanId));
  }
}