import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AdminBooksStore } from '../../../src/app/core/state/admin-books-store';
import { BookApi } from '../../../src/app/core/api/book-api';
import { Book, BookModel } from '../../../src/app/core/models/book.model';

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

const emptyPage = {
  totalCount: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 10,
  pageCount: 0,
  items: [],
};

function setup(bookApiStub: Partial<BookApi>) {
  TestBed.configureTestingModule({ providers: [{ provide: BookApi, useValue: bookApiStub }] });
  return TestBed.inject(AdminBooksStore);
}

describe('AdminBooksStore.loadPage', () => {
  it('populates books/pagination on success', () => {
    const response = {
      message: 'ok',
      page: {
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        limit: 10,
        pageCount: 1,
        items: [makeBook()],
      },
    };
    const store = setup({ search: () => of(response) });

    store.loadPage(1);

    expect(store.books()).toEqual([makeBook()]);
    expect(store.loading()).toBe(false);
    expect(store.errorMessage()).toBeNull();
  });

  it('sets errorMessage and clears books on failure', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'DB down' } });
    const store = setup({ search: () => throwError(() => httpError) });

    store.loadPage(1);

    expect(store.books()).toEqual([]);
    expect(store.errorMessage()).toBe('DB down');
  });
});

describe('AdminBooksStore.applyFilters / clearFilters / goToPage', () => {
  it('applyFilters stores filters and resets to page 1', () => {
    const store = setup({ search: () => of({ message: 'ok', page: emptyPage }) });

    store.applyFilters({ title: 'x', author: '', genre: '' });

    expect(store.filters()).toEqual({ title: 'x', author: '', genre: '' });
  });

  it('clearFilters resets filters to empty', () => {
    const store = setup({ search: () => of({ message: 'ok', page: emptyPage }) });
    store.applyFilters({ title: 'x', author: 'y', genre: 'z' });

    store.clearFilters();

    expect(store.filters()).toEqual({ title: '', author: '', genre: '' });
  });

  it('goToPage does nothing when the target page is out of range', () => {
    const searchSpy = jest.fn(() => of({ message: 'ok', page: emptyPage }));
    const store = setup({ search: searchSpy });
    store.loadPage(1);
    searchSpy.mockClear();

    store.goToPage(99);

    expect(searchSpy).not.toHaveBeenCalled();
  });
});

describe('AdminBooksStore.create', () => {
  const payload: Book = makeBook();

  it('calls onSuccess and reloads page 1 on success', () => {
    const searchSpy = jest.fn(() => of({ message: 'ok', page: emptyPage }));
    const store = setup({
      create: () => of({ message: 'created', savedBook: makeBook() }),
      search: searchSpy,
    });
    const onSuccess = jest.fn();

    store.create(payload, onSuccess);

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    expect(store.actionPendingBarcode()).toBeNull();
    expect(store.actionError()).toBeNull();
  });

  it('sets actionError and does not call onSuccess on failure', () => {
    const httpError = new HttpErrorResponse({ status: 422, error: { message: 'Invalid barcode' } });
    const store = setup({ create: () => throwError(() => httpError) });
    const onSuccess = jest.fn();

    store.create(payload, onSuccess);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(store.actionError()).toBe('Invalid barcode');
    expect(store.actionPendingBarcode()).toBeNull();
  });
});

describe('AdminBooksStore.update', () => {
  it('calls onSuccess and reloads the current page on success', () => {
    const searchSpy = jest.fn(() => of({ message: 'ok', page: emptyPage }));
    const store = setup({
      update: () => of({ message: 'updated', updatedBook: makeBook() }),
      search: searchSpy,
    });
    const onSuccess = jest.fn();

    store.update({ ...makeBook(), id: 'book-1' }, onSuccess);

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('sets actionError on failure', () => {
    const httpError = new HttpErrorResponse({ status: 404, error: { message: 'Book not found' } });
    const store = setup({ update: () => throwError(() => httpError) });

    store.update({ ...makeBook(), id: 'book-1' }, jest.fn());

    expect(store.actionError()).toBe('Book not found');
  });
});

describe('AdminBooksStore.remove', () => {
  it('reloads the current page when it is not the last row on a page beyond page 1', () => {
    const searchSpy = jest.fn(() =>
      of({
        message: 'ok',
        page: { ...emptyPage, currentPage: 1, items: [makeBook(), makeBook({ id: 'b2' })] },
      }),
    );
    const store = setup({ search: searchSpy, remove: () => of({ message: 'deleted' }) });
    store.loadPage(1);
    searchSpy.mockClear();

    store.remove(makeBook());

    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('steps back a page when removing the last row on a page beyond page 1', () => {
    const searchSpy = jest
      .fn()
      .mockReturnValueOnce(
        of({ message: 'ok', page: { ...emptyPage, currentPage: 2, items: [makeBook()] } }),
      )
      .mockReturnValue(of({ message: 'ok', page: { ...emptyPage, currentPage: 1, items: [] } }));
    const store = setup({ search: searchSpy, remove: () => of({ message: 'deleted' }) });
    store.loadPage(2);
    searchSpy.mockClear();

    store.remove(makeBook());

    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('sets actionError on failure', () => {
    const httpError = new HttpErrorResponse({ status: 500, error: { message: 'delete failed' } });
    const store = setup({ remove: () => throwError(() => httpError) });

    store.remove(makeBook());

    expect(store.actionError()).toBe('delete failed');
  });
});
