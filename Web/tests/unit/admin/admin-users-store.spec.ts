import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AdminUsersStore } from '../../../src/app/core/state/admin-users-store';
import { UserApi } from '../../../src/app/core/api/user-api';
import { AdminUser } from '../../../src/app/core/models/admin.model';

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    status: 'PENDING',
    ...overrides,
  };
}

function setup(userApiStub: Partial<UserApi>) {
  TestBed.configureTestingModule({ providers: [{ provide: UserApi, useValue: userApiStub }] });
  return TestBed.inject(AdminUsersStore);
}

describe('AdminUsersStore.load', () => {
  it('populates users on success', () => {
    const store = setup({ getAll: () => of({ message: 'ok', users: [makeUser()] }) });

    store.load();

    expect(store.users()).toEqual([makeUser()]);
    expect(store.loading()).toBe(false);
  });

  it('sets errorMessage and clears users on failure', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'db down' } });
    const store = setup({ getAll: () => throwError(() => httpError) });

    store.load();

    expect(store.users()).toEqual([]);
    expect(store.errorMessage()).toBe('db down');
  });
});

describe('AdminUsersStore derived signals', () => {
  it('filteredUsers defaults to the PENDING filter', () => {
    const store = setup({
      getAll: () =>
        of({ message: 'ok', users: [makeUser({ id: 'u1', status: 'PENDING' }), makeUser({ id: 'u2', status: 'APPROVED' })] }),
    });
    store.load();

    expect(store.filteredUsers().map((u) => u.id)).toEqual(['u1']);
  });

  it('filteredUsers returns everyone when the filter is ALL', () => {
    const store = setup({
      getAll: () =>
        of({ message: 'ok', users: [makeUser({ id: 'u1', status: 'PENDING' }), makeUser({ id: 'u2', status: 'APPROVED' })] }),
    });
    store.load();

    store.setStatusFilter('ALL');

    expect(store.filteredUsers()).toHaveLength(2);
  });

  it('pendingCount counts only PENDING users regardless of the active filter', () => {
    const store = setup({
      getAll: () =>
        of({
          message: 'ok',
          users: [makeUser({ id: 'u1', status: 'PENDING' }), makeUser({ id: 'u2', status: 'PENDING' }), makeUser({ id: 'u3', status: 'APPROVED' })],
        }),
    });
    store.load();
    store.setStatusFilter('ALL');

    expect(store.pendingCount()).toBe(2);
  });
});

describe('AdminUsersStore action methods (approve/reject/promote/demote)', () => {
  it('approve() splices the updated user back into the list', () => {
    const store = setup({
      getAll: () => of({ message: 'ok', users: [makeUser({ id: 'u1', status: 'PENDING' })] }),
      approve: () => of({ message: 'approved', user: makeUser({ id: 'u1', status: 'APPROVED' }) }),
    });
    store.load();

    store.approve('u1');

    expect(store.users()[0].status).toBe('APPROVED');
    expect(store.actionPendingId()).toBeNull();
  });

  it('reject() splices the updated user back into the list', () => {
    const store = setup({
      getAll: () => of({ message: 'ok', users: [makeUser({ id: 'u1', status: 'PENDING' })] }),
      reject: () => of({ message: 'rejected', user: makeUser({ id: 'u1', status: 'REJECTED' }) }),
    });
    store.load();

    store.reject('u1');

    expect(store.users()[0].status).toBe('REJECTED');
  });

  it('promote() splices the updated user back into the list', () => {
    const store = setup({
      getAll: () => of({ message: 'ok', users: [makeUser({ id: 'u1', type: 'PATRON' })] }),
      promote: () => of({ message: 'promoted', user: makeUser({ id: 'u1', type: 'EMPLOYEE' }) }),
    });
    store.load();

    store.promote('u1');

    expect(store.users()[0].type).toBe('EMPLOYEE');
  });

  it('demote() splices the updated user back into the list', () => {
    const store = setup({
      getAll: () => of({ message: 'ok', users: [makeUser({ id: 'u1', type: 'EMPLOYEE' })] }),
      demote: () => of({ message: 'demoted', user: makeUser({ id: 'u1', type: 'PATRON' }) }),
    });
    store.load();

    store.demote('u1');

    expect(store.users()[0].type).toBe('PATRON');
  });

  it('sets actionError with the action-specific fallback when approve fails', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: {} });
    const store = setup({ approve: () => throwError(() => httpError) });

    store.approve('u1');

    expect(store.actionError()).toBe('Unable to approve this user right now.');
  });
});

describe('AdminUsersStore.remove', () => {
  it('removes the user from the list on success', () => {
    const store = setup({
      getAll: () => of({ message: 'ok', users: [makeUser({ id: 'u1' }), makeUser({ id: 'u2' })] }),
      remove: () => of({ message: 'deleted' }),
    });
    store.load();

    store.remove('u1');

    expect(store.users().map((u) => u.id)).toEqual(['u2']);
  });

  it('sets actionError on failure and leaves the list untouched', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'delete failed' } });
    const store = setup({
      getAll: () => of({ message: 'ok', users: [makeUser({ id: 'u1' })] }),
      remove: () => throwError(() => httpError),
    });
    store.load();

    store.remove('u1');

    expect(store.actionError()).toBe('delete failed');
    expect(store.users()).toHaveLength(1);
  });
});