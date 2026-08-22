import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { BookApi } from '../api/book-api';
import { ApiErrorBody } from '../models/auth.model';
import { BookModel, BookQueryParams } from '../models/book.model';

export interface CatalogFilters {
  title: string;
  author: string;
  genre: string;
}

const EMPTY_FILTERS: CatalogFilters = { title: '', author: '', genre: '' };
const PAGE_SIZE = 12;

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly bookApi = inject(BookApi);

  readonly books = signal<BookModel[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly filters = signal<CatalogFilters>(EMPTY_FILTERS);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);

  /** Loads (or reloads) results for the given page using the current filters. */
  loadPage(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const params: BookQueryParams = {
      ...this.toQueryParams(this.filters()),
      page,
      limit: PAGE_SIZE,
    };

    this.bookApi
      .search(params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.books.set(response.page.items);
          this.currentPage.set(response.page.currentPage);
          this.totalPages.set(Math.max(response.page.totalPages, 1));
          this.totalCount.set(response.page.totalCount);
        },
        error: (error: HttpErrorResponse) => {
          this.books.set([]);
          this.errorMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  /** Applies a new set of filters and jumps back to page 1. */
  applyFilters(filters: CatalogFilters): void {
    this.filters.set(filters);
    this.loadPage(1);
  }

  clearFilters(): void {
    this.applyFilters(EMPTY_FILTERS);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.loadPage(page);
  }

  private toQueryParams(filters: CatalogFilters): BookQueryParams {
    return {
      title: filters.title.trim() || undefined,
      author: filters.author.trim() || undefined,
      genre: filters.genre.trim() || undefined,
    };
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? 'Unable to load the catalog right now. Please try again.';
  }
}
