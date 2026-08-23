import { test, expect } from '@playwright/test';
import { mockApi } from '../helpers/mock-api';
import { loginAs, makeAuthUser } from '../helpers/auth';
import { makeBook, makePagination } from '../helpers/fixtures';

test.describe('Admin - books', () => {
  test('creates a new book end-to-end', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([]) },
    });
    await mockApi(page, '/book', {
      method: 'POST',
      body: { message: 'Created', savedBook: makeBook({ title: 'New Title' }) },
    });

    await page.goto('/admin/books');
    await page.getByRole('button', { name: '+ New book' }).click();

    await page.getByLabel(/Barcode/).fill('0306406152');
    await page.locator('#title').fill('New Title');
    await page.getByLabel(/Authors/).fill('Author One, Author Two');
    await page.getByLabel(/Subjects/).fill('Fiction, Classics');
    await page.getByLabel('Description').fill('A great book.');
    await page.getByLabel('Publisher').fill('Some Press');
    await page.locator('#genre').fill('Fiction');
    await page.getByLabel('Publication date').fill('2021-05-10');
    const pages = page.getByLabel('Pages');
    await pages.fill('200');

    await page.getByRole('button', { name: 'Create book' }).click();

    await expect(page.getByRole('heading', { name: 'New book' })).toHaveCount(0);
  });

  test('rejects an invalid barcode without calling the API', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([]) },
    });

    let createCalled = false;
    await page.route('http://localhost:8000/book', async (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true;
      }
      await route.fallback();
    });

    await page.goto('/admin/books');
    await page.getByRole('button', { name: '+ New book' }).click();
    await page.getByLabel(/Barcode/).fill('12345');
    await page.getByRole('button', { name: 'Create book' }).click();

    await expect(page.getByText('Enter a valid 10 or 13-digit barcode.')).toBeVisible();
    expect(createCalled).toBe(false);
  });

  test('edits an existing book with the barcode field locked', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    const book = makeBook();
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([book]) },
    });
    await mockApi(page, '/book', {
      method: 'PUT',
      body: { message: 'Updated', updatedBook: { ...book, title: 'Updated Title' } },
    });

    await page.goto('/admin/books');
    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByLabel(/Barcode/)).toBeDisabled();
    await page.locator('#title').fill('Updated Title');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('heading', { name: 'Edit book' })).toHaveCount(0);
  });

  test('deletes a book after confirming', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    const book = makeBook();
    await mockApi(page, '/book/query**', {
      method: 'GET',
      body: { message: 'ok', page: makePagination([book]) },
    });
    await mockApi(page, `/book/${book.barcode}`, {
      method: 'DELETE',
      body: { message: 'Deleted' },
    });

    await page.goto('/admin/books');
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Delete this book?')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByText(book.title)).toHaveCount(0);
  });

  test('filters the book list by title', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    let lastTitle = '';
    await page.route('http://localhost:8000/book/query**', async (route) => {
      lastTitle = new URL(route.request().url()).searchParams.get('title') ?? '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'ok',
          page: makePagination(lastTitle ? [makeBook({ title: 'Matched Book' })] : []),
        }),
      });
    });

    await page.goto('/admin/books');
    await page.locator('#filter-title').fill('Pragmatic');
    await page.getByRole('button', { name: 'Search' }).click();

    expect(lastTitle).toBe('Pragmatic');
    await expect(page.getByText('Matched Book')).toBeVisible();
  });
});