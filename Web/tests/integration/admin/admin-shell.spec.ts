import { render, screen } from '@testing-library/angular';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AdminShell } from '../../../src/app/features/admin/admin-shell/admin-shell';

@Component({ selector: 'app-stub-users', standalone: true, template: 'Users page stub' })
class StubUsers {}

@Component({ selector: 'app-stub-books', standalone: true, template: 'Books page stub' })
class StubBooks {}

function providers() {
  return [
    provideRouter([
      {
        path: 'admin',
        component: AdminShell,
        children: [
          { path: '', redirectTo: 'users', pathMatch: 'full' },
          { path: 'users', component: StubUsers },
          { path: 'books', component: StubBooks },
        ],
      },
    ]),
  ];
}

describe('AdminShell - layout', () => {
  it('shows the Admin heading and description', async () => {
    await render(AdminShell, { providers: providers() });

    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByText('Manage accounts, the catalog, and active loans.')).toBeInTheDocument();
  });

  it('renders all four tab links pointing at the right routes', async () => {
    await render(AdminShell, { providers: providers() });

    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: 'Books' })).toHaveAttribute('href', '/books');
    expect(screen.getByRole('link', { name: 'Loans' })).toHaveAttribute('href', '/loans');
    expect(screen.getByRole('link', { name: 'Library cards' })).toHaveAttribute('href', '/cards');
  });
});

describe('AdminShell - routed content', () => {
  it('renders the matched child route inside the router-outlet', async () => {
    const { fixture } = await render(AdminShell, { providers: providers() });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/users');
    fixture.detectChanges();

    expect(screen.getByText('Users page stub')).toBeInTheDocument();
  });

  it('marks the active tab with the routerLinkActive class after navigation', async () => {
    const { fixture } = await render(AdminShell, { providers: providers() });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/books');
    fixture.detectChanges();

    expect(screen.getByRole('link', { name: 'Books' })).toHaveClass('admin-tab-active');
    expect(screen.getByRole('link', { name: 'Users' })).not.toHaveClass('admin-tab-active');
  });
});
