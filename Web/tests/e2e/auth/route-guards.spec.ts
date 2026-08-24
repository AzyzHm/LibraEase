import { test, expect } from '@playwright/test';
import { loginAs, makeAuthUser } from '../helpers/auth';
import { mockApi } from '../helpers/mock-api';

test.describe('authGuard - protected patron routes', () => {
  test('redirects an anonymous visitor from /profile to /login with a returnUrl', async ({
    page,
  }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL('/login?returnUrl=%2Fprofile');
  });

  test('redirects an anonymous visitor from /my-card to /login with a returnUrl', async ({
    page,
  }) => {
    await page.goto('/my-card');

    await expect(page).toHaveURL('/login?returnUrl=%2Fmy-card');
  });

  test('honors returnUrl after a successful login', async ({ page }) => {
    await mockApi(page, '/auth/login', {
      method: 'POST',
      body: { message: 'Signed in', token: 'fake.jwt.token', user: makeAuthUser() },
    });
    await mockApi(page, '/loan/query', { method: 'POST', body: { message: 'ok', records: [] } });

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/profile');
  });
});

test.describe('staffGuard - /admin', () => {
  test('redirects an anonymous visitor from /admin to /', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL('/');
  });

  test('redirects a signed-in PATRON away from /admin', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'PATRON' }));

    await page.goto('/admin');

    await expect(page).toHaveURL('/');
  });

  test('lets a signed-in ADMIN through to /admin', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    await mockApi(page, '/users', { method: 'GET', body: { message: 'ok', users: [] } });

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
  });
});

test.describe('guestGuard - /login and /register', () => {
  test('redirects an already signed-in user away from /login', async ({ page }) => {
    await loginAs(page, makeAuthUser());

    await page.goto('/login');

    await expect(page).toHaveURL('/');
  });

  test('redirects an already signed-in user away from /register', async ({ page }) => {
    await loginAs(page, makeAuthUser());

    await page.goto('/register');

    await expect(page).toHaveURL('/');
  });
});
