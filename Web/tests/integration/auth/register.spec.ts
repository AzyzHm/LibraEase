import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Register } from '../../../src/app/features/auth/register/register';
import { AuthStore } from '../../../src/app/core/state/auth-store';

function setup(opts: { register?: jest.Mock; loading?: boolean; errorMessage?: string | null } = {}) {
  const authStoreStub = {
    register: opts.register ?? jest.fn(() => of({ message: 'ok', user: { id: 'u1' } })),
    loading: () => opts.loading ?? false,
    errorMessage: () => opts.errorMessage ?? null,
  };

  return { authStoreStub };
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('First name'), 'Jane');
  await user.type(screen.getByLabelText('Last name'), 'Doe');
  await user.type(screen.getByLabelText('Email'), 'jane@example.com');
  await user.type(screen.getByLabelText('Password'), 'secret123');
  await user.type(screen.getByLabelText('Confirm password'), 'secret123');
}

describe('Register - form validation', () => {
  it('shows required-field errors only after a submit attempt', async () => {
    const user = userEvent.setup();
    const { authStoreStub } = setup();
    await render(Register, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    expect(screen.queryAllByText('Required.')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getAllByText('Required.')).toHaveLength(2); // firstname + lastname
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
  });

  it('shows a mismatch error when password and confirmPassword differ', async () => {
    const user = userEvent.setup();
    const { authStoreStub } = setup();
    await render(Register, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    await user.type(screen.getByLabelText('First name'), 'Jane');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText('Confirm password'), 'different456');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
  });

  it('does not call authStore.register when the form is invalid', async () => {
    const user = userEvent.setup();
    const registerSpy = jest.fn(() => of({ message: 'ok', user: {} }));
    const { authStoreStub } = setup({ register: registerSpy });
    await render(Register, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(registerSpy).not.toHaveBeenCalled();
  });
});

describe('Register - submission', () => {
  it('calls authStore.register with the form payload minus confirmPassword', async () => {
    const user = userEvent.setup();
    const registerSpy = jest.fn(() => of({ message: 'ok', user: {} }));
    const { authStoreStub } = setup({ register: registerSpy });
    await render(Register, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(registerSpy).toHaveBeenCalledWith({
      firstname: 'Jane',
      lastname: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
    });
  });

  it('shows the success view after a successful registration', async () => {
    const user = userEvent.setup();
    const { authStoreStub } = setup();
    await render(Register, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Registration submitted')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });
});

describe('Register - store-driven UI state', () => {
  it('shows the store errorMessage when present', async () => {
    const { authStoreStub } = setup({ errorMessage: 'Email already registered' });
    await render(Register, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    expect(screen.getByText('Email already registered')).toBeInTheDocument();
  });

  it('disables the submit button and shows "Submitting…" while loading', async () => {
    const { authStoreStub } = setup({ loading: true });
    await render(Register, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });

    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled();
  });
});

describe('Register - password visibility', () => {
  it('toggles the password and confirm-password fields independently', async () => {
    const user = userEvent.setup();
    const { authStoreStub } = setup();
    await render(Register, {
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreStub }],
    });
    const password = screen.getByLabelText('Password') as HTMLInputElement;
    const confirmPassword = screen.getByLabelText('Confirm password') as HTMLInputElement;

    await user.click(screen.getAllByRole('button', { name: 'Show password' })[0]);

    expect(password.type).toBe('text');
    expect(confirmPassword.type).toBe('password');
  });
});