import * as BookDao from '../daos/BookDao';
import { IBookModel } from '../daos/BookDao';
import { IBook } from '../models/Book';
import { IPagination } from '../models/Pagination';
import { BookDoesNotExistError, BookHasLoanHistoryError } from '../utils/LibraryErrors';

const FOREIGN_KEY_VIOLATION = '23503';

export async function findAllBooks(): Promise<IBookModel[]> {
  return await BookDao.find();
}

export async function findBookById(id: string): Promise<IBookModel> {
  const book = await BookDao.findById(id);
  if (book) return book;
  throw new BookDoesNotExistError('Book does not exist');
}

export async function modifyBook(book: Partial<IBook> & { barcode: string }): Promise<IBookModel> {
  const updated = await BookDao.updateByBarcode(book.barcode, book);
  if (updated) return updated;
  throw new BookDoesNotExistError('Item does not exist');
}

export async function registerBook(book: IBook): Promise<IBookModel> {
  return await BookDao.insert(book);
}

export async function removeBook(barcode: string): Promise<string> {
  try {
    const removed = await BookDao.removeByBarcode(barcode);
    if (removed) return 'Successfully deleted book';
    throw new BookDoesNotExistError('Book does not exist');
  } catch (error: unknown) {
    if (isForeignKeyViolation(error)) {
      throw new BookHasLoanHistoryError(
        'This book cannot be deleted because it still has loan records associated with it',
      );
    }
    throw error;
  }
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === FOREIGN_KEY_VIOLATION
  );
}

export async function queryBooks(
  page: number,
  limit: number,
  title?: string,
  barcode?: string,
  description?: string,
  author?: string,
  subject?: string,
  genre?: string,
): Promise<IPagination<IBookModel>> {
  const { items, totalCount } = await BookDao.search({
    page,
    limit,
    title,
    barcode,
    description,
    author,
    subject,
    genre,
  });

  return {
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    limit,
    pageCount: items.length,
    items,
  };
}
