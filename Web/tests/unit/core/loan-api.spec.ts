import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoanApi } from '../../../src/app/core/api/loan-api';
import { environment } from '../../../src/environments/environment';
import { LoanRecordModel } from '../../../src/app/core/models/loan.model';

describe('LoanApi', () => {
  let api: LoanApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/loan`;

  const record: LoanRecordModel = {
    id: 'record-1',
    status: 'LOANED',
    loanedDate: '2026-01-01',
    dueDate: '2026-01-15',
    returnedDate: '',
    patron: 'patron-1',
    employeeOut: 'employee-1',
    item: 'book-1',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(LoanApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('queryByPatron() POSTs a property:"patron" filter to /loan/query', () => {
    api.queryByPatron('patron-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/query`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ property: 'patron', value: 'patron-1' });
    req.flush({ message: 'ok', records: [] });
  });

  it('getAll() issues a GET to /loan', () => {
    api.getAll().subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'ok', records: [record] });
  });

  it('create() POSTs the payload to /loan', () => {
    const payload = {
      status: 'LOANED' as const,
      loanedDate: '2026-01-01',
      dueDate: '2026-01-15',
      patron: 'patron-1',
      employeeOut: 'employee-1',
      item: 'book-1',
    };
    api.create(payload).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ message: 'created', record });
  });

  it('update() PUTs the payload to /loan, including an explicit employeeOut: null for self-returns', () => {
    const payload = {
      id: 'record-1',
      status: 'AVAILABLE' as const,
      loanedDate: '2026-01-01',
      dueDate: '2026-01-15',
      returnedDate: '2026-01-10',
      patron: 'patron-1',
      employeeOut: null as unknown as string,
      item: 'book-1',
    };
    api.update(payload).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    expect(req.request.body.employeeOut).toBeNull();
    req.flush({ message: 'updated', record });
  });

  it('selfCheckout() POSTs to /loan/self', () => {
    const payload = { item: 'book-1', dueDate: '2099-01-01' };
    api.selfCheckout(payload).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/self`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ message: 'checked out', record });
  });

  it('checkAvailability() issues a GET to /loan/availability/:itemId', () => {
    api.checkAvailability('book-1').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/availability/book-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'ok', available: true });
  });
});
