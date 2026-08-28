import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AdminLoansStore, LoanStatusFilter } from '../../../core/state/admin-loans-store';
import { AuthStore } from '../../../core/state/auth-store';
import { LoanPayload, LoanRecordModel } from '../../../core/models/loan.model';
import { LoadingState } from '../../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { ModalShell } from '../../../shared/ui/modal-shell/modal-shell';
import { SearchSelect, SearchSelectOption } from '../../../shared/ui/search-select/search-select';

@Component({
  selector: 'app-admin-loans',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    LoadingState,
    EmptyState,
    ErrorState,
    ModalShell,
    SearchSelect,
  ],
  templateUrl: './admin-loans.html',
  styleUrl: './admin-loans.css',
})
export class AdminLoans implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  readonly store = inject(AdminLoansStore);

  readonly filters: { label: string; value: LoanStatusFilter }[] = [
    { label: 'On loan', value: 'LOANED' },
    { label: 'Returned', value: 'AVAILABLE' },
    { label: 'All', value: 'ALL' },
  ];

  readonly showForm = signal(false);
  readonly submitted = signal(false);

  readonly minDate = this.isoDate(this.addDays(new Date(), 1));

  readonly checkoutForm = this.fb.nonNullable.group({
    patron: ['', Validators.required],
    item: ['', Validators.required],
    dueDate: ['', [Validators.required, this.futureDateValidator]],
  });

  readonly patrons = computed(() =>
    this.store.users().filter((user) => user.type === 'PATRON' && user.status === 'APPROVED'),
  );

  readonly patronOptions = computed<SearchSelectOption[]>(() =>
    this.patrons().map((patron) => ({
      id: patron.id,
      label: `${patron.firstname} ${patron.lastname}`,
      sublabel: patron.email,
    })),
  );

  readonly bookOptions = computed<SearchSelectOption[]>(() => {
    const loanedIds = this.store.loanedBookIds();
    return this.store
      .books()
      .filter((book) => !loanedIds.has(book.id))
      .map((book) => ({ id: book.id, label: book.title, sublabel: book.authors.join(', ') }));
  });

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
      dueDate: new Date(`${raw.dueDate}T00:00:00`).toISOString(),
      patron: raw.patron,
      employeeOut: currentUser.id,
      item: raw.item,
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

  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const chosen = new Date(`${control.value}T00:00:00`);
    return chosen.getTime() > Date.now() ? null : { notFuture: true };
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
