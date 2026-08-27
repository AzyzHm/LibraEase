import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthApi } from '../../../src/app/core/api/auth-api';
import { environment } from '../../../src/environments/environment';
import { LoginResponse, RegisterResponse } from '../../../src/app/core/models/auth.model';

describe('AuthApi', () => {
  let api: AuthApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(AuthApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts credentials to /auth/login and returns the response', () => {
    const credentials = { email: 'jane@example.com', password: 'secret' };
    const mockResponse: LoginResponse = {
      message: 'ok',
      user: {
        id: 'u1',
        type: 'PATRON',
        firstname: 'Jane',
        lastname: 'Doe',
        email: credentials.email,
      },
      csrfToken: 'csrf-token-value',
    };

    let result: LoginResponse | undefined;
    api.login(credentials).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${baseUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('posts the payload to /auth/register and returns the response', () => {
    const payload = {
      firstname: 'Jane',
      lastname: 'Doe',
      email: 'jane@example.com',
      password: 'secret',
    };
    const mockResponse: RegisterResponse = {
      message: 'registered',
      user: { id: 'u1', type: 'PATRON', firstname: 'Jane', lastname: 'Doe', email: payload.email },
    };

    let result: RegisterResponse | undefined;
    api.register(payload).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${baseUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });
});
