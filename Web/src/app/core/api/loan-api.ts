import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoanQueryResponse } from '../models/loan.model';

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
}