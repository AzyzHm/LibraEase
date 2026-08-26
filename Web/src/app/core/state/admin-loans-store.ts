import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, forkJoin, map, of, switchMap } from 'rxjs';
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

  readonly users = signal<AdminUser[]>([]);
  readonly books = signal<BookModel[]>([]);
  readonly refDataLoading = signal(false);
  readonly refDataError = signal<string | null>(null);

  readonly userById = computed(() => new Map(this.users().map((user) => [user.id, user])));
  readonly bookById = computed(() => new Map(this.books().map((book) => [book.id, book])));

  readonly loanedBookIds = computed(
    () =>
      new Set(
        this.loans()
          .filter((loan) => loan.status === 'LOANED')
          .map((loan) => loan.item),
      ),
  );

  readonly filteredLoans = computed(() => {
    const filter = this.statusFilter();
    const loans = this.loans();
    return filter === 'ALL' ? loans : loans.filter((loan) => loan.status === filter);
  });

  readonly checkingOut = signal(false);
  readonly checkoutError = signal<string | null>(null);

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
          this.errorMessage.set(
            this.extractErrorMessage(error, 'Unable to load loan records right now.'),
          );
        },
      });
  }

  loadReferenceData(): void {
    this.refDataLoading.set(true);
    this.refDataError.set(null);

    forkJoin({
      users: this.userApi.getAll(),
      books: this.loadAllBooks(),
    })
      .pipe(finalize(() => this.refDataLoading.set(false)))
      .subscribe({
        next: ({ users, books }) => {
          this.users.set(users.users);
          this.books.set(books);
        },
        error: (error: HttpErrorResponse) => {
          this.refDataError.set(
            this.extractErrorMessage(error, 'Unable to load patrons and books right now.'),
          );
        },
      });
  }

  private loadAllBooks(): Observable<BookModel[]> {
    const PAGE_LIMIT = 100;

    return this.bookApi.getAll(1, PAGE_LIMIT).pipe(
      switchMap((first) => {
        const { items, totalPages } = first.page;
        if (totalPages <= 1) return of(items);

        const remainingPages = Array.from({ length: totalPages - 1 }, (_, index) =>
          this.bookApi.getAll(index + 2, PAGE_LIMIT),
        );

        return forkJoin(remainingPages).pipe(
          map((rest) => [...items, ...rest.flatMap((response) => response.page.items)]),
        );
      }),
    );
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
          this.checkoutError.set(
            this.extractErrorMessage(error, 'Unable to check out this book right now.'),
          );
        },
      });
  }

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
      item: loan.item,
    };

    this.loanApi
      .update(payload)
      .pipe(finalize(() => this.actionPendingId.set(null)))
      .subscribe({
        next: (response) => {
          this.loans.update((loans) =>
            loans.map((existing) => (existing.id === loan.id ? response.record : existing)),
          );
        },
        error: (error: HttpErrorResponse) => {
          this.actionError.set(
            this.extractErrorMessage(error, 'Unable to mark this loan returned right now.'),
          );
        },
      });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? fallback;
  }
}
