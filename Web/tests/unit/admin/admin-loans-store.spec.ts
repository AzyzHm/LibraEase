import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AdminLoansStore } from '../../../src/app/core/state/admin-loans-store';
import { LoanApi } from '../../../src/app/core/api/loan-api';
import { UserApi } from '../../../src/app/core/api/user-api';
import { BookApi } from '../../../src/app/core/api/book-api';
import { LoanRecordModel } from '../../../src/app/core/models/loan.model';

function makeLoan(overrides: Partial<LoanRecordModel> = {}): LoanRecordModel {
  return {
    id: 'record-1',
    status: 'LOANED',
    loanedDate: '2026-01-01',
    dueDate: '2026-01-15',
    returnedDate: '',
    patron: 'patron-1',
    employeeOut: 'employee-1',
    item: 'book-1',
    ...overrides,
  };
}

function setup(opts: {
  loanApi?: Partial<LoanApi>;
  userApi?: Partial<UserApi>;
  bookApi?: Partial<BookApi>;
}) {
  TestBed.configureTestingModule({
    providers: [
      { provide: LoanApi, useValue: opts.loanApi ?? {} },
      { provide: UserApi, useValue: opts.userApi ?? {} },
      { provide: BookApi, useValue: opts.bookApi ?? {} },
    ],
  });
  return TestBed.inject(AdminLoansStore);
}

describe('AdminLoansStore.load', () => {
  it('populates loans on success', () => {
    const store = setup({
      loanApi: { getAll: () => of({ message: 'ok', records: [makeLoan()] }) },
    });

    store.load();

    expect(store.loans()).toEqual([makeLoan()]);
    expect(store.loading()).toBe(false);
  });

  it('sets errorMessage and clears loans on failure', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'db down' } });
    const store = setup({ loanApi: { getAll: () => throwError(() => httpError) } });

    store.load();

    expect(store.loans()).toEqual([]);
    expect(store.errorMessage()).toBe('db down');
  });
});

describe('AdminLoansStore.loadReferenceData', () => {
  it('loads users and books together via forkJoin', () => {
    const store = setup({
      userApi: {
        getAll: () =>
          of({
            message: 'ok',
            users: [
              {
                id: 'u1',
                type: 'PATRON',
                firstname: 'Jane',
                lastname: 'Doe',
                email: 'j@x.com',
                status: 'APPROVED',
              },
            ],
          }),
      },
      bookApi: {
        getAll: () =>
          of({
            message: 'ok',
            page: {
              totalCount: 1,
              currentPage: 1,
              totalPages: 1,
              limit: 100,
              pageCount: 1,
              items: [
                {
                  id: 'b1',
                  barcode: '123',
                  cover: '',
                  title: 'T',
                  authors: [],
                  description: '',
                  subjects: [],
                  publicationDate: '2020-01-01',
                  publisher: 'P',
                  pages: 1,
                  genre: 'G',
                },
              ],
            },
          }),
      },
    });

    store.loadReferenceData();

    expect(store.users()).toHaveLength(1);
    expect(store.books()).toHaveLength(1);
    expect(store.refDataLoading()).toBe(false);
  });

  it('sets refDataError if either call fails', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'users down' } });
    const store = setup({
      userApi: { getAll: () => throwError(() => httpError) },
      bookApi: {
        getAll: () =>
          of({
            message: 'ok',
            page: {
              totalCount: 0,
              currentPage: 1,
              totalPages: 1,
              limit: 100,
              pageCount: 0,
              items: [],
            },
          }),
      },
    });

    store.loadReferenceData();

    expect(store.refDataError()).toBe('users down');
  });
});

describe('AdminLoansStore derived signals', () => {
  it('userById/bookById index reference data by id', () => {
    const store = setup({
      userApi: {
        getAll: () =>
          of({
            message: 'ok',
            users: [
              {
                id: 'u1',
                type: 'PATRON',
                firstname: 'Jane',
                lastname: 'Doe',
                email: 'j@x.com',
                status: 'APPROVED',
              },
            ],
          }),
      },
      bookApi: {
        getAll: () =>
          of({
            message: 'ok',
            page: {
              totalCount: 0,
              currentPage: 1,
              totalPages: 1,
              limit: 100,
              pageCount: 0,
              items: [],
            },
          }),
      },
    });
    store.loadReferenceData();

    expect(store.userById().get('u1')?.firstname).toBe('Jane');
  });

  it('loanedBookIds only includes items with a currently LOANED record', () => {
    const store = setup({
      loanApi: {
        getAll: () =>
          of({
            message: 'ok',
            records: [
              makeLoan({ item: 'book-1', status: 'LOANED' }),
              makeLoan({ id: 'r2', item: 'book-2', status: 'AVAILABLE' }),
            ],
          }),
      },
    });
    store.load();

    expect(store.loanedBookIds()).toEqual(new Set(['book-1']));
  });

  it('filteredLoans filters by the active statusFilter, defaulting to LOANED', () => {
    const store = setup({
      loanApi: {
        getAll: () =>
          of({
            message: 'ok',
            records: [
              makeLoan({ id: 'r1', status: 'LOANED' }),
              makeLoan({ id: 'r2', status: 'AVAILABLE' }),
            ],
          }),
      },
    });
    store.load();

    expect(store.filteredLoans().map((l) => l.id)).toEqual(['r1']);

    store.setStatusFilter('ALL');
    expect(store.filteredLoans()).toHaveLength(2);
  });
});

describe('AdminLoansStore.checkout', () => {
  it('prepends the new record and calls onSuccess', () => {
    const store = setup({
      loanApi: {
        create: () => of({ message: 'checked out', record: makeLoan({ id: 'new-record' }) }),
      },
    });
    const onSuccess = jest.fn();

    store.checkout(
      {
        status: 'LOANED',
        loanedDate: '2026-01-01',
        dueDate: '2026-01-15',
        patron: 'patron-1',
        employeeOut: 'employee-1',
        item: 'book-1',
      },
      onSuccess,
    );

    expect(store.loans()[0].id).toBe('new-record');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(store.checkingOut()).toBe(false);
  });

  it('sets checkoutError and does not call onSuccess on failure', () => {
    const httpError = new HttpErrorResponse({
      status: 409,
      error: { message: 'Book already loaned' },
    });
    const store = setup({ loanApi: { create: () => throwError(() => httpError) } });
    const onSuccess = jest.fn();

    store.checkout(
      {
        status: 'LOANED',
        loanedDate: '2026-01-01',
        dueDate: '2026-01-15',
        patron: 'patron-1',
        employeeOut: 'employee-1',
        item: 'book-1',
      },
      onSuccess,
    );

    expect(onSuccess).not.toHaveBeenCalled();
    expect(store.checkoutError()).toBe('Book already loaned');
  });
});

describe('AdminLoansStore.markReturned', () => {
  it('sends employeeOut carried over from the original record (not the returning employee) and employeeIn set to the returning employee', () => {
    let capturedPayload: unknown;
    const store = setup({
      loanApi: {
        update: (payload) => {
          capturedPayload = payload;
          return of({ message: 'returned', record: makeLoan({ status: 'AVAILABLE' }) });
        },
      },
    });
    const original = makeLoan({ employeeOut: 'employee-who-checked-out' });

    store.markReturned(original, 'employee-who-is-returning-it');

    expect(capturedPayload).toEqual(
      expect.objectContaining({
        employeeOut: 'employee-who-checked-out',
        employeeIn: 'employee-who-is-returning-it',
        status: 'AVAILABLE',
      }),
    );
  });

  it('replaces the matching record in the list with the server response', () => {
    const store = setup({
      loanApi: {
        getAll: () => of({ message: 'ok', records: [makeLoan({ id: 'r1' })] }),
        update: () =>
          of({ message: 'returned', record: makeLoan({ id: 'r1', status: 'AVAILABLE' }) }),
      },
    });
    store.load();

    store.markReturned(makeLoan({ id: 'r1' }), 'employee-1');

    expect(store.loans()[0].status).toBe('AVAILABLE');
  });

  it('sets actionError on failure', () => {
    const httpError = new HttpErrorResponse({
      status: 404,
      error: { message: 'Record not found' },
    });
    const store = setup({ loanApi: { update: () => throwError(() => httpError) } });

    store.markReturned(makeLoan(), 'employee-1');

    expect(store.actionError()).toBe('Record not found');
    expect(store.actionPendingId()).toBeNull();
  });
});
