import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { AuthApi } from '../../../src/app/core/api/auth-api';
import {
  AuthUser,
  LoginResponse,
  MeResponse,
  RegisterResponse,
} from '../../../src/app/core/models/auth.model';

const testUser: AuthUser = {
  id: 'user-1',
  type: 'PATRON',
  firstname: 'Jane',
  lastname: 'Doe',
  email: 'jane@example.com',
};

function setup(authApiStub: Partial<AuthApi>) {
  TestBed.configureTestingModule({
    providers: [{ provide: AuthApi, useValue: authApiStub }],
  });
  return TestBed.inject(AuthStore);
}

describe('AuthStore.restoreSession', () => {
  it('starts with restoring true and no user before restoreSession resolves', () => {
    const store = setup({
      me: () => of({ message: 'ok', user: testUser, csrfToken: 'csrf-token-value' } as MeResponse),
    });

    expect(store.restoring()).toBe(true);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
  });

  it('sets the user and clears restoring when GET /auth/me succeeds', (done) => {
    const response: MeResponse = { message: 'ok', user: testUser, csrfToken: 'csrf-token-value' };
    const store = setup({ me: () => of(response) });

    store.restoreSession().subscribe(() => {
      expect(store.isAuthenticated()).toBe(true);
      expect(store.user()).toEqual(testUser);
      expect(store.restoring()).toBe(false);
      done();
    });
  });

  it('stays unauthenticated and clears restoring when GET /auth/me fails (no valid cookie)', (done) => {
    const httpError = new HttpErrorResponse({
      status: 401,
      error: { message: 'Not authenticated' },
    });
    const store = setup({ me: () => throwError(() => httpError) });

    store.restoreSession().subscribe((user) => {
      expect(user).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.user()).toBeNull();
      expect(store.restoring()).toBe(false);
      done();
    });
  });
});

describe('AuthStore.login', () => {
  it('sets the session and clears loading/error on success', (done) => {
    const response: LoginResponse = {
      message: 'ok',
      user: testUser,
      csrfToken: 'csrf-token-value',
    };
    const store = setup({ login: () => of(response) });

    store.login({ email: testUser.email, password: 'secret' }).subscribe(() => {
      expect(store.isAuthenticated()).toBe(true);
      expect(store.user()).toEqual(testUser);
      expect(store.loading()).toBe(false);
      expect(store.errorMessage()).toBeNull();
      done();
    });
  });

  it('sets errorMessage from the API error body and re-throws on failure', (done) => {
    const httpError = new HttpErrorResponse({
      status: 401,
      error: { message: 'Invalid email or password' },
    });
    const store = setup({ login: () => throwError(() => httpError) });

    store.login({ email: testUser.email, password: 'wrong' }).subscribe({
      next: () => done.fail('expected an error'),
      error: () => {
        expect(store.loading()).toBe(false);
        expect(store.errorMessage()).toBe('Invalid email or password');
        expect(store.isAuthenticated()).toBe(false);
        done();
      },
    });
  });

  it('falls back to a generic message when the error body has no message', (done) => {
    const httpError = new HttpErrorResponse({ status: 500, error: {} });
    const store = setup({ login: () => throwError(() => httpError) });

    store.login({ email: testUser.email, password: 'x' }).subscribe({
      error: () => {
        expect(store.errorMessage()).toBe('Unable to sign in. Check your details and try again.');
        done();
      },
    });
  });
});

describe('AuthStore.register', () => {
  it('toggles loading without establishing a session on success', (done) => {
    const response: RegisterResponse = { message: 'registered', user: testUser };
    const store = setup({ register: () => of(response) });

    store.register({ ...testUser, password: 'secret' } as any).subscribe(() => {
      expect(store.loading()).toBe(false);
      expect(store.isAuthenticated()).toBe(false);
      done();
    });
  });

  it('sets errorMessage and re-throws on failure', (done) => {
    const httpError = new HttpErrorResponse({
      status: 409,
      error: { message: 'Email already registered' },
    });
    const store = setup({ register: () => throwError(() => httpError) });

    store.register({ ...testUser, password: 'x' } as any).subscribe({
      error: () => {
        expect(store.errorMessage()).toBe('Email already registered');
        done();
      },
    });
  });
});

describe('AuthStore.logout', () => {
  it('clears the session signal and calls the backend logout endpoint', () => {
    const logoutFn = jest.fn(() => of({ message: 'Logged out successfully' }));
    const store = setup({
      login: () => of({ message: 'ok', user: testUser, csrfToken: 'csrf-token-value' }),
      logout: logoutFn,
    });

    store.login({ email: testUser.email, password: 'secret' }).subscribe(() => {
      store.logout();

      expect(store.isAuthenticated()).toBe(false);
      expect(store.user()).toBeNull();
      expect(logoutFn).toHaveBeenCalled();
    });
  });

  it('still clears local state if the backend logout call fails', () => {
    const store = setup({
      login: () => of({ message: 'ok', user: testUser, csrfToken: 'csrf-token-value' }),
      logout: () => throwError(() => new HttpErrorResponse({ status: 500 })),
    });

    store.login({ email: testUser.email, password: 'secret' }).subscribe(() => {
      expect(() => store.logout()).not.toThrow();
      expect(store.isAuthenticated()).toBe(false);
    });
  });
});

describe('AuthStore.updateUser', () => {
  it('updates the cached user without touching the session', (done) => {
    const response: LoginResponse = {
      message: 'ok',
      user: testUser,
      csrfToken: 'csrf-token-value',
    };
    const store = setup({ login: () => of(response) });

    store.login({ email: testUser.email, password: 'secret' }).subscribe(() => {
      const updated: AuthUser = { ...testUser, firstname: 'Janet' };
      store.updateUser(updated);

      expect(store.user()).toEqual(updated);
      expect(store.isAuthenticated()).toBe(true);
      done();
    });
  });
});

describe('AuthStore role computed signals', () => {
  it('isAdmin/isPatron/isStaff reflect the current user type', (done) => {
    const adminUser: AuthUser = { ...testUser, type: 'ADMIN' };
    const store = setup({
      login: () => of({ message: 'ok', user: adminUser, csrfToken: 'csrf-token-value' }),
    });

    store.login({ email: adminUser.email, password: 'x' }).subscribe(() => {
      expect(store.isAdmin()).toBe(true);
      expect(store.isPatron()).toBe(false);
      expect(store.isStaff()).toBe(true);
      done();
    });
  });

  it('reports no role flags when unauthenticated', () => {
    const store = setup({});

    expect(store.isAdmin()).toBe(false);
    expect(store.isPatron()).toBe(false);
    expect(store.isStaff()).toBe(false);
  });
});
