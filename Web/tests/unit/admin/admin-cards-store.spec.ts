import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AdminCardsStore } from '../../../src/app/core/state/admin-cards-store';
import { LibraryCardApi } from '../../../src/app/core/api/library-card-api';
import { UserApi } from '../../../src/app/core/api/user-api';
import { LibraryCardWithUser } from '../../../src/app/core/models/library-card.model';
import { AdminUser } from '../../../src/app/core/models/admin.model';

function makeCard(overrides: Partial<LibraryCardWithUser> = {}): LibraryCardWithUser {
  return {
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
    ...overrides,
  };
}

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    status: 'APPROVED',
    ...overrides,
  };
}

function setup(opts: { cardApi?: Partial<LibraryCardApi>; userApi?: Partial<UserApi> }) {
  TestBed.configureTestingModule({
    providers: [
      { provide: LibraryCardApi, useValue: opts.cardApi ?? {} },
      { provide: UserApi, useValue: opts.userApi ?? {} },
    ],
  });
  return TestBed.inject(AdminCardsStore);
}

describe('AdminCardsStore.loadCards', () => {
  it('populates cards on success', () => {
    const store = setup({
      cardApi: { getAll: () => of({ message: 'ok', count: 1, cards: [makeCard()] }) },
    });

    store.loadCards();

    expect(store.cards()).toEqual([makeCard()]);
    expect(store.cardsLoading()).toBe(false);
  });

  it('sets cardsError and clears cards on failure', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'db down' } });
    const store = setup({ cardApi: { getAll: () => throwError(() => httpError) } });

    store.loadCards();

    expect(store.cards()).toEqual([]);
    expect(store.cardsError()).toBe('db down');
  });
});

describe('AdminCardsStore.loadUsers', () => {
  it('populates users on success', () => {
    const store = setup({ userApi: { getAll: () => of({ message: 'ok', users: [makeUser()] }) } });

    store.loadUsers();

    expect(store.users()).toEqual([makeUser()]);
  });

  it('sets usersError and clears users on failure', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'db down' } });
    const store = setup({ userApi: { getAll: () => throwError(() => httpError) } });

    store.loadUsers();

    expect(store.users()).toEqual([]);
    expect(store.usersError()).toBe('db down');
  });
});

describe('AdminCardsStore.userIdsWithCard', () => {
  it('derives the set of user ids that already have a card', () => {
    const store = setup({
      cardApi: {
        getAll: () =>
          of({
            message: 'ok',
            count: 2,
            cards: [makeCard({ user: 'u1' }), makeCard({ user: 'u2', id: 'card-2' })],
          }),
      },
    });

    store.loadCards();

    expect(store.userIdsWithCard()).toEqual(new Set(['u1', 'u2']));
  });
});

describe('AdminCardsStore.issue', () => {
  it('adds the newly issued card to the list', () => {
    const store = setup({
      cardApi: { issue: () => of({ message: 'issued', savedCard: makeCard() }) },
    });

    store.issue('user-1');

    expect(store.cards()).toEqual([makeCard()]);
    expect(store.issuePendingUserId()).toBeNull();
    expect(store.issueError()).toBeNull();
  });

  it('de-dupes when the backend returns an already-existing card for that user (idempotent issue)', () => {
    const store = setup({
      cardApi: { issue: () => of({ message: 'issued', savedCard: makeCard() }) },
    });
    store.issue('user-1');

    store.issue('user-1');

    expect(store.cards()).toEqual([makeCard()]);
  });

  it('sets issueError on failure', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: { message: 'Cannot issue to an admin' },
    });
    const store = setup({ cardApi: { issue: () => throwError(() => httpError) } });

    store.issue('admin-1');

    expect(store.issueError()).toBe('Cannot issue to an admin');
    expect(store.issuePendingUserId()).toBeNull();
  });
});
