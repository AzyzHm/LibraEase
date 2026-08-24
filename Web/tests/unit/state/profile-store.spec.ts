import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ProfileStore } from '../../../src/app/core/state/profile-store';
import { UserApi } from '../../../src/app/core/api/user-api';
import { LoanApi } from '../../../src/app/core/api/loan-api';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { AuthUser } from '../../../src/app/core/models/auth.model';
import { LoanRecordWithItem } from '../../../src/app/core/models/loan.model';

const currentUser: AuthUser = {
  id: 'user-1',
  type: 'PATRON',
  firstname: 'Jane',
  lastname: 'Doe',
  email: 'jane@example.com',
};

function setup(opts: {
  userApi?: Partial<UserApi>;
  loanApi?: Partial<LoanApi>;
  user?: AuthUser | null;
}) {
  const authStoreStub = {
    user: () => (opts.user === undefined ? currentUser : opts.user),
    updateUser: jest.fn(),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: UserApi, useValue: opts.userApi ?? {} },
      { provide: LoanApi, useValue: opts.loanApi ?? {} },
      { provide: AuthStore, useValue: authStoreStub },
    ],
  });

  return { store: TestBed.inject(ProfileStore), authStoreStub };
}

describe('ProfileStore.saveProfile', () => {
  const editPayload = { firstname: 'Janet', lastname: 'Doe', email: 'jane@example.com' };

  it('does nothing when there is no signed-in user', () => {
    const updateSpy = jest.fn();
    const { store } = setup({ userApi: { update: updateSpy }, user: null });

    store.saveProfile(editPayload);

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('updates the authStore user and sets profileSaved on success', () => {
    const updatedUser: AuthUser = { ...currentUser, firstname: 'Janet' };
    const { store, authStoreStub } = setup({
      userApi: { update: () => of({ message: 'ok', updatedUser }) },
    });

    store.saveProfile(editPayload);

    expect(authStoreStub.updateUser).toHaveBeenCalledWith(updatedUser);
    expect(store.profileSaved()).toBe(true);
    expect(store.savingProfile()).toBe(false);
    expect(store.profileError()).toBeNull();
  });

  it('sends the current user id/type merged with the edit payload', () => {
    let capturedPayload: unknown;
    const { store } = setup({
      userApi: {
        update: (payload) => {
          capturedPayload = payload;
          return of({ message: 'ok', updatedUser: currentUser });
        },
      },
    });

    store.saveProfile(editPayload);

    expect(capturedPayload).toEqual({ id: currentUser.id, type: currentUser.type, ...editPayload });
  });

  it('sets profileError and leaves profileSaved false on failure', () => {
    const httpError = new HttpErrorResponse({
      status: 409,
      error: { message: 'Email already in use' },
    });
    const { store } = setup({ userApi: { update: () => throwError(() => httpError) } });

    store.saveProfile(editPayload);

    expect(store.profileError()).toBe('Email already in use');
    expect(store.profileSaved()).toBe(false);
    expect(store.savingProfile()).toBe(false);
  });
});

describe('ProfileStore.resetProfileFeedback', () => {
  it('clears both profileError and profileSaved', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'boom' } });
    const { store } = setup({ userApi: { update: () => throwError(() => httpError) } });
    store.saveProfile({ firstname: 'x', lastname: 'y', email: 'z' });
    expect(store.profileError()).toBe('boom');

    store.resetProfileFeedback();

    expect(store.profileError()).toBeNull();
    expect(store.profileSaved()).toBe(false);
  });
});

describe('ProfileStore.loadMyLoans', () => {
  it('does nothing when there is no signed-in user', () => {
    const queryByPatronSpy = jest.fn();
    const { store } = setup({ loanApi: { queryByPatron: queryByPatronSpy }, user: null });

    store.loadMyLoans();

    expect(queryByPatronSpy).not.toHaveBeenCalled();
  });

  it('populates loans for the current user on success', () => {
    const record = { id: 'r1' } as unknown as LoanRecordWithItem;
    const { store } = setup({
      loanApi: { queryByPatron: () => of({ message: 'ok', records: [record] }) },
    });

    store.loadMyLoans();

    expect(store.loans()).toEqual([record]);
    expect(store.loansLoading()).toBe(false);
    expect(store.loansError()).toBeNull();
  });

  it('queries by the current user id', () => {
    const querySpy = jest.fn(() => of({ message: 'ok', records: [] }));
    const { store } = setup({ loanApi: { queryByPatron: querySpy } });

    store.loadMyLoans();

    expect(querySpy).toHaveBeenCalledWith(currentUser.id);
  });

  it('clears loans and sets loansError on failure', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'db down' } });
    const { store } = setup({ loanApi: { queryByPatron: () => throwError(() => httpError) } });

    store.loadMyLoans();

    expect(store.loans()).toEqual([]);
    expect(store.loansError()).toBe('db down');
  });
});
