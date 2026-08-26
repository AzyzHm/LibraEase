import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookApi } from '../../../src/app/core/api/book-api';
import { environment } from '../../../src/environments/environment';
import { Book, BookModel } from '../../../src/app/core/models/book.model';

describe('BookApi', () => {
  let api: BookApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/book`;

  const book: Book = {
    barcode: '0306406152',
    cover: 'cover.jpg',
    title: 'The Pragmatic Programmer',
    authors: ['Andrew Hunt'],
    description: 'A great book',
    subjects: ['Software'],
    publicationDate: '2020-01-01',
    publisher: 'Addison-Wesley',
    pages: 352,
    genre: 'Technology',
  };
  const bookModel: BookModel = { ...book, id: 'book-1' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(BookApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAll() issues a GET to /book with page/limit defaults', () => {
    api.getAll().subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.get('page') === '1' && r.params.get('limit') === '25',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      message: 'ok',
      page: {
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        limit: 25,
        pageCount: 1,
        items: [bookModel],
      },
    });
  });

  it('getAll() forwards an explicit page/limit instead of the defaults', () => {
    api.getAll(2, 10).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.get('page') === '2' && r.params.get('limit') === '10',
    );
    req.flush({
      message: 'ok',
      page: { totalCount: 0, currentPage: 2, totalPages: 1, limit: 10, pageCount: 0, items: [] },
    });
  });

  it('search() only sets query params that were actually provided, plus page/limit defaults', () => {
    api.search({ title: 'Pragmatic' }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/query` && r.params.get('title') === 'Pragmatic',
    );
    expect(req.request.params.has('author')).toBe(false);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('12');
    req.flush({
      message: 'ok',
      page: {
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        limit: 12,
        pageCount: 1,
        items: [bookModel],
      },
    });
  });

  it('search() forwards an explicit page/limit instead of the defaults', () => {
    api.search({ page: 3, limit: 25 }).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/query`);
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('limit')).toBe('25');
    req.flush({
      message: 'ok',
      page: { totalCount: 0, currentPage: 3, totalPages: 1, limit: 25, pageCount: 0, items: [] },
    });
  });

  it('create() POSTs the payload to /book', () => {
    api.create(book).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(book);
    req.flush({ message: 'created', savedBook: bookModel });
  });

  it('update() PUTs the payload to /book', () => {
    const payload = { ...book, id: 'book-1' };
    api.update(payload).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ message: 'updated', updatedBook: bookModel });
  });

  it('remove() DELETEs /book/:barcode', () => {
    api.remove('0306406152').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/0306406152`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'deleted' });
  });
});
