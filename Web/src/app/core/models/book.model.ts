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

export interface BookModel extends Book {
  id: string;
}

export interface Pagination<T> {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  pageCount: number;
  items: T[];
}

export interface BookQueryParams {
  title?: string;
  author?: string;
  genre?: string;
  subject?: string;
  page?: number;
  limit?: number;
}

export interface BookListResponse {
  message: string;
  page: Pagination<BookModel>;
}

export interface BookQueryResponse {
  message: string;
  page: Pagination<BookModel>;
}

export type BookCreatePayload = Book;

export type BookUpdatePayload = Book & { id: string };

export interface BookCreateResponse {
  message: string;
  savedBook: BookModel;
}

export interface BookUpdateResponse {
  message: string;
  updatedBook: BookModel;
}

export interface BookDeleteResponse {
  message: string;
}