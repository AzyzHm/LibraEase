import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AdminLoans } from '../../../src/app/features/admin/admin-loans/admin-loans';
import { AdminLoansStore, LoanStatusFilter } from '../../../src/app/core/state/admin-loans-store';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { LoanRecordModel } from '../../../src/app/core/models/loan.model';
import { AdminUser } from '../../../src/app/core/models/admin.model';
import { BookModel } from '../../../src/app/core/models/book.model';
import { AuthUser } from '../../../src/app/core/models/auth.model';

function makeLoan(overrides: Partial<LoanRecordModel> = {}): LoanRecordModel {
  return {
    id: 'loan-1',
    status: 'LOANED',
    loanedDate: '2024-01-01T00:00:00.000Z',
    dueDate: '2999-01-01T00:00:00.000Z',
    returnedDate: '',
    patron: 'patron-1',
    employeeOut: 'emp-1',
    item: 'book-1',
    ...overrides,
  };
}

function makePatron(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'patron-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    status: 'APPROVED',
    ...overrides,
  };
}

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

function makeAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'emp-1',
    type: 'EMPLOYEE',
    firstname: 'Em',
    lastname: 'Ployee',
    email: 'emp@example.com',
    ...overrides,
  };
}

function setup(opts: {
  loans?: LoanRecordModel[];
  filteredLoans?: LoanRecordModel[];
  loading?: boolean;
  errorMessage?: string | null;
  statusFilter?: LoanStatusFilter;
  users?: AdminUser[];
  books?: BookModel[];
  refDataError?: string | null;
  checkingOut?: boolean;
  checkoutError?: string | null;
  actionPendingId?: string | null;
  actionError?: string | null;
  loanedBookIds?: Set<string>;
  currentUser?: AuthUser | null;
}) {
  const users = opts.users ?? [makePatron()];
  const books = opts.books ?? [makeBook()];
  const userById = new Map(users.map((u) => [u.id, u]));
  const bookById = new Map(books.map((b) => [b.id, b]));

  const storeStub = {
    loading: () => opts.loading ?? false,
    errorMessage: () => opts.errorMessage ?? null,
    statusFilter: () => opts.statusFilter ?? 'LOANED',
    filteredLoans: () => opts.filteredLoans ?? opts.loans ?? [],
    users: () => users,
    books: () => books,
    userById: () => userById,
    bookById: () => bookById,
    refDataError: () => opts.refDataError ?? null,
    loanedBookIds: () => opts.loanedBookIds ?? new Set<string>(),
    checkingOut: () => opts.checkingOut ?? false,
    checkoutError: () => opts.checkoutError ?? null,
    actionPendingId: () => opts.actionPendingId ?? null,
    actionError: () => opts.actionError ?? null,
    load: jest.fn(),
    loadReferenceData: jest.fn(),
    setStatusFilter: jest.fn(),
    checkout: jest.fn(),
    markReturned: jest.fn(),
  };

  const authStoreStub = { user: () => (opts.currentUser === undefined ? makeAuthUser() : opts.currentUser) };

  return { storeStub, authStoreStub };
}

function providersFor(stubs: ReturnType<typeof setup>) {
  return [
    { provide: AdminLoansStore, useValue: stubs.storeStub },
    { provide: AuthStore, useValue: stubs.authStoreStub },
  ];
}

describe('AdminLoans - initial load', () => {
  it('loads loan records and reference data on init', async () => {
    const stubs = setup({});
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(stubs.storeStub.load).toHaveBeenCalledTimes(1);
    expect(stubs.storeStub.loadReferenceData).toHaveBeenCalledTimes(1);
  });
});

describe('AdminLoans - status filter pills', () => {
  it('calls setStatusFilter with the clicked pill\'s value', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Returned' }));
    expect(stubs.storeStub.setStatusFilter).toHaveBeenCalledWith('AVAILABLE');

    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(stubs.storeStub.setStatusFilter).toHaveBeenCalledWith('ALL');
  });
});

describe('AdminLoans - loading/error/empty states', () => {
  it('shows LoadingState while loading', async () => {
    const stubs = setup({ loading: true });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.getByRole('status')).toHaveTextContent('Loading loan records…');
  });

  it('shows ErrorState and retries on click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ errorMessage: 'Loans down' });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Loans down');

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(stubs.storeStub.load).toHaveBeenCalledTimes(2);
  });

  it('shows EmptyState when filteredLoans is empty', async () => {
    const stubs = setup({ filteredLoans: [] });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.getByText('No loan records in this view.')).toBeInTheDocument();
  });

  it('shows the refDataError banner when reference data failed to load', async () => {
    const stubs = setup({ refDataError: 'Unable to load patrons and books right now.' });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.getByText('Unable to load patrons and books right now.')).toBeInTheDocument();
  });
});

describe('AdminLoans - results table', () => {
  it('resolves book title and patron name via the reference maps', async () => {
    const stubs = setup({
      loans: [makeLoan()],
      users: [makePatron({ id: 'patron-1', firstname: 'Jane', lastname: 'Doe' })],
      books: [makeBook({ id: 'book-1', title: 'The Pragmatic Programmer' })],
    });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('falls back to "Unknown book" / "Unknown patron" when the ids do not resolve', async () => {
    const stubs = setup({
      loans: [makeLoan({ item: 'missing-book', patron: 'missing-patron' })],
      users: [],
      books: [],
    });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.getByText('Unknown book')).toBeInTheDocument();
    expect(screen.getByText('Unknown patron')).toBeInTheDocument();
  });

  it('flags an overdue loan with "· Overdue" text', async () => {
    const stubs = setup({
      loans: [makeLoan({ status: 'LOANED', dueDate: '2000-01-01T00:00:00.000Z' })],
    });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
  });

  it('does not show "Mark returned" for an already-returned loan', async () => {
    const stubs = setup({ loans: [makeLoan({ status: 'AVAILABLE' })] });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.queryByRole('button', { name: 'Mark returned' })).not.toBeInTheDocument();
    expect(screen.getByText('Returned', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows "Working…" instead of the action while a loan is pending', async () => {
    const stubs = setup({ loans: [makeLoan()], actionPendingId: 'loan-1' });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.getByText('Working…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark returned' })).not.toBeInTheDocument();
  });
});

describe('AdminLoans - mark returned', () => {
  it('calls markReturned with the loan and the current employee id', async () => {
    const user = userEvent.setup();
    const loan = makeLoan();
    const stubs = setup({ loans: [loan], currentUser: makeAuthUser({ id: 'emp-42' }) });
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Mark returned' }));

    expect(stubs.storeStub.markReturned).toHaveBeenCalledWith(loan, 'emp-42');
  });

  it('does nothing if there is no current user', async () => {
    const user = userEvent.setup();
    const loan = makeLoan();
    const stubs = setup({ loans: [loan], currentUser: null });
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Mark returned' }));

    expect(stubs.storeStub.markReturned).not.toHaveBeenCalled();
  });

  it('shows the actionError banner when present', async () => {
    const stubs = setup({ actionError: 'Unable to mark this loan returned right now.' });
    await render(AdminLoans, { providers: providersFor(stubs) });

    expect(screen.getByText('Unable to mark this loan returned right now.')).toBeInTheDocument();
  });
});

describe('AdminLoans - checkout form', () => {
  it('opens the checkout form on "+ New checkout" with patrons and books listed', async () => {
    const user = userEvent.setup();
    const stubs = setup({
      users: [makePatron(), makePatron({ id: 'patron-2', firstname: 'Bob', lastname: 'Smith' })],
      books: [makeBook()],
    });
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New checkout' }));

    expect(screen.getByRole('heading', { name: 'New checkout' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Jane Doe/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Bob Smith/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'The Pragmatic Programmer' })).toBeInTheDocument();
  });

  it('excludes non-PATRON users from the patron picker', async () => {
    const user = userEvent.setup();
    const stubs = setup({
      users: [makePatron(), makePatron({ id: 'emp-9', type: 'EMPLOYEE', firstname: 'Staff', lastname: 'Member' })],
    });
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New checkout' }));

    expect(screen.queryByRole('option', { name: /Staff Member/ })).not.toBeInTheDocument();
  });

  it('flags a currently-loaned book in the picker', async () => {
    const user = userEvent.setup();
    const stubs = setup({
      books: [makeBook({ id: 'book-1', title: 'The Pragmatic Programmer' })],
      loanedBookIds: new Set(['book-1']),
    });
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New checkout' }));

    expect(
      screen.getByRole('option', { name: 'The Pragmatic Programmer (currently loaned)' }),
    ).toBeInTheDocument();
  });

  it('shows validation errors and does not call checkout when submitted empty', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New checkout' }));
    await user.click(screen.getByRole('button', { name: 'Check out' }));

    expect(screen.getByText('Select a patron.')).toBeInTheDocument();
    expect(screen.getByText('Select a book.')).toBeInTheDocument();
    expect(screen.getByText('Required.')).toBeInTheDocument();
    expect(stubs.storeStub.checkout).not.toHaveBeenCalled();
  });

  it('submits a valid checkout payload with the current employee as employeeOut', async () => {
    const user = userEvent.setup();
    const stubs = setup({ currentUser: makeAuthUser({ id: 'emp-7' }) });
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New checkout' }));
    await user.selectOptions(screen.getByLabelText('Patron'), 'patron-1');
    await user.selectOptions(screen.getByLabelText('Book'), 'book-1');
    await user.type(screen.getByLabelText('Due date'), '2030-01-01');
    await user.click(screen.getByRole('button', { name: 'Check out' }));

    expect(stubs.storeStub.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'LOANED',
        patron: 'patron-1',
        item: 'book-1',
        employeeOut: 'emp-7',
      }),
      expect.any(Function),
    );
  });

  it('does nothing on submit if there is no current user', async () => {
    const user = userEvent.setup();
    const stubs = setup({ currentUser: null });
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New checkout' }));
    await user.selectOptions(screen.getByLabelText('Patron'), 'patron-1');
    await user.selectOptions(screen.getByLabelText('Book'), 'book-1');
    await user.type(screen.getByLabelText('Due date'), '2030-01-01');
    await user.click(screen.getByRole('button', { name: 'Check out' }));

    expect(stubs.storeStub.checkout).not.toHaveBeenCalled();
  });

  it('shows the checkoutError banner inside the form', async () => {
    const user = userEvent.setup();
    const stubs = setup({ checkoutError: 'This book is already on loan.' });
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New checkout' }));

    expect(screen.getByText('This book is already on loan.')).toBeInTheDocument();
  });

  it('closes the form on Cancel', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(AdminLoans, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New checkout' }));
    expect(screen.getByRole('heading', { name: 'New checkout' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'New checkout' })).not.toBeInTheDocument();
  });
});