import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { CatalogStore } from '../../../src/app/core/state/catalog-store';
import { BookApi } from '../../../src/app/core/api/book-api';
import { BookQueryResponse, BookModel } from '../../../src/app/core/models/book.model';

function makeBook(overrides: Partial<BookModel> = {}): BookModel {
  return {
    id: 'book-1',
    barcode: '0306406152',
    cover: 'cover.jpg',
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

function setup(bookApiStub: Partial<BookApi>) {
  TestBed.configureTestingModule({
    providers: [{ provide: BookApi, useValue: bookApiStub }],
  });
  return TestBed.inject(CatalogStore);
}

describe('CatalogStore.loadPage', () => {
  it('populates books/pagination signals on success', () => {
    const response: BookQueryResponse = {
      message: 'ok',
      page: {
        totalCount: 20,
        currentPage: 2,
        totalPages: 2,
        limit: 12,
        pageCount: 8,
        items: [makeBook()],
      },
    };
    const store = setup({ search: () => of(response) });

    store.loadPage(2);

    expect(store.books()).toEqual([makeBook()]);
    expect(store.currentPage()).toBe(2);
    expect(store.totalPages()).toBe(2);
    expect(store.totalCount()).toBe(20);
    expect(store.loading()).toBe(false);
    expect(store.errorMessage()).toBeNull();
  });

  it('clears books and floors totalPages at 1 even if the server reports 0', () => {
    const response: BookQueryResponse = {
      message: 'ok',
      page: { totalCount: 0, currentPage: 1, totalPages: 0, limit: 12, pageCount: 0, items: [] },
    };
    const store = setup({ search: () => of(response) });

    store.loadPage(1);

    expect(store.totalPages()).toBe(1);
  });

  it('sets errorMessage and clears books on failure', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'DB unreachable' } });
    const store = setup({ search: () => throwError(() => httpError) });

    store.loadPage(1);

    expect(store.books()).toEqual([]);
    expect(store.errorMessage()).toBe('DB unreachable');
    expect(store.loading()).toBe(false);
  });

  it('sends only the non-empty (trimmed) filters as query params', () => {
    let capturedParams: unknown;
    const store = setup({
      search: (params) => {
        capturedParams = params;
        return of({
          message: 'ok',
          page: {
            totalCount: 0,
            currentPage: 1,
            totalPages: 1,
            limit: 12,
            pageCount: 0,
            items: [],
          },
        });
      },
    });

    store.applyFilters({ title: '  Pragmatic  ', author: '', genre: '   ' });

    expect(capturedParams).toEqual({
      title: 'Pragmatic',
      author: undefined,
      genre: undefined,
      page: 1,
      limit: 12,
    });
  });
});

describe('CatalogStore.applyFilters / clearFilters', () => {
  it('applyFilters stores the filters and jumps back to page 1', () => {
    const store = setup({
      search: () =>
        of({
          message: 'ok',
          page: {
            totalCount: 0,
            currentPage: 1,
            totalPages: 1,
            limit: 12,
            pageCount: 0,
            items: [],
          },
        }),
    });

    store.applyFilters({ title: 'x', author: '', genre: '' });

    expect(store.filters()).toEqual({ title: 'x', author: '', genre: '' });
    expect(store.currentPage()).toBe(1);
  });

  it('clearFilters resets to empty filters', () => {
    const store = setup({
      search: () =>
        of({
          message: 'ok',
          page: {
            totalCount: 0,
            currentPage: 1,
            totalPages: 1,
            limit: 12,
            pageCount: 0,
            items: [],
          },
        }),
    });
    store.applyFilters({ title: 'x', author: 'y', genre: 'z' });

    store.clearFilters();

    expect(store.filters()).toEqual({ title: '', author: '', genre: '' });
  });
});

describe('CatalogStore.goToPage', () => {
  it('loads the requested page when in range and different from the current page', () => {
    const searchSpy = jest.fn((params: { page?: number }) =>
      of({
        message: 'ok',
        page: {
          totalCount: 30,
          currentPage: params.page ?? 1,
          totalPages: 3,
          limit: 12,
          pageCount: 6,
          items: [],
        },
      }),
    );
    const store = setup({ search: searchSpy });
    store.loadPage(1);
    searchSpy.mockClear();

    store.goToPage(3);

    expect(searchSpy).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the page is out of range', () => {
    const searchSpy = jest.fn(() =>
      of({
        message: 'ok',
        page: { totalCount: 12, currentPage: 1, totalPages: 1, limit: 12, pageCount: 1, items: [] },
      }),
    );
    const store = setup({ search: searchSpy });
    store.loadPage(1);
    searchSpy.mockClear();

    store.goToPage(5);
    store.goToPage(0);

    expect(searchSpy).not.toHaveBeenCalled();
  });

  it('does nothing when the requested page equals the current page', () => {
    const searchSpy = jest.fn(() =>
      of({
        message: 'ok',
        page: {
          totalCount: 24,
          currentPage: 1,
          totalPages: 2,
          limit: 12,
          pageCount: 12,
          items: [],
        },
      }),
    );
    const store = setup({ search: searchSpy });
    store.loadPage(1);
    searchSpy.mockClear();

    store.goToPage(1);

    expect(searchSpy).not.toHaveBeenCalled();
  });
});
