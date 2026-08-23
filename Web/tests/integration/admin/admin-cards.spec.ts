import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AdminCards } from '../../../src/app/features/admin/admin-cards/admin-cards';
import { AdminCardsStore } from '../../../src/app/core/state/admin-cards-store';
import { AdminUser } from '../../../src/app/core/models/admin.model';
import { LibraryCardWithUser } from '../../../src/app/core/models/library-card.model';

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane.doe@example.com',
    status: 'APPROVED',
    ...overrides,
  };
}

function makeCard(overrides: Partial<LibraryCardWithUser> = {}): LibraryCardWithUser {
  return {
    id: 'card-1',
    user: 'user-1',
    userDetails: makeUser(),
    ...overrides,
  };
}

function setup(opts: {
  cards?: LibraryCardWithUser[];
  cardsLoading?: boolean;
  cardsError?: string | null;
  users?: AdminUser[];
  usersLoading?: boolean;
  usersError?: string | null;
  issuePendingUserId?: string | null;
  issueError?: string | null;
}) {
  const storeStub = {
    cards: () => opts.cards ?? [],
    cardsLoading: () => opts.cardsLoading ?? false,
    cardsError: () => opts.cardsError ?? null,
    users: () => opts.users ?? [],
    usersLoading: () => opts.usersLoading ?? false,
    usersError: () => opts.usersError ?? null,
    issuePendingUserId: () => opts.issuePendingUserId ?? null,
    issueError: () => opts.issueError ?? null,
    userIdsWithCard: () => new Set((opts.cards ?? []).map((c) => c.user)),
    loadCards: jest.fn(),
    loadUsers: jest.fn(),
    issue: jest.fn(),
  };

  return { storeStub };
}

function providersFor(stubs: ReturnType<typeof setup>) {
  return [{ provide: AdminCardsStore, useValue: stubs.storeStub }];
}

describe('AdminCards - initial load', () => {
  it('loads cards and users on init', async () => {
    const stubs = setup({});
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(stubs.storeStub.loadCards).toHaveBeenCalledTimes(1);
    expect(stubs.storeStub.loadUsers).toHaveBeenCalledTimes(1);
  });
});

describe('AdminCards - users panel states', () => {
  it('shows LoadingState while users are loading', async () => {
    const stubs = setup({ usersLoading: true });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByText('Loading users…')).toBeInTheDocument();
  });

  it('shows ErrorState and retries loadUsers on click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ usersError: 'Users down' });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByRole('alert')).toHaveTextContent('Users down');

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(stubs.storeStub.loadUsers).toHaveBeenCalledTimes(2);
  });

  it('shows EmptyState when there are no users', async () => {
    const stubs = setup({ users: [] });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByText('No users match this search.')).toBeInTheDocument();
  });
});

describe('AdminCards - user search', () => {
  it('filters the user list by name/email as the search term changes', async () => {
    const user = userEvent.setup();
    const stubs = setup({
      users: [
        makeUser({ id: 'user-1', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com' }),
        makeUser({ id: 'user-2', firstname: 'Bob', lastname: 'Smith', email: 'bob@example.com' }),
      ],
    });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search by name or email…'), 'jane');

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
  });

  it('matches on email too', async () => {
    const user = userEvent.setup();
    const stubs = setup({
      users: [
        makeUser({ id: 'user-1', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com' }),
        makeUser({ id: 'user-2', firstname: 'Bob', lastname: 'Smith', email: 'bob@example.com' }),
      ],
    });
    await render(AdminCards, { providers: providersFor(stubs) });

    await user.type(screen.getByPlaceholderText('Search by name or email…'), 'bob@example');

    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('shows EmptyState when the search term matches nobody', async () => {
    const user = userEvent.setup();
    const stubs = setup({ users: [makeUser()] });
    await render(AdminCards, { providers: providersFor(stubs) });

    await user.type(screen.getByPlaceholderText('Search by name or email…'), 'nobody-matches-this');

    expect(screen.getByText('No users match this search.')).toBeInTheDocument();
  });
});

describe('AdminCards - issue flow', () => {
  it('shows "Issue card" for a user without a card and calls issue(userId) on click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ users: [makeUser()], cards: [] });
    await render(AdminCards, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Issue card' }));

    expect(stubs.storeStub.issue).toHaveBeenCalledWith('user-1');
  });

  it('shows "Has a card" (no button) for a user who already has one', async () => {
    const stubs = setup({ users: [makeUser()], cards: [makeCard()] });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByText('Has a card')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Issue card' })).not.toBeInTheDocument();
  });

  it('shows "Issuing…" and no button while that user\'s issue call is pending', async () => {
    const stubs = setup({ users: [makeUser()], issuePendingUserId: 'user-1' });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByText('Issuing…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Issue card' })).not.toBeInTheDocument();
  });

  it('shows the issueError message when present', async () => {
    const stubs = setup({ issueError: 'This user is not eligible for a card.' });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByText('This user is not eligible for a card.')).toBeInTheDocument();
  });
});

describe('AdminCards - cards table', () => {
  it('shows LoadingState while cards are loading', async () => {
    const stubs = setup({ cardsLoading: true });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByRole('status')).toHaveTextContent('Loading cards…');
  });

  it('shows ErrorState and retries loadCards on click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ cardsError: 'Cards down' });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Cards down');

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(stubs.storeStub.loadCards).toHaveBeenCalledTimes(2);
  });

  it('shows EmptyState when there are no cards issued yet', async () => {
    const stubs = setup({ cards: [] });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByText('No cards issued yet.')).toBeInTheDocument();
  });

  it('renders a row per issued card with user details', async () => {
    const stubs = setup({
      cards: [
        makeCard(),
        makeCard({ id: 'card-2', user: 'user-2', userDetails: makeUser({ id: 'user-2', firstname: 'Bob', lastname: 'Smith', email: 'bob@example.com' }) }),
      ],
    });
    await render(AdminCards, { providers: providersFor(stubs) });

    expect(screen.getByText('card-1')).toBeInTheDocument();
    expect(screen.getByText('card-2')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });
});