import { test, expect } from '@playwright/test';
import { mockApi } from '../helpers/mock-api';
import { makeAuthUser } from '../helpers/auth';

test.describe('Register', () => {
  test('shows the "registration submitted" screen after a successful submit', async ({ page }) => {
    await mockApi(page, '/auth/register', {
      method: 'POST',
      body: { message: 'Registered', user: makeAuthUser() },
    });

    await page.goto('/register');
    await page.getByLabel('First name').fill('Jane');
    await page.getByLabel('Last name').fill('Doe');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('heading', { name: 'Registration submitted' })).toBeVisible();
    await expect(
      page.getByText('An admin needs to approve your account before you can sign in.'),
    ).toBeVisible();
  });

  test('shows inline validation errors and does not submit an empty form', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByText('At least 8 characters.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Registration submitted' })).toHaveCount(0);
  });

  test('flags mismatched passwords', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('First name').fill('Jane');
    await page.getByLabel('Last name').fill('Doe');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm password').fill('different456');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText("Passwords don't match.")).toBeVisible();
  });

  test('surfaces a server-side error (e.g. duplicate email) without navigating away', async ({
    page,
  }) => {
    await mockApi(page, '/auth/register', {
      method: 'POST',
      status: 409,
      body: { message: 'An account with this email already exists.' },
    });

    await page.goto('/register');
    await page.getByLabel('First name').fill('Jane');
    await page.getByLabel('Last name').fill('Doe');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('An account with this email already exists.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
  });
});

test.describe('Login', () => {
  test('signs in and redirects to home on success', async ({ page }) => {
    const user = makeAuthUser({ email: 'jane@example.com' });
    await mockApi(page, '/auth/login', {
      method: 'POST',
      body: { message: 'Signed in', token: 'fake.jwt.token', user },
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/');
  });

  test('shows the server error message on invalid credentials and stays on the page', async ({
    page,
  }) => {
    await mockApi(page, '/auth/login', {
      method: 'POST',
      status: 401,
      body: { message: 'Invalid email or password.' },
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('requires a valid email and a password before submitting', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
  });
});
