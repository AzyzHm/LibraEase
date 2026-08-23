import { test, expect } from '@playwright/test';
import { mockApi } from '../helpers/mock-api';
import { makeBook, makePagination } from '../helpers/fixtures';

test.describe('Home', () => {
  test('shows featured books once loaded', async ({ page }) => {
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: {
        message: 'ok',
        page: makePagination([
          makeBook(),
          makeBook({ id: 'book-2', title: 'The C Programming Language' }),
        ]),
      },
    });

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'The Pragmatic Programmer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The C Programming Language' })).toBeVisible();
  });

  test('shows an empty state when the catalog has no books yet', async ({ page }) => {
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([]) },
    });

    await page.goto('/');

    await expect(page.getByText('No books in the catalog yet.')).toBeVisible();
  });

  test('navigates to /catalog with the typed title as a query param', async ({ page }) => {
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([makeBook()]) },
    });

    await page.goto('/');
    await page.getByLabel('Search by title').fill('Pragmatic');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page).toHaveURL('/catalog?title=Pragmatic');
  });
});
