import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Catalog } from '../../../src/app/features/catalog/catalog';
import { CatalogStore } from '../../../src/app/core/state/catalog-store';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { SelfCheckoutStore } from '../../../src/app/core/state/self-checkout-store';
import { BookModel } from '../../../src/app/core/models/book.model';

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

function setup(opts: {
  loading?: boolean;
  errorMessage?: string | null;
  books?: BookModel[];
  filters?: { title: string; author: string; genre: string };
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  queryTitle?: string | null;
}) {
  const catalogStoreStub = {
    loading: () => opts.loading ?? false,
    errorMessage: () => opts.errorMessage ?? null,
    books: () => opts.books ?? [],
    filters: () => opts.filters ?? { title: '', author: '', genre: '' },
    currentPage: () => opts.currentPage ?? 1,
    totalPages: () => opts.totalPages ?? 1,
    totalCount: () => opts.totalCount ?? 0,
    loadPage: jest.fn(),
    applyFilters: jest.fn(),
    clearFilters: jest.fn(),
    goToPage: jest.fn(),
  };
  const authStoreStub = { isPatron: () => false };
  const checkoutStoreStub = { availability: () => ({}), checkAvailability: jest.fn() };
  const activatedRouteStub = {
    snapshot: { queryParamMap: convertToParamMap(opts.queryTitle ? { title: opts.queryTitle } : {}) },
  };

  return { catalogStoreStub, authStoreStub, checkoutStoreStub, activatedRouteStub };
}

function providersFor(stubs: ReturnType<typeof setup>) {
  return [
    { provide: CatalogStore, useValue: stubs.catalogStoreStub },
    { provide: AuthStore, useValue: stubs.authStoreStub },
    { provide: SelfCheckoutStore, useValue: stubs.checkoutStoreStub },
    { provide: ActivatedRoute, useValue: stubs.activatedRouteStub },
  ];
}

describe('Catalog - initial load', () => {
  it('loads the current page on init when there is no ?title= query param', async () => {
    const stubs = setup({ currentPage: 3 });
    await render(Catalog, { providers: providersFor(stubs) });

    expect(stubs.catalogStoreStub.loadPage).toHaveBeenCalledWith(3);
    expect(stubs.catalogStoreStub.applyFilters).not.toHaveBeenCalled();
  });

  it('applies a ?title= query param as a filter override instead of loading the current page as-is', async () => {
    const stubs = setup({ queryTitle: 'Pragmatic', filters: { title: '', author: 'Hunt', genre: '' } });
    await render(Catalog, { providers: providersFor(stubs) });

    expect(stubs.catalogStoreStub.applyFilters).toHaveBeenCalledWith({ title: 'Pragmatic', author: 'Hunt', genre: '' });
    expect(stubs.catalogStoreStub.loadPage).not.toHaveBeenCalled();
  });

  it('pre-fills the filter form from the store on init', async () => {
    const stubs = setup({ filters: { title: 'x', author: 'y', genre: 'z' } });
    await render(Catalog, { providers: providersFor(stubs) });

    expect(screen.getByLabelText('Title')).toHaveValue('x');
    expect(screen.getByLabelText('Author')).toHaveValue('y');
    expect(screen.getByLabelText('Genre')).toHaveValue('z');
  });
});

describe('Catalog - loading/error/empty states', () => {
  it('shows LoadingState while loading', async () => {
    const stubs = setup({ loading: true });
    await render(Catalog, { providers: providersFor(stubs) });

    expect(screen.getByRole('status')).toHaveTextContent('Loading books…');
  });

  it('shows ErrorState and retries the current page on click', async () => {
    const user = userEvent.setup();
    const stubs = setup({ errorMessage: 'DB down', currentPage: 2 });
    await render(Catalog, { providers: providersFor(stubs) });

    expect(screen.getByRole('alert')).toHaveTextContent('DB down');

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(stubs.catalogStoreStub.loadPage).toHaveBeenCalledWith(2);
  });

  it('shows EmptyState with no action button when there are no active filters', async () => {
    const stubs = setup({ books: [] });
    await render(Catalog, { providers: providersFor(stubs) });

    expect(screen.getByText('No books match your search.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('shows a "Clear filters" action in EmptyState when a filter is active, and wires it to clearFilters', async () => {
    const user = userEvent.setup();
    const stubs = setup({ books: [], filters: { title: 'x', author: '', genre: '' } });
    await render(Catalog, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(stubs.catalogStoreStub.clearFilters).toHaveBeenCalledTimes(1);
  });
});

describe('Catalog - results', () => {
  it('renders a book card per result and the total count', async () => {
    const stubs = setup({ books: [makeBook(), makeBook({ id: 'book-2' })], totalCount: 2 });
    await render(Catalog, { providers: providersFor(stubs) });

    expect(screen.getByText('2 book(s) found')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'The Pragmatic Programmer' })).toHaveLength(2);
  });
});

describe('Catalog - filter form', () => {
  it('calls applyFilters with the raw form values on submit', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    await render(Catalog, { providers: providersFor(stubs) });

    await user.type(screen.getByLabelText('Title'), 'Pragmatic');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(stubs.catalogStoreStub.applyFilters).toHaveBeenCalledWith({ title: 'Pragmatic', author: '', genre: '' });
  });

  it('resets the form and calls clearFilters when Clear is clicked', async () => {
    const user = userEvent.setup();
    const stubs = setup({ filters: { title: 'x', author: 'y', genre: 'z' } });
    await render(Catalog, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(stubs.catalogStoreStub.clearFilters).toHaveBeenCalledTimes(1);
  });
});

describe('Catalog - pagination', () => {
  it('disables Previous on page 1 and Next on the last page', async () => {
    const stubs = setup({ books: [makeBook()], currentPage: 1, totalPages: 1 });
    await render(Catalog, { providers: providersFor(stubs) });

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('goes to currentPage - 1 / + 1 when Previous/Next are enabled and clicked', async () => {
    const user = userEvent.setup();
    const stubs = setup({ books: [makeBook()], currentPage: 2, totalPages: 3 });
    await render(Catalog, { providers: providersFor(stubs) });

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(stubs.catalogStoreStub.goToPage).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(stubs.catalogStoreStub.goToPage).toHaveBeenCalledWith(3);
  });
});