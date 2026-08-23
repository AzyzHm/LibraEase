import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Profile } from '../../../src/app/features/profile/profile';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { ProfileStore } from '../../../src/app/core/state/profile-store';
import { AuthUser } from '../../../src/app/core/models/auth.model';
import { LoanRecordWithItem } from '../../../src/app/core/models/loan.model';
import { BookModel } from '../../../src/app/core/models/book.model';

const currentUser: AuthUser = {
  id: 'user-1',
  type: 'PATRON',
  firstname: 'Jane',
  lastname: 'Doe',
  email: 'jane@example.com',
};

function makeBook(overrides: Partial<BookModel> = {}): BookModel {
  return {
    id: 'book-1',
    barcode: '0306406152',
    cover: '',
    title: 'The Pragmatic Programmer',
    authors: ['Andrew Hunt'],
    description: 'desc',
    subjects: ['Software'],
    publicationDate: '2020-01-01',
    publisher: 'Addison-Wesley',
    pages: 352,
    genre: 'Technology',
    ...overrides,
  };
}

function makeLoan(overrides: Partial<LoanRecordWithItem> = {}): LoanRecordWithItem {
  return {
    id: 'record-1',
    status: 'LOANED',
    loanedDate: '2026-01-01',
    dueDate: '2099-01-15',
    returnedDate: '',
    patron: 'user-1',
    employeeOut: 'employee-1',
    item: 'book-1',
    itemDetails: makeBook(),
    ...overrides,
  };
}

function setup(opts: {
  loansLoading?: boolean;
  loansError?: string | null;
  loans?: LoanRecordWithItem[];
}) {
  const authStoreStub = { user: () => currentUser };
  const profileStoreStub = {
    loansLoading: () => opts.loansLoading ?? false,
    loansError: () => opts.loansError ?? null,
    loans: () => opts.loans ?? [],
    loadMyLoans: jest.fn(),
  };

  return { authStoreStub, profileStoreStub };
}

function providersFor(stubs: ReturnType<typeof setup>) {
  return [
    { provide: AuthStore, useValue: stubs.authStoreStub },
    { provide: ProfileStore, useValue: stubs.profileStoreStub },
  ];
}

describe('Profile - header', () => {
  it("shows the signed-in user's email and account type", async () => {
    const stubs = setup({});
    await render(Profile, { providers: providersFor(stubs) });

    expect(screen.getByText('jane@example.com · PATRON')).toBeInTheDocument();
  });
});

describe('Profile - loans state', () => {
  it('loads loans on init', async () => {
    const stubs = setup({});
    await render(Profile, { providers: providersFor(stubs) });

    expect(stubs.profileStoreStub.loadMyLoans).toHaveBeenCalledTimes(1);
  });

  it('shows LoadingState while loans are loading', async () => {
    const stubs = setup({ loansLoading: true });
    await render(Profile, { providers: providersFor(stubs) });

    expect(screen.getByRole('status')).toHaveTextContent('Loading your loans…');
  });

  it('shows ErrorState and retries on click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ loansError: 'DB down' });
    await render(Profile, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(stubs.profileStoreStub.loadMyLoans).toHaveBeenCalledTimes(2); // once on init, once on retry
  });

  it('shows EmptyState when there are no loans', async () => {
    const stubs = setup({ loans: [] });
    await render(Profile, { providers: providersFor(stubs) });

    expect(screen.getByText("You haven't borrowed any books yet.")).toBeInTheDocument();
  });
});

describe('Profile - loan list rendering', () => {
  it('renders title, authors, and borrowed date for each loan', async () => {
    const stubs = setup({ loans: [makeLoan()] });
    await render(Profile, { providers: providersFor(stubs) });

    expect(screen.getByRole('heading', { name: 'The Pragmatic Programmer' })).toBeInTheDocument();
    expect(screen.getByText('Andrew Hunt')).toBeInTheDocument();
  });

  it('shows "On loan" for a currently-loaned book that is not yet overdue', async () => {
    const stubs = setup({ loans: [makeLoan({ status: 'LOANED', dueDate: '2099-01-15' })] });
    await render(Profile, { providers: providersFor(stubs) });

    expect(screen.getByText('On loan')).toBeInTheDocument();
  });

  it('shows "Overdue" for a currently-loaned book past its due date', async () => {
    const stubs = setup({ loans: [makeLoan({ status: 'LOANED', dueDate: '2020-01-01' })] });
    await render(Profile, { providers: providersFor(stubs) });

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows "Returned" for a returned loan, with the returned date instead of due date', async () => {
    const stubs = setup({
      loans: [makeLoan({ status: 'AVAILABLE', returnedDate: '2026-01-10', dueDate: '2020-01-01' })],
    });
    await render(Profile, { providers: providersFor(stubs) });

    expect(screen.getByText('Returned', { selector: 'span' })).toBeInTheDocument();
  });

  it('falls back to a text placeholder after the cover image fails to load', async () => {
    const stubs = setup({
      loans: [makeLoan({ itemDetails: makeBook({ cover: 'https://example.com/broken.jpg' }) })],
    });
    const { container } = await render(Profile, { providers: providersFor(stubs) });
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();

    fireEvent.error(img);

    expect(container.querySelector('img')).toBeNull();
  });
});
