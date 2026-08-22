import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SelfCheckoutStore } from '../../../src/app/core/state/self-checkout-store';
import { LoanApi } from '../../../src/app/core/api/loan-api';
import { SelfCheckoutResponse } from '../../../src/app/core/models/loan.model';

function setup(loanApiStub: Partial<LoanApi>) {
  TestBed.configureTestingModule({
    providers: [{ provide: LoanApi, useValue: loanApiStub }],
  });
  return TestBed.inject(SelfCheckoutStore);
}

describe('SelfCheckoutStore.checkAvailability', () => {
  it('records the availability result for a book it has not checked yet', () => {
    const store = setup({ checkAvailability: () => of({ message: 'ok', available: true }) });

    store.checkAvailability('book-1');

    expect(store.availability()).toEqual({ 'book-1': true });
  });

  it('does not re-query a book that has already been checked', () => {
    const checkSpy = jest.fn(() => of({ message: 'ok', available: true }));
    const store = setup({ checkAvailability: checkSpy });

    store.checkAvailability('book-1');
    store.checkAvailability('book-1');

    expect(checkSpy).toHaveBeenCalledTimes(1);
  });

  it('leaves the key unset on failure so a later revisit can retry', () => {
    const httpError = new HttpErrorResponse({ status: 500 });
    const store = setup({ checkAvailability: () => throwError(() => httpError) });

    store.checkAvailability('book-1');

    expect('book-1' in store.availability()).toBe(false);
  });
});

describe('SelfCheckoutStore.checkout', () => {
  it('marks the book unavailable in the availability map after a successful checkout', (done) => {
    const response: SelfCheckoutResponse = {
      message: 'checked out',
      record: {
        id: 'record-1',
        status: 'LOANED',
        loanedDate: '2026-01-01',
        dueDate: '2099-01-01',
        returnedDate: '',
        patron: 'patron-1',
        employeeOut: '',
        item: 'book-1',
      },
    };
    const store = setup({ selfCheckout: () => of(response) });
    store.availability.set({ 'book-1': true });

    store.checkout('book-1', '2099-01-01').subscribe(() => {
      expect(store.availability()['book-1']).toBe(false);
      done();
    });
  });
});

describe('SelfCheckoutStore.extractErrorMessage', () => {
  it('returns the API error message when present', () => {
    const store = setup({});
    const error = new HttpErrorResponse({ error: { message: 'Book already loaned' } });

    expect(store.extractErrorMessage(error)).toBe('Book already loaned');
  });

  it('falls back to a generic message when the error body has none', () => {
    const store = setup({});
    const error = new HttpErrorResponse({ error: {} });

    expect(store.extractErrorMessage(error)).toBe('Unable to check out this book right now.');
  });
});