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

function setDocumentCookie(value: string): void {
  document.cookie = value;
}

function clearCookies(): void {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let router: Router;
  let authStoreStub: { logout: jest.Mock };

  function setup() {
    authStoreStub = { logout: jest.fn() };

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
    clearCookies();
  });

  it('sends withCredentials on every request so the auth cookie is attached', () => {
    setup();

    http.get('/api/books').subscribe();

    const req = httpMock.expectOne('/api/books');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('does not add an X-CSRF-Token header on safe (GET) requests', () => {
    setup();
    setDocumentCookie('csrf_token=some-csrf-value');

    http.get('/api/books').subscribe();

    const req = httpMock.expectOne('/api/books');
    expect(req.request.headers.has('X-CSRF-Token')).toBe(false);
    req.flush({});
  });

  it('adds the X-CSRF-Token header on mutating requests when the cookie is present', () => {
    setup();
    setDocumentCookie('csrf_token=some-csrf-value');

    http.post('/api/books', {}).subscribe();

    const req = httpMock.expectOne('/api/books');
    expect(req.request.headers.get('X-CSRF-Token')).toBe('some-csrf-value');
    req.flush({});
  });

  it('omits the X-CSRF-Token header on mutating requests when there is no CSRF cookie', () => {
    setup();

    http.post('/api/books', {}).subscribe();

    const req = httpMock.expectOne('/api/books');
    expect(req.request.headers.has('X-CSRF-Token')).toBe(false);
    req.flush({});
  });

  it('logs out and redirects to /login on a 401 response', () => {
    setup();
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    http.get('/api/books').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/books');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authStoreStub.logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: expect.any(String) },
    });
  });

  it('does not log out on non-401 errors', () => {
    setup();

    http.get('/api/books').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/books');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(authStoreStub.logout).not.toHaveBeenCalled();
  });

  it('re-throws the original error so callers still see it', (done) => {
    setup();

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
