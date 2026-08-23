import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LibraryCardApi } from '../../../src/app/core/api/library-card-api';
import { environment } from '../../../src/environments/environment';
import { LibraryCardWithUser } from '../../../src/app/core/models/library-card.model';

describe('LibraryCardApi', () => {
  let api: LibraryCardApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/card`;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(LibraryCardApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAll() issues a GET to /card', () => {
    api.getAll().subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'ok', count: 1, cards: [card] });
  });

  it('issue() POSTs { user: userId } to /card', () => {
    api.issue('user-1').subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ user: 'user-1' });
    req.flush({ message: 'issued', savedCard: card });
  });

  it('getById() issues a GET to /card/:cardId', () => {
    api.getById('card-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/card-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'ok', card });
  });

  it('getMine() issues a GET to /card/me', () => {
    api.getMine().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'ok', card });
  });
});
