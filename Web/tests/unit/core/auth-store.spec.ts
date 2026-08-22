import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { AuthApi } from '../../../src/app/core/api/auth-api';
import { AuthUser, LoginResponse, RegisterResponse } from '../../../src/app/core/models/auth.model';

const TOKEN_KEY = 'libraease.token';
const USER_KEY = 'libraease.user';

function makeToken(expSeconds: number | undefined): string {
  const base64url = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = expSeconds === undefined ? {} : { exp: expSeconds };
  return `${base64url({ alg: 'HS256' })}.${base64url(payload)}.sig`;
}

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

beforeEach(() => {
  localStorage.clear();
});

describe('AuthStore - session restoration on construction', () => {
  it('starts unauthenticated when localStorage has nothing stored', () => {
    const store = setup({});

    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
  });

  it('restores the session when a valid, non-expired token and user are stored', () => {
    const futureExp = Math.floor((Date.now() + 60_000) / 1000);
    localStorage.setItem(TOKEN_KEY, makeToken(futureExp));
    localStorage.setItem(USER_KEY, JSON.stringify(testUser));

    const store = setup({});

    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()).toEqual(testUser);
  });

  it('clears storage and stays unauthenticated when the stored token is expired', () => {
    const pastExp = Math.floor((Date.now() - 60_000) / 1000);
    localStorage.setItem(TOKEN_KEY, makeToken(pastExp));
    localStorage.setItem(USER_KEY, JSON.stringify(testUser));

    const store = setup({});

    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('clears storage and stays unauthenticated when the stored user JSON is corrupt', () => {
    const futureExp = Math.floor((Date.now() + 60_000) / 1000);
    localStorage.setItem(TOKEN_KEY, makeToken(futureExp));
    localStorage.setItem(USER_KEY, '{not-valid-json');

    const store = setup({});

    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('AuthStore.login', () => {
  it('sets the session and clears loading/error on success', (done) => {
    const response: LoginResponse = { message: 'ok', token: 'jwt-token', user: testUser };
    const store = setup({ login: () => of(response) });

    store.login({ email: testUser.email, password: 'secret' }).subscribe(() => {
      expect(store.isAuthenticated()).toBe(true);
      expect(store.user()).toEqual(testUser);
      expect(store.token()).toBe('jwt-token');
      expect(store.loading()).toBe(false);
      expect(store.errorMessage()).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-token');
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
    const httpError = new HttpErrorResponse({ status: 409, error: { message: 'Email already registered' } });
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
  it('clears the session signals and localStorage', () => {
    localStorage.setItem(TOKEN_KEY, 'some-token');
    localStorage.setItem(USER_KEY, JSON.stringify(testUser));
    const store = setup({});

    store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});

describe('AuthStore.updateUser', () => {
  it('updates the cached user without touching the token', (done) => {
    const response: LoginResponse = { message: 'ok', token: 'jwt-token', user: testUser };
    const store = setup({ login: () => of(response) });

    store.login({ email: testUser.email, password: 'secret' }).subscribe(() => {
      const updated: AuthUser = { ...testUser, firstname: 'Janet' };
      store.updateUser(updated);

      expect(store.user()).toEqual(updated);
      expect(store.token()).toBe('jwt-token');
      expect(JSON.parse(localStorage.getItem(USER_KEY)!)).toEqual(updated);
      done();
    });
  });
});

describe('AuthStore role computed signals', () => {
  it('isAdmin/isPatron/isStaff reflect the current user type', (done) => {
    const adminUser: AuthUser = { ...testUser, type: 'ADMIN' };
    const store = setup({ login: () => of({ message: 'ok', token: 't', user: adminUser }) });

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