import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserApi } from '../../../src/app/core/api/user-api';
import { environment } from '../../../src/environments/environment';
import { AdminUser } from '../../../src/app/core/models/admin.model';

describe('UserApi', () => {
  let api: UserApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/users`;

  const adminUser: AdminUser = {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    status: 'APPROVED',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UserApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('update() PUTs the payload to /users', () => {
    const payload = { id: 'user-1', type: 'PATRON' as const, firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com' };
    api.update(payload).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ message: 'updated', updatedUser: { id: 'user-1', type: 'PATRON', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com' } });
  });

  it('getAll() issues a GET to /users', () => {
    api.getAll().subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'ok', users: [adminUser] });
  });

  it('approve() PUTs an empty body to /users/:userId/approve', () => {
    api.approve('user-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/user-1/approve`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush({ message: 'approved', user: adminUser });
  });

  it('reject() PUTs an empty body to /users/:userId/reject', () => {
    api.reject('user-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/user-1/reject`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'rejected', user: adminUser });
  });

  it('remove() DELETEs /users/:userId', () => {
    api.remove('user-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/user-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'deleted' });
  });

  it('promote() PUTs an empty body to /users/:userId/promote', () => {
    api.promote('user-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/user-1/promote`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'promoted', user: adminUser });
  });

  it('demote() PUTs an empty body to /users/:userId/demote', () => {
    api.demote('user-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/user-1/demote`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'demoted', user: adminUser });
  });
});