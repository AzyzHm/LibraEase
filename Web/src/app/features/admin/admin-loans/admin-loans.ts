import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, OnInit, PLATFORM_ID, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { animate } from 'motion';
import { AdminLoansStore, LoanStatusFilter } from '../../../core/state/admin-loans-store';
import { AuthStore } from '../../../core/state/auth-store';
import { LoanPayload, LoanRecordModel } from '../../../core/models/loan.model';
import { LoadingState } from '../../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { springStandard } from '../../../shared/motion/springs';

@Component({
  selector: 'app-admin-loans',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, LoadingState, EmptyState, ErrorState],
  templateUrl: './admin-loans.html',
  styleUrl: './admin-loans.css'
})
export class AdminLoans implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  readonly store = inject(AdminLoansStore);

  readonly filters: { label: string; value: LoanStatusFilter }[] = [
    { label: 'On loan', value: 'LOANED' },
    { label: 'Returned', value: 'AVAILABLE' },
    { label: 'All', value: 'ALL' }
  ];

  readonly showForm = signal(false);
  readonly submitted = signal(false);

  readonly checkoutForm = this.fb.nonNullable.group({
    patron: ['', Validators.required],
    item: ['', Validators.required],
    dueDate: ['', Validators.required]
  });

  /** Only PATRON accounts can borrow books - staff shouldn't see themselves/other staff in the picker. */
  readonly patrons = computed(() => this.store.users().filter((user) => user.type === 'PATRON'));

  private readonly formPanel = viewChild<ElementRef<HTMLElement>>('formPanel');

  constructor() {
    // Same inline-expand treatment as the admin-books create/edit form.
    effect(() => {
      const el = this.formPanel()?.nativeElement;
      if (!el || !isPlatformBrowser(this.platformId)) {
        return;
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      animate(
        el,
        { opacity: [0, 1], transform: ['translateY(-8px)', 'translateY(0)'] },
        reducedMotion ? { duration: 0.001 } : springStandard
      );
    });
  }

  ngOnInit(): void {
    this.store.load();
    this.store.loadReferenceData();
  }

  onRetry(): void {
    this.store.load();
  }

  onFilterChange(filter: LoanStatusFilter): void {
    this.store.setStatusFilter(filter);
  }

  onOpenCheckout(): void {
    this.submitted.set(false);
    this.checkoutForm.reset({ patron: '', item: '', dueDate: '' });
    this.showForm.set(true);
  }

  onCancelCheckout(): void {
    this.showForm.set(false);
  }

  onSubmitCheckout(): void {
    this.submitted.set(true);
    if (this.checkoutForm.invalid) return;

    const currentUser = this.authStore.user();
    if (!currentUser) return;

    const raw = this.checkoutForm.getRawValue();
    const payload: LoanPayload = {
      status: 'LOANED',
      loanedDate: new Date().toISOString(),
      dueDate: new Date(raw.dueDate).toISOString(),
      patron: raw.patron,
      employeeOut: currentUser.id,
      item: raw.item
    };

    this.store.checkout(payload, () => this.showForm.set(false));
  }

  onMarkReturned(loan: LoanRecordModel): void {
    const currentUser = this.authStore.user();
    if (!currentUser) return;
    this.store.markReturned(loan, currentUser.id);
  }

  bookTitle(loan: LoanRecordModel): string {
    return this.store.bookById().get(loan.item)?.title ?? 'Unknown book';
  }

  patronName(loan: LoanRecordModel): string {
    const patron = this.store.userById().get(loan.patron);
    return patron ? `${patron.firstname} ${patron.lastname}` : 'Unknown patron';
  }

  isOverdue(loan: LoanRecordModel): boolean {
    return loan.status === 'LOANED' && new Date(loan.dueDate).getTime() < Date.now();
  }
}