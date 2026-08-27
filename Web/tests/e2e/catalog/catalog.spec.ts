import { test, expect } from '@playwright/test';
import { mockApi, CORS_RESPONSE_HEADERS } from '../helpers/mock-api';
import { loginAs, makeAuthUser } from '../helpers/auth';
import { makeBook, makePagination } from '../helpers/fixtures';

test.describe('Catalog - guest browsing', () => {
  test('lists books and shows no checkout buttons for a signed-out visitor', async ({ page }) => {
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([makeBook()]) },
    });

    await page.goto('/catalog');

    await expect(page.getByRole('heading', { name: 'The Pragmatic Programmer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Borrow this book' })).toHaveCount(0);
  });

  test('filters results by title and re-queries the server', async ({ page }) => {
    let lastQuery = '';
    await page.route('http://localhost:8000/book/query**', async (route) => {
      lastQuery = new URL(route.request().url()).searchParams.get('title') ?? '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS_RESPONSE_HEADERS,
        body: JSON.stringify({
          message: 'ok',
          page: makePagination(lastQuery ? [makeBook({ title: 'Filtered Result' })] : [makeBook()]),
        }),
      });
    });

    await page.goto('/catalog');
    await page.getByLabel('Title').fill('Pragmatic');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByRole('heading', { name: 'Filtered Result' })).toBeVisible();
    expect(lastQuery).toBe('Pragmatic');
  });

  test('shows an empty state with a working "Clear filters" action when a filter matches nothing', async ({
    page,
  }) => {
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([]) },
    });

    await page.goto('/catalog?title=nonexistent');

    await expect(page.getByText('No books match your search.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  });

  test('paginates using Previous/Next', async ({ page }) => {
    await page.route('http://localhost:8000/book/query**', async (route) => {
      const url = new URL(route.request().url());
      const requestedPage = Number(url.searchParams.get('page') ?? '1');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS_RESPONSE_HEADERS,
        body: JSON.stringify({
          message: 'ok',
          page: makePagination([makeBook({ title: `Page ${requestedPage} Book` })], {
            currentPage: requestedPage,
            totalPages: 3,
            totalCount: 30,
          }),
        }),
      });
    });

    await page.goto('/catalog');
    await expect(page.getByRole('heading', { name: 'Page 1 Book' })).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Page 2 Book' })).toBeVisible();

    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByRole('heading', { name: 'Page 1 Book' })).toBeVisible();
  });

  test('opens the book detail modal on click', async ({ page }) => {
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: {
        message: 'ok',
        page: makePagination([makeBook({ description: 'A classic on software craftsmanship.' })]),
      },
    });

    await page.goto('/catalog');
    await page.getByRole('heading', { name: 'The Pragmatic Programmer' }).click();

    await expect(page.getByText('A classic on software craftsmanship.')).toBeVisible();
  });
});

test.describe('Catalog - self-checkout as a signed-in patron', () => {
  test('borrows an available book end-to-end', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'PATRON' }));
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([makeBook()]) },
    });
    await mockApi(page, '/loan/availability/book-1', {
      method: 'GET',
      body: { message: 'ok', available: true },
    });
    await mockApi(page, '/loan/self', {
      method: 'POST',
      body: {
        message: 'Checked out',
        record: {
          id: 'loan-new',
          status: 'LOANED',
          loanedDate: new Date().toISOString(),
          dueDate: '2030-01-01T00:00:00.000Z',
          returnedDate: '',
          patron: 'user-1',
          employeeOut: '',
          item: 'book-1',
        },
      },
    });

    await page.goto('/catalog');
    await page.getByRole('button', { name: 'Borrow this book', exact: true }).click();
    await page.getByLabel('Due date').fill('2030-01-01');
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByText(/Checked out/)).toBeVisible();
  });

  test('shows a disabled "Currently loaned" button when the book is unavailable', async ({
    page,
  }) => {
    await loginAs(page, makeAuthUser({ type: 'PATRON' }));
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([makeBook()]) },
    });
    await mockApi(page, '/loan/availability/book-1', {
      method: 'GET',
      body: { message: 'ok', available: false },
    });

    await page.goto('/catalog');

    await expect(
      page.getByRole('button', { name: 'Currently loaned', exact: true }),
    ).toBeDisabled();
  });
});
