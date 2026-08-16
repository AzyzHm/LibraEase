import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookListResponse, BookQueryParams, BookQueryResponse } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class BookApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/book`;

  /** GET /book - full unpaginated list, used sparingly (e.g. "recently added"). */
  getAll(): Observable<BookListResponse> {
    return this.http.get<BookListResponse>(this.baseUrl);
  }

  /** GET /book/query - server-side filtering + pagination, used for catalog browsing. */
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
}