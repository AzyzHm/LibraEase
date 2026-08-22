import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard, staffGuard, guestGuard } from '../../../src/app/core/guards/auth-guard';
import { AuthStore } from '../../../src/app/core/state/auth-store';

function setup(authStoreStub: Partial<AuthStore>) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
  });
  return TestBed.inject(Router);
}

function runGuard<T>(guardFn: () => T): T {
  return TestBed.runInInjectionContext(guardFn);
}

describe('authGuard', () => {
  it('allows navigation when the user is authenticated', () => {
    setup({ isAuthenticated: () => true } as Partial<AuthStore>);

    const result = runGuard(() =>
      authGuard({} as any, { url: '/profile' } as any)
    );

    expect(result).toBe(true);
  });

  it('redirects to /login with a returnUrl when not authenticated', () => {
    const router = setup({ isAuthenticated: () => false } as Partial<AuthStore>);

    const result = runGuard(() =>
      authGuard({} as any, { url: '/profile' } as any)
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fprofile');
  });
});

describe('staffGuard', () => {
  it('allows navigation for an authenticated staff member', () => {
    setup({ isAuthenticated: () => true, isStaff: () => true } as Partial<AuthStore>);

    const result = runGuard(() => staffGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('redirects home when authenticated but not staff', () => {
    const router = setup({ isAuthenticated: () => true, isStaff: () => false } as Partial<AuthStore>);

    const result = runGuard(() => staffGuard({} as any, {} as any)) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/');
  });

  it('redirects home when not authenticated', () => {
    const router = setup({ isAuthenticated: () => false, isStaff: () => false } as Partial<AuthStore>);

    const result = runGuard(() => staffGuard({} as any, {} as any)) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/');
  });
});

describe('guestGuard', () => {
  it('allows navigation when not authenticated', () => {
    setup({ isAuthenticated: () => false } as Partial<AuthStore>);

    const result = runGuard(() => guestGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('redirects home when already authenticated', () => {
    const router = setup({ isAuthenticated: () => true } as Partial<AuthStore>);

    const result = runGuard(() => guestGuard({} as any, {} as any)) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/');
  });
});