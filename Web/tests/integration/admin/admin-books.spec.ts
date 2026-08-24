import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AdminBooks } from '../../../src/app/features/admin/admin-books/admin-books';
import { AdminBooksStore } from '../../../src/app/core/state/admin-books-store';
import { BookModel } from '../../../src/app/core/models/book.model';

function makeBook(overrides: Partial<BookModel> = {}): BookModel {
  return {
    id: 'book-1',
    barcode: '0306406152',
    cover: 'https://example.com/cover.jpg',
    title: 'The Pragmatic Programmer',
    authors: ['Andrew Hunt', 'David Thomas'],
    description: 'A classic on software craftsmanship.',
    subjects: ['Software', 'Engineering'],
    publicationDate: '2020-01-01T00:00:00.000Z',
    publisher: 'Addison-Wesley',
    pages: 352,
    genre: 'Technology',
    ...overrides,
  };
}

function setup(opts: {
  loading?: boolean;
  errorMessage?: string | null;
  books?: BookModel[];
  filters?: { title: string; author: string; genre: string };
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  actionPendingBarcode?: string | null;
  actionError?: string | null;
}) {
  const storeStub = {
    books: () => opts.books ?? [],
    loading: () => opts.loading ?? false,
    errorMessage: () => opts.errorMessage ?? null,
    filters: () => opts.filters ?? { title: '', author: '', genre: '' },
    currentPage: () => opts.currentPage ?? 1,
    totalPages: () => opts.totalPages ?? 1,
    totalCount: () => opts.totalCount ?? 0,
    actionPendingBarcode: () => opts.actionPendingBarcode ?? null,
    actionError: () => opts.actionError ?? null,
    loadPage: jest.fn(),
    applyFilters: jest.fn(),
    clearFilters: jest.fn(),
    goToPage: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  return { storeStub };
}

function providersFor(stubs: ReturnType<typeof setup>) {
  return [{ provide: AdminBooksStore, useValue: stubs.storeStub }];
}

describe('AdminBooks - initial load', () => {
  it('loads page 1 on init', async () => {
    const stubs = setup({});
    await render(AdminBooks, { providers: providersFor(stubs) });

    expect(stubs.storeStub.loadPage).toHaveBeenCalledWith(1);
  });
});

describe('AdminBooks - loading/error/empty states', () => {
  it('shows LoadingState while loading', async () => {
    const stubs = setup({ loading: true });
    await render(AdminBooks, { providers: providersFor(stubs) });

    expect(screen.getByRole('status')).toHaveTextContent('Loading books…');
  });

  it('shows ErrorState and retries the current page on click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ errorMessage: 'DB down', currentPage: 2 });
    await render(AdminBooks, { providers: providersFor(stubs) });

    expect(screen.getByRole('alert')).toHaveTextContent('DB down');

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(stubs.storeStub.loadPage).toHaveBeenCalledWith(2);
  });

  it('shows EmptyState with a "Clear filters" action when a filter is active', async () => {
    const user = userEvent.setup();
    const stubs = setup({ books: [], filters: { title: 'x', author: '', genre: '' } });
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(stubs.storeStub.clearFilters).toHaveBeenCalledTimes(1);
  });

  it('shows EmptyState with no action button when there are no active filters', async () => {
    const stubs = setup({ books: [] });
    await render(AdminBooks, { providers: providersFor(stubs) });

    expect(screen.getByText('No books match this search.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });
});

describe('AdminBooks - filters', () => {
  it('calls applyFilters with the raw form values on submit', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.type(screen.getByLabelText('Title'), 'Pragmatic');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(stubs.storeStub.applyFilters).toHaveBeenCalledWith({
      title: 'Pragmatic',
      author: '',
      genre: '',
    });
  });

  it('resets the form and calls clearFilters when Clear is clicked', async () => {
    const user = userEvent.setup();
    const stubs = setup({ filters: { title: 'x', author: 'y', genre: 'z' } });
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(stubs.storeStub.clearFilters).toHaveBeenCalledTimes(1);
  });
});

describe('AdminBooks - results table', () => {
  it('renders a row per book', async () => {
    const stubs = setup({
      books: [
        makeBook(),
        makeBook({ id: 'book-2', barcode: '0131103628', title: 'The C Programming Language' }),
      ],
      totalCount: 2,
    });
    await render(AdminBooks, { providers: providersFor(stubs) });

    expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
    expect(screen.getByText('The C Programming Language')).toBeInTheDocument();
    expect(screen.getByText(/2 books/)).toBeInTheDocument();
  });
});

describe('AdminBooks - pagination', () => {
  it('disables Previous on page 1 and Next on the last page', async () => {
    const stubs = setup({ books: [makeBook()], currentPage: 1, totalPages: 1 });
    await render(AdminBooks, { providers: providersFor(stubs) });

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('goes to currentPage - 1 / + 1 when Previous/Next are enabled and clicked', async () => {
    const user = userEvent.setup();
    const stubs = setup({ books: [makeBook()], currentPage: 2, totalPages: 3 });
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(stubs.storeStub.goToPage).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(stubs.storeStub.goToPage).toHaveBeenCalledWith(3);
  });
});

describe('AdminBooks - create form', () => {
  it('opens a blank form (barcode enabled) when "+ New book" is clicked', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New book' }));

    expect(screen.getByRole('heading', { name: 'New book' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Barcode/)).toBeEnabled();
    expect(screen.getByLabelText(/Barcode/)).toHaveValue('');
  });

  it('shows validation errors and does not call create when submitted empty', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New book' }));
    await user.click(screen.getByRole('button', { name: 'Create book' }));

    expect(screen.getByText('Enter a valid 10 or 13-digit barcode.')).toBeInTheDocument();
    expect(stubs.storeStub.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid barcode', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New book' }));
    await user.type(screen.getByLabelText(/Barcode/), '12345');
    await user.click(screen.getByRole('button', { name: 'Create book' }));

    expect(screen.getByText('Enter a valid 10 or 13-digit barcode.')).toBeInTheDocument();
    expect(stubs.storeStub.create).not.toHaveBeenCalled();
  });

  it('submits a well-formed payload, splitting authors/subjects into arrays', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: '+ New book' }));
    await user.type(screen.getByLabelText(/Barcode/), '0306406152');
    await user.type(screen.getByLabelText('Cover image URL'), 'https://example.com/c.jpg');
    await user.type(screen.getByLabelText('Title', { selector: '#title' }), 'New Title');
    await user.type(screen.getByLabelText(/Authors/), 'Author One, Author Two');
    await user.type(screen.getByLabelText(/Subjects/), 'Fiction, Classics');
    await user.type(screen.getByLabelText('Description'), 'A great book.');
    await user.type(screen.getByLabelText('Publisher'), 'Some Press');
    await user.type(screen.getByLabelText('Genre', { selector: '#genre' }), 'Fiction');
    await user.type(screen.getByLabelText('Publication date'), '2021-05-10');

    const pages = screen.getByLabelText('Pages');
    await user.clear(pages);
    await user.type(pages, '200');

    await user.click(screen.getByRole('button', { name: 'Create book' }));

    expect(stubs.storeStub.create).toHaveBeenCalledWith(
      expect.objectContaining({
        barcode: '0306406152',
        title: 'New Title',
        authors: ['Author One', 'Author Two'],
        subjects: ['Fiction', 'Classics'],
        pages: 200,
      }),
      expect.any(Function),
    );
  });
});

describe('AdminBooks - edit form', () => {
  it('pre-fills the form and disables the barcode field when editing', async () => {
    const user = userEvent.setup();
    const book = makeBook();
    const stubs = setup({ books: [book] });
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('heading', { name: 'Edit book' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Barcode/)).toHaveValue(book.barcode);
    expect(screen.getByLabelText(/Barcode/)).toBeDisabled();
    expect(screen.getByLabelText('Title', { selector: '#title' })).toHaveValue(book.title);
  });

  it('submits the edit as an update with the book id', async () => {
    const user = userEvent.setup();
    const book = makeBook();
    const stubs = setup({ books: [book] });
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(stubs.storeStub.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: book.id, barcode: book.barcode }),
      expect.any(Function),
    );
  });

  it('cancels the form on Cancel click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ books: [makeBook()] });
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit book' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'Edit book' })).not.toBeInTheDocument();
  });
});

describe('AdminBooks - delete confirm flow', () => {
  it('asks for confirmation before deleting, and cancel backs out without calling remove', async () => {
    const user = userEvent.setup();
    const book = makeBook();
    const stubs = setup({ books: [book] });
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete this book?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete this book?')).not.toBeInTheDocument();
    expect(stubs.storeStub.remove).not.toHaveBeenCalled();
  });

  it('calls remove with the book on confirm', async () => {
    const user = userEvent.setup();
    const book = makeBook();
    const stubs = setup({ books: [book] });
    await render(AdminBooks, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(stubs.storeStub.remove).toHaveBeenCalledWith(book);
  });

  it('shows "Working…" instead of action buttons while a barcode is pending', async () => {
    const book = makeBook();
    const stubs = setup({ books: [book], actionPendingBarcode: book.barcode });
    await render(AdminBooks, { providers: providersFor(stubs) });

    expect(screen.getByText('Working…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});

describe('AdminBooks - action errors', () => {
  it('shows the store actionError message when present', async () => {
    const stubs = setup({ actionError: 'Barcode already exists.' });
    await render(AdminBooks, { providers: providersFor(stubs) });

    expect(screen.getByText('Barcode already exists.')).toBeInTheDocument();
  });
});
