import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { Login } from '../../../src/app/features/auth/login/login';
import { AuthStore } from '../../../src/app/core/state/auth-store';

function setup(opts: { login?: jest.Mock; loading?: boolean; errorMessage?: string | null } = {}) {
  const authStoreStub = {
    login: opts.login ?? jest.fn(() => of({ message: 'ok', token: 't', user: { id: 'u1' } })),
    loading: () => opts.loading ?? false,
    errorMessage: () => opts.errorMessage ?? null,
  };

  return { authStoreStub };
}

describe('Login - form validation', () => {
  it('shows required/format errors only after a submit attempt', async () => {
    const user = userEvent.setup();
    const { authStoreStub } = setup();
    await render(Login, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    expect(screen.queryByText('Enter a valid email address.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
  });

  it('does not call authStore.login when the form is invalid', async () => {
    const user = userEvent.setup();
    const loginSpy = jest.fn(() => of({ message: 'ok', token: 't', user: {} }));
    const { authStoreStub } = setup({ login: loginSpy });
    await render(Login, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(loginSpy).not.toHaveBeenCalled();
  });
});

describe('Login - submission', () => {
  it('calls authStore.login with the entered credentials and navigates home by default', async () => {
    const user = userEvent.setup();
    const loginSpy = jest.fn(() => of({ message: 'ok', token: 't', user: {} }));
    const { authStoreStub } = setup({ login: loginSpy });
    await render(Login, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(loginSpy).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'secret123' });
    expect(navigateSpy).toHaveBeenCalledWith('/');
  });

  it('navigates to the bound returnUrl instead of "/" when one is provided', async () => {
    const user = userEvent.setup();
    const loginSpy = jest.fn(() => of({ message: 'ok', token: 't', user: {} }));
    const { authStoreStub } = setup({ login: loginSpy });
    await render(Login, {
      inputs: { returnUrl: '/profile' },
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(navigateSpy).toHaveBeenCalledWith('/profile');
  });
});

describe('Login - store-driven UI state', () => {
  it('shows the store errorMessage when present', async () => {
    const { authStoreStub } = setup({ errorMessage: 'Invalid email or password' });
    await render(Login, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
  });

  it('disables the submit button and shows "Signing in…" while loading', async () => {
    const { authStoreStub } = setup({ loading: true });
    await render(Login, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  });
});

describe('Login - password visibility', () => {
  it('toggles the password field between masked and visible text', async () => {
    const user = userEvent.setup();
    const { authStoreStub } = setup();
    await render(Login, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(passwordInput.type).toBe('text');
  });
});