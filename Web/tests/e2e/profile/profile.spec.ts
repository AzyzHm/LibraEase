import { test, expect } from '@playwright/test';
import { mockApi, CORS_RESPONSE_HEADERS } from '../helpers/mock-api';
import { loginAs, makeAuthUser } from '../helpers/auth';
import { makeBook, makeLoan } from '../helpers/fixtures';

test.describe('Profile - my loans', () => {
  test('lists current and past loans with the account email/type', async ({ page }) => {
    await loginAs(page, makeAuthUser({ email: 'jane@example.com', type: 'PATRON' }));
    await mockApi(page, '/loan/query', {
      method: 'POST',
      body: {
        message: 'ok',
        records: [
          makeLoan({ id: 'loan-1', status: 'LOANED', dueDate: '2999-01-01T00:00:00.000Z' }),
          makeLoan({
            id: 'loan-2',
            status: 'AVAILABLE',
            returnedDate: '2026-01-15T00:00:00.000Z',
            itemDetails: makeBook({ id: 'book-2', title: 'The C Programming Language' }),
          }),
        ],
      },
    });

    await page.goto('/profile');

    await expect(page.getByText('jane@example.com · PATRON')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Pragmatic Programmer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The C Programming Language' })).toBeVisible();
    await expect(page.getByText('On loan')).toBeVisible();
    await expect(page.getByText('Returned', { exact: true })).toBeVisible();
  });

  test('flags an overdue loan', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'PATRON' }));
    await mockApi(page, '/loan/query', {
      method: 'POST',
      body: {
        message: 'ok',
        records: [makeLoan({ status: 'LOANED', dueDate: '2000-01-01T00:00:00.000Z' })],
      },
    });

    await page.goto('/profile');

    await expect(page.getByText('Overdue')).toBeVisible();
  });

  test('shows an empty state when the patron has never borrowed anything', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'PATRON' }));
    await mockApi(page, '/loan/query', { method: 'POST', body: { message: 'ok', records: [] } });

    await page.goto('/profile');

    await expect(page.getByText("You haven't borrowed any books yet.")).toBeVisible();
  });

  test('shows an error state with a working retry on load failure', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'PATRON' }));
    let callCount = 0;
    await page.route('http://localhost:8000/loan/query', async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          headers: CORS_RESPONSE_HEADERS,
          body: JSON.stringify({ message: 'Server error' }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS_RESPONSE_HEADERS,
        body: JSON.stringify({ message: 'ok', records: [] }),
      });
    });

    await page.goto('/profile');
    await expect(page.getByText('Server error')).toBeVisible();

    await page.getByRole('button', { name: 'Retry' }).click();

    await expect(page.getByText("You haven't borrowed any books yet.")).toBeVisible();
  });
});
