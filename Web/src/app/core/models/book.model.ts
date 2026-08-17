/** Mirrors Server/src/models/Book.ts (IBook). */
export interface Book {
  barcode: string;
  cover: string;
  title: string;
  authors: string[];
  description: string;
  subjects: string[];
  publicationDate: string;
  publisher: string;
  pages: number;
  genre: string;
}

/** The row as returned by the backend - adds the Supabase row id. */
export interface BookModel extends Book {
  id: string;
}

/** Mirrors Server/src/models/Pagination.ts (IPagination<T>). */
export interface Pagination<T> {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  pageCount: number;
  items: T[];
}

/** Query params accepted by GET /book/query. */
export interface BookQueryParams {
  title?: string;
  author?: string;
  genre?: string;
  subject?: string;
  page?: number;
  limit?: number;
}

/** Response envelope for GET /book. */
export interface BookListResponse {
  message: string;
  count: number;
  books: BookModel[];
}

/** Response envelope for GET /book/query. */
export interface BookQueryResponse {
  message: string;
  page: Pagination<BookModel>;
}

export type BookCreatePayload = Book;

export type BookUpdatePayload = Book & { id: string };

/** Response envelope for POST /book. */
export interface BookCreateResponse {
  message: string;
  savedBook: BookModel;
}

/** Response envelope for PUT /book. */
export interface BookUpdateResponse {
  message: string;
  updatedBook: BookModel;
}

/** Response envelope for DELETE /book/:barcode. */
export interface BookDeleteResponse {
  message: string;
}