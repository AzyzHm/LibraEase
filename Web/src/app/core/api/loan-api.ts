import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvailabilityResponse,
  LoanCreateResponse,
  LoanListResponse,
  LoanPayload,
  LoanQueryResponse,
  LoanUpdatePayload,
  LoanUpdateResponse,
  SelfCheckoutPayload,
  SelfCheckoutResponse
} from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class LoanApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/loan`;

  /** POST /loan/query. Backend restricts PATRON callers to property:'patron', value:<own id>. */
  queryByPatron(patronId: string): Observable<LoanQueryResponse> {
    return this.http.post<LoanQueryResponse>(`${this.baseUrl}/query`, {
      property: 'patron',
      value: patronId
    });
  }

  /** GET /loan - admin/employee only. Every loan record, unjoined (see LoanListResponse). */
  getAll(): Observable<LoanListResponse> {
    return this.http.get<LoanListResponse>(this.baseUrl);
  }

  /** POST /loan - admin/employee only. Checks a book out to a patron. */
  create(payload: LoanPayload): Observable<LoanCreateResponse> {
    return this.http.post<LoanCreateResponse>(this.baseUrl, payload);
  }

  /** PUT /loan - admin/employee only. Full-record replace; used both to edit and to mark returned. */
  update(payload: LoanUpdatePayload): Observable<LoanUpdateResponse> {
    return this.http.put<LoanUpdateResponse>(this.baseUrl, payload);
  }

  /** POST /loan/self - patron only. Books itself out; no employeeOut involved. */
  selfCheckout(payload: SelfCheckoutPayload): Observable<SelfCheckoutResponse> {
    return this.http.post<SelfCheckoutResponse>(`${this.baseUrl}/self`, payload);
  }

  /** GET /loan/availability/:itemId - any authenticated user. Used to enable/disable the catalog's checkout button. */
  checkAvailability(itemId: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${this.baseUrl}/availability/${itemId}`);
  }
}