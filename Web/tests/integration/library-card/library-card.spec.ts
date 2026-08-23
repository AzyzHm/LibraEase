import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { LibraryCardPage } from '../../../src/app/features/library-card/library-card';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { MyLibraryCardStore } from '../../../src/app/core/state/my-library-card-store';
import { LibraryCardWithUser } from '../../../src/app/core/models/library-card.model';

const card: LibraryCardWithUser = {
  id: 'card-1',
  user: 'user-1',
  userDetails: {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    status: 'APPROVED',
  },
};

function setup(opts: { loading?: boolean; errorMessage?: string | null; notIssued?: boolean; card?: LibraryCardWithUser | null }) {
  const authStoreStub = {};
  const storeStub = {
    loading: () => opts.loading ?? false,
    errorMessage: () => opts.errorMessage ?? null,
    notIssued: () => opts.notIssued ?? false,
    card: () => opts.card ?? null,
    load: jest.fn(),
  };

  return { authStoreStub, storeStub };
}

function providersFor(stubs: ReturnType<typeof setup>) {
  return [
    { provide: AuthStore, useValue: stubs.authStoreStub },
    { provide: MyLibraryCardStore, useValue: stubs.storeStub },
  ];
}

describe('LibraryCardPage - states', () => {
  it('loads the card on init', async () => {
    const stubs = setup({});
    await render(LibraryCardPage, { providers: providersFor(stubs) });

    expect(stubs.storeStub.load).toHaveBeenCalledTimes(1);
  });

  it('shows LoadingState while loading', async () => {
    const stubs = setup({ loading: true });
    await render(LibraryCardPage, { providers: providersFor(stubs) });

    expect(screen.getByRole('status')).toHaveTextContent('Loading your card…');
  });

  it('shows ErrorState and retries on click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ errorMessage: 'DB down' });
    await render(LibraryCardPage, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(stubs.storeStub.load).toHaveBeenCalledTimes(2); // once on init, once on retry
  });

  it('shows EmptyState with guidance when the patron has no card yet', async () => {
    const stubs = setup({ notIssued: true });
    await render(LibraryCardPage, { providers: providersFor(stubs) });

    expect(
      screen.getByText("You don't have a library card yet. Ask a librarian at the front desk to issue you one.")
    ).toBeInTheDocument();
  });
});

describe('LibraryCardPage - card display', () => {
  it('shows the cardholder name, email, account type, and card id', async () => {
    const stubs = setup({ card });
    await render(LibraryCardPage, { providers: providersFor(stubs) });

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('PATRON')).toBeInTheDocument();
    expect(screen.getByText('card-1')).toBeInTheDocument();
  });

  it('calls window.print() when "Print / Save as PDF" is clicked', async () => {
    const user = userEvent.setup();
    const printSpy = jest.fn();
    window.print = printSpy;
    const stubs = setup({ card });
    await render(LibraryCardPage, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Print / Save as PDF' }));

    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});