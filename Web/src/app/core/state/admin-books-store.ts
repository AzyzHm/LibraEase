import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { BookApi } from '../api/book-api';
import { ApiErrorBody } from '../models/auth.model';
import { Book, BookCreatePayload, BookModel, BookQueryParams, BookUpdatePayload } from '../models/book.model';

export interface AdminBookFilters {
  title: string;
  author: string;
  genre: string;
}

const EMPTY_FILTERS: AdminBookFilters = { title: '', author: '', genre: '' };
const PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class AdminBooksStore {
  private readonly bookApi = inject(BookApi);

  readonly books = signal<BookModel[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly filters = signal<AdminBookFilters>(EMPTY_FILTERS);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);

  /** Barcode of the book currently running a create/update/delete call. Null while idle. */
  readonly actionPendingBarcode = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  loadPage(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const params: BookQueryParams = {
      ...this.toQueryParams(this.filters()),
      page,
      limit: PAGE_SIZE
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
          this.errorMessage.set(this.extractErrorMessage(error, 'Unable to load books right now.'));
        }
      });
  }

  applyFilters(filters: AdminBookFilters): void {
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

  /** Creates a book, then reloads page 1 so the new row shows up regardless of current filters/page. */
  create(payload: BookCreatePayload, onSuccess: () => void): void {
    this.actionPendingBarcode.set(payload.barcode);
    this.actionError.set(null);

    this.bookApi
      .create(payload)
      .pipe(finalize(() => this.actionPendingBarcode.set(null)))
      .subscribe({
        next: () => {
          onSuccess();
          this.loadPage(1);
        },
        error: (error: HttpErrorResponse) => {
          this.actionError.set(this.extractErrorMessage(error, 'Unable to create this book right now.'));
        }
      });
  }

  /** Updates a book, then reloads the current page so the row reflects the saved values. */
  update(payload: BookUpdatePayload, onSuccess: () => void): void {
    this.actionPendingBarcode.set(payload.barcode);
    this.actionError.set(null);

    this.bookApi
      .update(payload)
      .pipe(finalize(() => this.actionPendingBarcode.set(null)))
      .subscribe({
        next: () => {
          onSuccess();
          this.loadPage(this.currentPage());
        },
        error: (error: HttpErrorResponse) => {
          this.actionError.set(this.extractErrorMessage(error, 'Unable to save this book right now.'));
        }
      });
  }

  remove(book: Book): void {
    this.actionPendingBarcode.set(book.barcode);
    this.actionError.set(null);

    this.bookApi
      .remove(book.barcode)
      .pipe(finalize(() => this.actionPendingBarcode.set(null)))
      .subscribe({
        next: () => {
          // If that was the last row on this page (and we're not on page 1), step back a page;
          // otherwise just reload the current page.
          const isLastRowOnPage = this.books().length === 1 && this.currentPage() > 1;
          this.loadPage(isLastRowOnPage ? this.currentPage() - 1 : this.currentPage());
        },
        error: (error: HttpErrorResponse) => {
          this.actionError.set(this.extractErrorMessage(error, 'Unable to delete this book right now.'));
        }
      });
  }

  private toQueryParams(filters: AdminBookFilters): BookQueryParams {
    return {
      title: filters.title.trim() || undefined,
      author: filters.author.trim() || undefined,
      genre: filters.genre.trim() || undefined
    };
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? fallback;
  }
}