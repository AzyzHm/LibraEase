import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AdminUsers } from '../../../src/app/features/admin/admin-users/admin-users';
import { AdminUsersStore, StatusFilter } from '../../../src/app/core/state/admin-users-store';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { AdminUser } from '../../../src/app/core/models/admin.model';

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    status: 'PENDING',
    ...overrides,
  };
}

function setup(opts: {
  users?: AdminUser[];
  filteredUsers?: AdminUser[];
  loading?: boolean;
  errorMessage?: string | null;
  statusFilter?: StatusFilter;
  pendingCount?: number;
  actionPendingId?: string | null;
  actionError?: string | null;
  isAdmin?: boolean;
}) {
  const storeStub = {
    loading: () => opts.loading ?? false,
    errorMessage: () => opts.errorMessage ?? null,
    statusFilter: () => opts.statusFilter ?? 'PENDING',
    filteredUsers: () => opts.filteredUsers ?? opts.users ?? [],
    pendingCount: () => opts.pendingCount ?? 0,
    actionPendingId: () => opts.actionPendingId ?? null,
    actionError: () => opts.actionError ?? null,
    load: jest.fn(),
    setStatusFilter: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    promote: jest.fn(),
    demote: jest.fn(),
    remove: jest.fn(),
  };

  const authStoreStub = { isAdmin: () => opts.isAdmin ?? true };

  return { storeStub, authStoreStub };
}

function providersFor(stubs: ReturnType<typeof setup>) {
  return [
    { provide: AdminUsersStore, useValue: stubs.storeStub },
    { provide: AuthStore, useValue: stubs.authStoreStub },
  ];
}

describe('AdminUsers - initial load', () => {
  it('loads users on init', async () => {
    const stubs = setup({});
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(stubs.storeStub.load).toHaveBeenCalledTimes(1);
  });
});

describe('AdminUsers - status filter pills', () => {
  it('calls setStatusFilter with the clicked pill\'s value', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(AdminUsers, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Approved' }));
    expect(stubs.storeStub.setStatusFilter).toHaveBeenCalledWith('APPROVED');

    await user.click(screen.getByRole('button', { name: 'Rejected' }));
    expect(stubs.storeStub.setStatusFilter).toHaveBeenCalledWith('REJECTED');

    await user.click(screen.getByRole('button', { name: /^All/ }));
    expect(stubs.storeStub.setStatusFilter).toHaveBeenCalledWith('ALL');
  });

  it('shows a pending-count badge on the Pending pill when there are pending users', async () => {
    const stubs = setup({ pendingCount: 3 });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('hides the pending-count badge when there are no pending users', async () => {
    const stubs = setup({ pendingCount: 0 });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});

describe('AdminUsers - loading/error/empty states', () => {
  it('shows LoadingState while loading', async () => {
    const stubs = setup({ loading: true });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.getByRole('status')).toHaveTextContent('Loading users…');
  });

  it('shows ErrorState and retries on click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ errorMessage: 'Users down' });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.getByRole('alert')).toHaveTextContent('Users down');

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(stubs.storeStub.load).toHaveBeenCalledTimes(2);
  });

  it('shows EmptyState when filteredUsers is empty', async () => {
    const stubs = setup({ filteredUsers: [] });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.getByText('No users in this view.')).toBeInTheDocument();
  });
});

describe('AdminUsers - results table', () => {
  it('renders a row per user with name, email, role, and status', async () => {
    const stubs = setup({ users: [makeUser()] });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('PATRON')).toBeInTheDocument();
    expect(screen.getByText('PENDING', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows "Working…" instead of actions while a user is pending an action', async () => {
    const stubs = setup({ users: [makeUser()], actionPendingId: 'user-1' });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.getByText('Working…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('shows the actionError banner when present', async () => {
    const stubs = setup({ actionError: 'Unable to approve this user right now.' });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.getByText('Unable to approve this user right now.')).toBeInTheDocument();
  });
});

describe('AdminUsers - non-admin viewer', () => {
  it('shows "View only" with no action buttons when the viewer is not an admin', async () => {
    const stubs = setup({ users: [makeUser()], isAdmin: false });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.getByText('View only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});

describe('AdminUsers - admin actions on a PENDING patron', () => {
  it('shows Approve/Reject, "Make employee", and Delete; wires each to the store', async () => {
    const user = userEvent.setup();
    const admin = makeUser({ status: 'PENDING', type: 'PATRON' });
    const stubs = setup({ users: [admin] });
    await render(AdminUsers, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(stubs.storeStub.approve).toHaveBeenCalledWith('user-1');

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(stubs.storeStub.reject).toHaveBeenCalledWith('user-1');

    await user.click(screen.getByRole('button', { name: 'Make employee' }));
    expect(stubs.storeStub.promote).toHaveBeenCalledWith('user-1');
  });
});

describe('AdminUsers - admin actions on an APPROVED employee', () => {
  it('shows "Make patron" (demote) instead of Approve/Reject/promote', async () => {
    const user = userEvent.setup();
    const employee = makeUser({ status: 'APPROVED', type: 'EMPLOYEE' });
    const stubs = setup({ users: [employee] });
    await render(AdminUsers, { providers: providersFor(stubs) });

    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Make employee' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Make patron' }));
    expect(stubs.storeStub.demote).toHaveBeenCalledWith('user-1');
  });
});

describe('AdminUsers - delete confirm flow', () => {
  it('asks for confirmation before deleting, and cancel backs out without calling remove', async () => {
    const user = userEvent.setup();
    const stubs = setup({ users: [makeUser()] });
    await render(AdminUsers, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete this user?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete this user?')).not.toBeInTheDocument();
    expect(stubs.storeStub.remove).not.toHaveBeenCalled();
  });

  it('calls remove with the user id on confirm', async () => {
    const user = userEvent.setup();
    const stubs = setup({ users: [makeUser()] });
    await render(AdminUsers, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(stubs.storeStub.remove).toHaveBeenCalledWith('user-1');
  });
});