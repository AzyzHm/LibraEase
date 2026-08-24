import { test, expect } from '@playwright/test';
import { mockApi } from '../helpers/mock-api';
import { loginAs, makeAuthUser } from '../helpers/auth';
import { makeAdminUser } from '../helpers/fixtures';

test.describe('Admin - users', () => {
  test('approves a pending user', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    const pending = makeAdminUser({ id: 'user-2', status: 'PENDING' });
    await mockApi(page, '/users', { method: 'GET', body: { message: 'ok', users: [pending] } });
    await mockApi(page, '/users/user-2/approve', {
      method: 'PUT',
      body: { message: 'ok', user: { ...pending, status: 'APPROVED' } },
    });

    await page.goto('/admin/users');
    await expect(page.getByText('Jane Doe')).toBeVisible();

    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
  });

  test('rejects a pending user', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    const pending = makeAdminUser({ id: 'user-2', status: 'PENDING' });
    await mockApi(page, '/users', { method: 'GET', body: { message: 'ok', users: [pending] } });
    await mockApi(page, '/users/user-2/reject', {
      method: 'PUT',
      body: { message: 'ok', user: { ...pending, status: 'REJECTED' } },
    });

    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Reject' }).click();

    await expect(page.getByRole('button', { name: 'Reject' })).toHaveCount(0);
  });

  test('promotes a patron to employee', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    const patron = makeAdminUser({ id: 'user-2', status: 'PENDING', type: 'PATRON' });
    await mockApi(page, '/users', { method: 'GET', body: { message: 'ok', users: [patron] } });
    await mockApi(page, '/users/user-2/promote', {
      method: 'PUT',
      body: { message: 'ok', user: { ...patron, type: 'EMPLOYEE' } },
    });

    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Make employee' }).click();

    await expect(page.getByRole('button', { name: 'Make employee' })).toHaveCount(0);
  });

  test('demotes an employee back to patron', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    const employee = makeAdminUser({ id: 'user-2', status: 'APPROVED', type: 'EMPLOYEE' });
    await mockApi(page, '/users', { method: 'GET', body: { message: 'ok', users: [employee] } });
    await mockApi(page, '/users/user-2/demote', {
      method: 'PUT',
      body: { message: 'ok', user: { ...employee, type: 'PATRON' } },
    });

    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Make patron' }).click();

    await expect(page.getByRole('button', { name: 'Make patron' })).toHaveCount(0);
  });

  test('deletes a user after confirming', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    const user = makeAdminUser({ id: 'user-2' });
    await mockApi(page, '/users', { method: 'GET', body: { message: 'ok', users: [user] } });
    await mockApi(page, '/users/user-2', { method: 'DELETE', body: { message: 'Deleted' } });

    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Delete this user?')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByText('Jane Doe')).toHaveCount(0);
  });

  test('filters by status using the tab pills', async ({ page }) => {
    await loginAs(page, makeAuthUser({ type: 'ADMIN' }));
    await mockApi(page, '/users', {
      method: 'GET',
      body: {
        message: 'ok',
        users: [
          makeAdminUser({ id: 'user-2', status: 'PENDING', firstname: 'Pending', lastname: 'One' }),
          makeAdminUser({
            id: 'user-3',
            status: 'APPROVED',
            firstname: 'Approved',
            lastname: 'Two',
          }),
        ],
      },
    });

    await page.goto('/admin/users');
    await expect(page.getByText('Pending One')).toBeVisible();
    await expect(page.getByText('Approved Two')).toHaveCount(0);

    await page.getByRole('button', { name: 'Approved' }).click();

    await expect(page.getByText('Approved Two')).toBeVisible();
    await expect(page.getByText('Pending One')).toHaveCount(0);
  });
});
