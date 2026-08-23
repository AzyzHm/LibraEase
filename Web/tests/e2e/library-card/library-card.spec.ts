import { test, expect } from '@playwright/test';
import { mockApi } from '../helpers/mock-api';
import { loginAs, makeAuthUser } from '../helpers/auth';
import { makeCard } from '../helpers/fixtures';

test.describe('Library card - issued', () => {
  test('shows the cardholder name, email, and card id', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'PATRON' }));
    await mockApi(page, '/card/me', {
      method: 'GET',
      body: {
        message: 'ok',
        card: makeCard({
          id: 'card-42',
          userDetails: {
            id: 'user-1',
            type: 'PATRON',
            firstname: 'Jane',
            lastname: 'Doe',
            email: 'jane@example.com',
            status: 'APPROVED',
          },
        }),
      },
    });

    await page.goto('/my-card');

    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByText('jane@example.com')).toBeVisible();
    await expect(page.getByText('card-42')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print / Save as PDF' })).toBeVisible();
  });
});

test.describe('Library card - not issued', () => {
  test('shows a helpful empty state on a 404', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'PATRON' }));
    await mockApi(page, '/card/me', {
      method: 'GET',
      status: 404,
      body: { message: 'No card found' },
    });

    await page.goto('/my-card');

    await expect(
      page.getByText("You don't have a library card yet. Ask a librarian at the front desk to issue you one."),
    ).toBeVisible();
  });
});

test.describe('Library card - errors', () => {
  test('shows an error state with a working retry on a non-404 failure', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'PATRON' }));
    let callCount = 0;
    await page.route('http://localhost:8000/card/me', async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Server error' }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok', card: makeCard() }),
      });
    });

    await page.goto('/my-card');
    await expect(page.getByText('Server error')).toBeVisible();

    await page.getByRole('button', { name: 'Retry' }).click();

    await expect(page.getByText('card-1')).toBeVisible();
  });
});