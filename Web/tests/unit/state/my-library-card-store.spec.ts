import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { MyLibraryCardStore } from '../../../src/app/core/state/my-library-card-store';
import { LibraryCardApi } from '../../../src/app/core/api/library-card-api';
import { LibraryCardWithUser } from '../../../src/app/core/models/library-card.model';

const card: LibraryCardWithUser = {
  id: 'card-1',
  user: 'user-1',
  userDetails: {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    status: 'APPROVED',
  },
};

function setup(apiStub: Partial<LibraryCardApi>) {
  TestBed.configureTestingModule({
    providers: [{ provide: LibraryCardApi, useValue: apiStub }],
  });
  return TestBed.inject(MyLibraryCardStore);
}

describe('MyLibraryCardStore.load', () => {
  it('sets the card on success and clears loading/notIssued', () => {
    const store = setup({ getMine: () => of({ message: 'ok', card }) });

    store.load();

    expect(store.card()).toEqual(card);
    expect(store.loading()).toBe(false);
    expect(store.notIssued()).toBe(false);
    expect(store.errorMessage()).toBeNull();
  });

  it('sets notIssued (not errorMessage) on a 404', () => {
    const httpError = new HttpErrorResponse({ status: 404, error: { message: 'not found' } });
    const store = setup({ getMine: () => throwError(() => httpError) });

    store.load();

    expect(store.card()).toBeNull();
    expect(store.notIssued()).toBe(true);
    expect(store.errorMessage()).toBeNull();
  });

  it('sets errorMessage (not notIssued) on a non-404 failure', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'server exploded' } });
    const store = setup({ getMine: () => throwError(() => httpError) });

    store.load();

    expect(store.card()).toBeNull();
    expect(store.notIssued()).toBe(false);
    expect(store.errorMessage()).toBe('server exploded');
  });

  it('falls back to a generic message when the error body has no message', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: {} });
    const store = setup({ getMine: () => throwError(() => httpError) });

    store.load();

    expect(store.errorMessage()).toBe('Unable to load your library card right now.');
  });
});
