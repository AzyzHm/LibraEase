import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { BookApi } from '../api/book-api';
import { LoanApi } from '../api/loan-api';
import { UserApi } from '../api/user-api';
import { ApiErrorBody } from '../models/auth.model';
import { AdminUser } from '../models/admin.model';
import { BookModel } from '../models/book.model';
import { LoanPayload, LoanRecordModel, LoanUpdatePayload } from '../models/loan.model';

export type LoanStatusFilter = 'LOANED' | 'AVAILABLE' | 'ALL';

@Injectable({ providedIn: 'root' })
export class AdminLoansStore {
  private readonly loanApi = inject(LoanApi);
  private readonly userApi = inject(UserApi);
  private readonly bookApi = inject(BookApi);

  readonly loans = signal<LoanRecordModel[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly statusFilter = signal<LoanStatusFilter>('LOANED');

  /** Reference data used to resolve the raw ids on each loan record to display names. */
  readonly users = signal<AdminUser[]>([]);
  readonly books = signal<BookModel[]>([]);
  readonly refDataLoading = signal(false);
  readonly refDataError = signal<string | null>(null);

  readonly userById = computed(() => new Map(this.users().map((user) => [user.id, user])));
  readonly bookById = computed(() => new Map(this.books().map((book) => [book.id, book])));

  /** ids of books that currently have an open (LOANED) record - used to flag them in the checkout picker. */
  readonly loanedBookIds = computed(
    () => new Set(this.loans().filter((loan) => loan.status === 'LOANED').map((loan) => loan.item))
  );

  readonly filteredLoans = computed(() => {
    const filter = this.statusFilter();
    const loans = this.loans();
    return filter === 'ALL' ? loans : loans.filter((loan) => loan.status === filter);
  });

  /** True while a checkout (create) call is in flight. */
  readonly checkingOut = signal(false);
  readonly checkoutError = signal<string | null>(null);

  /** Id of the loan record currently being marked returned, so only that row shows a spinner. */
  readonly actionPendingId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.loanApi
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.loans.set(response.records),
        error: (error: HttpErrorResponse) => {
          this.loans.set([]);
          this.errorMessage.set(this.extractErrorMessage(error, 'Unable to load loan records right now.'));
        }
      });
  }

  loadReferenceData(): void {
    this.refDataLoading.set(true);
    this.refDataError.set(null);

    forkJoin({
      users: this.userApi.getAll(),
      books: this.bookApi.getAll()
    })
      .pipe(finalize(() => this.refDataLoading.set(false)))
      .subscribe({
        next: ({ users, books }) => {
          this.users.set(users.users);
          this.books.set(books.books);
        },
        error: (error: HttpErrorResponse) => {
          this.refDataError.set(this.extractErrorMessage(error, 'Unable to load patrons and books right now.'));
        }
      });
  }

  setStatusFilter(filter: LoanStatusFilter): void {
    this.statusFilter.set(filter);
  }

  checkout(payload: LoanPayload, onSuccess: () => void): void {
    this.checkingOut.set(true);
    this.checkoutError.set(null);

    this.loanApi
      .create(payload)
      .pipe(finalize(() => this.checkingOut.set(false)))
      .subscribe({
        next: (response) => {
          this.loans.update((loans) => [response.record, ...loans]);
          onSuccess();
        },
        error: (error: HttpErrorResponse) => {
          this.checkoutError.set(this.extractErrorMessage(error, 'Unable to check out this book right now.'));
        }
      });
  }

  /** Marks a loan returned: full-record replace with status/returnedDate/employeeIn updated. */
  markReturned(loan: LoanRecordModel, employeeInId: string): void {
    this.actionPendingId.set(loan.id);
    this.actionError.set(null);

    const payload: LoanUpdatePayload = {
      id: loan.id,
      status: 'AVAILABLE',
      loanedDate: loan.loanedDate,
      dueDate: loan.dueDate,
      returnedDate: new Date().toISOString(),
      patron: loan.patron,
      employeeOut: loan.employeeOut,
      employeeIn: employeeInId,
      item: loan.item
    };

    this.loanApi
      .update(payload)
      .pipe(finalize(() => this.actionPendingId.set(null)))
      .subscribe({
        next: (response) => {
          this.loans.update((loans) => loans.map((existing) => (existing.id === loan.id ? response.record : existing)));
        },
        error: (error: HttpErrorResponse) => {
          this.actionError.set(this.extractErrorMessage(error, 'Unable to mark this loan returned right now.'));
        }
      });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? fallback;
  }
}