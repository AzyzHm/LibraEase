import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from '../../../src/app/core/interceptors/auth-interceptor';
import { AuthStore } from '../../../src/app/core/state/auth-store';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let router: Router;
  let authStoreStub: { token: jest.Mock; logout: jest.Mock };

  function setup(token: string | null) {
    authStoreStub = { token: jest.fn(() => token), logout: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreStub },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('does not add an Authorization header when there is no token', () => {
    setup(null);

    http.get('/api/books').subscribe();

    const req = httpMock.expectOne('/api/books');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('adds a Bearer Authorization header when a token is present', () => {
    setup('the-jwt-token');

    http.get('/api/books').subscribe();

    const req = httpMock.expectOne('/api/books');
    expect(req.request.headers.get('Authorization')).toBe('Bearer the-jwt-token');
    req.flush({});
  });

  it('logs out and redirects to /login on a 401 response', () => {
    setup('expired-token');
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    http.get('/api/books').subscribe({
      error: () => {
      },
    });

    const req = httpMock.expectOne('/api/books');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authStoreStub.logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: expect.any(String) } });
  });

  it('does not log out on non-401 errors', () => {
    setup('the-jwt-token');

    http.get('/api/books').subscribe({
      error: () => {
      },
    });

    const req = httpMock.expectOne('/api/books');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(authStoreStub.logout).not.toHaveBeenCalled();
  });

  it('re-throws the original error so callers still see it', (done) => {
    setup('the-jwt-token');

    http.get('/api/books').subscribe({
      next: () => done.fail('expected an error'),
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(404);
        done();
      },
    });

    const req = httpMock.expectOne('/api/books');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
  });
});