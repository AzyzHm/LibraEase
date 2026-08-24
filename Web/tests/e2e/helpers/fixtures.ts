import { AuthUser, UserType } from './auth';

export interface BookModel {
  id: string;
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

export function makeBook(overrides: Partial<BookModel> = {}): BookModel {
  return {
    id: 'book-1',
    barcode: '0306406152',
    cover: '',
    title: 'The Pragmatic Programmer',
    authors: ['Andrew Hunt', 'David Thomas'],
    description: 'A classic on software craftsmanship.',
    subjects: ['Software', 'Engineering'],
    publicationDate: '2020-01-01T00:00:00.000Z',
    publisher: 'Addison-Wesley',
    pages: 352,
    genre: 'Technology',
    ...overrides,
  };
}

export function makePagination(items: BookModel[], overrides: Record<string, unknown> = {}) {
  return {
    items,
    currentPage: 1,
    totalPages: 1,
    totalCount: items.length,
    limit: 12,
    pageCount: 1,
    ...overrides,
  };
}

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminUser {
  id: string;
  type: UserType;
  firstname: string;
  lastname: string;
  email: string;
  status: UserStatus;
}

export function makeAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    status: 'PENDING',
    ...overrides,
  };
}

export function toAuthUser(admin: AdminUser): AuthUser {
  const { id, type, firstname, lastname, email } = admin;
  return { id, type, firstname, lastname, email };
}

export interface LoanRecordWithItem {
  id: string;
  status: 'AVAILABLE' | 'LOANED';
  loanedDate: string;
  dueDate: string;
  returnedDate: string;
  patron: string;
  employeeOut: string;
  item: string;
  itemDetails: BookModel;
}

export function makeLoan(overrides: Partial<LoanRecordWithItem> = {}): LoanRecordWithItem {
  return {
    id: 'loan-1',
    status: 'LOANED',
    loanedDate: '2026-01-01T00:00:00.000Z',
    dueDate: '2999-01-01T00:00:00.000Z',
    returnedDate: '',
    patron: 'user-1',
    employeeOut: 'emp-1',
    item: 'book-1',
    itemDetails: makeBook(),
    ...overrides,
  };
}

export interface LibraryCardWithUser {
  id: string;
  user: string;
  userDetails: AdminUser;
}

export function makeCard(overrides: Partial<LibraryCardWithUser> = {}): LibraryCardWithUser {
  return {
    id: 'card-1',
    user: 'user-1',
    userDetails: makeAdminUser({ status: 'APPROVED' }),
    ...overrides,
  };
}
