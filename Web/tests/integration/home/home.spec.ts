import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Home } from '../../../src/app/features/home/home';
import { BookApi } from '../../../src/app/core/api/book-api';
import { AuthStore } from '../../../src/app/core/state/auth-store';
import { SelfCheckoutStore } from '../../../src/app/core/state/self-checkout-store';
import { BookModel, BookQueryResponse } from '../../../src/app/core/models/book.model';

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

function makeResponse(items: BookModel[]): BookQueryResponse {
  return {
    message: 'ok',
    page: {
      items,
      currentPage: 1,
      limit: 8,
      totalCount: items.length,
      totalPages: 1,
      pageCount: 1,
    },
  };
}

function setup(opts: { searchResult?: 'success' | 'error'; items?: BookModel[] }) {
  const searchSpy = jest
    .fn()
    .mockReturnValue(
      opts.searchResult === 'error'
        ? throwError(() => new Error('network error'))
        : of(makeResponse(opts.items ?? [makeBook()])),
    );
  const bookApiStub = { search: searchSpy };
  const authStoreStub = { isPatron: () => false };
  const checkoutStoreStub = {
    availability: () => ({}),
    checkAvailability: jest.fn(),
    checkout: () => of({ message: 'checked out', record: {} }),
    extractErrorMessage: () => 'error',
  };

  return { searchSpy, bookApiStub, authStoreStub, checkoutStoreStub };
}

function providersFor(stubs: ReturnType<typeof setup>) {
  return [
    { provide: BookApi, useValue: stubs.bookApiStub },
    { provide: AuthStore, useValue: stubs.authStoreStub },
    { provide: SelfCheckoutStore, useValue: stubs.checkoutStoreStub },
  ];
}

describe('Home - featured books load', () => {
  it('calls BookApi.search with page 1 and the featured limit on init', async () => {
    const stubs = setup({});
    await render(Home, { providers: providersFor(stubs) });

    expect(stubs.searchSpy).toHaveBeenCalledWith({ page: 1, limit: 8 });
  });

  it('renders a BookCard per featured book once loaded', async () => {
    const stubs = setup({
      items: [makeBook(), makeBook({ id: 'book-2', title: 'The C Programming Language' })],
    });
    await render(Home, { providers: providersFor(stubs) });

    expect(screen.getByRole('heading', { name: 'The Pragmatic Programmer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The C Programming Language' })).toBeInTheDocument();
  });

  it('shows an ErrorState with a working retry when the search call fails', async () => {
    const user = userEvent.setup();
    const stubs = setup({ searchResult: 'error' });
    await render(Home, { providers: providersFor(stubs) });

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load featured books.");

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(stubs.searchSpy).toHaveBeenCalledTimes(2);
  });

  it('shows an EmptyState when there are no featured books', async () => {
    const stubs = setup({ items: [] });
    await render(Home, { providers: providersFor(stubs) });

    expect(screen.getByText('No books in the catalog yet.')).toBeInTheDocument();
  });
});

describe('Home - search box', () => {
  it('navigates to /catalog with the typed title as a query param on submit', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    const { fixture } = await render(Home, { providers: providersFor(stubs) });
    const router = fixture.debugElement.injector.get(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    await user.type(screen.getByLabelText('Search by title'), 'Pragmatic');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(navigateSpy).toHaveBeenCalledWith(['/catalog'], { queryParams: { title: 'Pragmatic' } });
  });

  it('navigates to /catalog with no query params when the search box is empty', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    const { fixture } = await render(Home, { providers: providersFor(stubs) });
    const router = fixture.debugElement.injector.get(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(navigateSpy).toHaveBeenCalledWith(['/catalog'], undefined);
  });

  it('trims whitespace-only input down to an empty search', async () => {
    const user = userEvent.setup();
    const stubs = setup({});
    const { fixture } = await render(Home, { providers: providersFor(stubs) });
    const router = fixture.debugElement.injector.get(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    await user.type(screen.getByLabelText('Search by title'), '   ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(navigateSpy).toHaveBeenCalledWith(['/catalog'], undefined);
  });
});
