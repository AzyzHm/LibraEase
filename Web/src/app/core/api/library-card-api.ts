import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LibraryCardCreateResponse, LibraryCardGetResponse, LibraryCardListResponse } from '../models/library-card.model';

@Injectable({ providedIn: 'root' })
export class LibraryCardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/card`;

  /** GET /card - admin/employee only. Every issued card, with the owning user joined in. */
  getAll(): Observable<LibraryCardListResponse> {
    return this.http.get<LibraryCardListResponse>(this.baseUrl);
  }

  /** POST /card - issues a card for `userId`. Idempotent: returns the existing card if one already exists. */
  issue(userId: string): Observable<LibraryCardCreateResponse> {
    return this.http.post<LibraryCardCreateResponse>(this.baseUrl, { user: userId });
  }

  /** GET /card/:cardId - owner or admin/employee. */
  getById(cardId: string): Observable<LibraryCardGetResponse> {
    return this.http.get<LibraryCardGetResponse>(`${this.baseUrl}/${cardId}`);
  }
}