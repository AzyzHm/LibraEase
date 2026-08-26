import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BookCreatePayload,
  BookCreateResponse,
  BookDeleteResponse,
  BookListResponse,
  BookQueryParams,
  BookQueryResponse,
  BookUpdatePayload,
  BookUpdateResponse,
} from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class BookApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/book`;

  getAll(page = 1, limit = 25): Observable<BookListResponse> {
    const httpParams = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<BookListResponse>(this.baseUrl, { params: httpParams });
  }

  search(params: BookQueryParams): Observable<BookQueryResponse> {
    let httpParams = new HttpParams();

    if (params.title) httpParams = httpParams.set('title', params.title);
    if (params.author) httpParams = httpParams.set('author', params.author);
    if (params.genre) httpParams = httpParams.set('genre', params.genre);
    if (params.subject) httpParams = httpParams.set('subject', params.subject);
    httpParams = httpParams.set('page', String(params.page ?? 1));
    httpParams = httpParams.set('limit', String(params.limit ?? 12));

    return this.http.get<BookQueryResponse>(`${this.baseUrl}/query`, { params: httpParams });
  }

  create(payload: BookCreatePayload): Observable<BookCreateResponse> {
    return this.http.post<BookCreateResponse>(this.baseUrl, payload);
  }

  update(payload: BookUpdatePayload): Observable<BookUpdateResponse> {
    return this.http.put<BookUpdateResponse>(this.baseUrl, payload);
  }

  remove(barcode: string): Observable<BookDeleteResponse> {
    return this.http.delete<BookDeleteResponse>(`${this.baseUrl}/${barcode}`);
  }
}