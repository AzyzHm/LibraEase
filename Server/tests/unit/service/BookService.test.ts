import * as BookDao from '../../../src/daos/BookDao';
import { IBookModel } from '../../../src/daos/BookDao';
import * as BookService from '../../../src/services/BookService';
import { IBook } from '../../../src/models/Book';
import { BookDoesNotExistError } from '../../../src/utils/LibraryErrors';

jest.mock('../../../src/daos/BookDao');

const mockedBookDao = BookDao as jest.Mocked<typeof BookDao>;

function makeBook(overrides: Partial<IBookModel> = {}): IBookModel {
  return {
    id: 'book-1',
    barcode: '0306406152',
    cover: 'cover.jpg',
    title: 'The Pragmatic Programmer',
    authors: ['Andrew Hunt'],
    description: 'A great book',
    subjects: ['Software'],
    publicationDate: new Date('2020-01-01'),
    publisher: 'Addison-Wesley',
    pages: 352,
    genre: 'Technology',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BookService.findAllBooks', () => {
  it('returns every book from the DAO', async () => {
    const books = [makeBook(), makeBook({ id: 'book-2', barcode: '0132350882' })];
    mockedBookDao.find.mockResolvedValue(books);

    const result = await BookService.findAllBooks();

    expect(mockedBookDao.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual(books);
  });
});

describe('BookService.findBookById', () => {
  it('returns the book when the DAO finds it', async () => {
    const book = makeBook();
    mockedBookDao.findById.mockResolvedValue(book);

    const result = await BookService.findBookById('book-1');

    expect(mockedBookDao.findById).toHaveBeenCalledWith('book-1');
    expect(result).toEqual(book);
  });

  it('throws BookDoesNotExistError when the DAO returns null', async () => {
    mockedBookDao.findById.mockResolvedValue(null);

    await expect(BookService.findBookById('missing')).rejects.toThrow(BookDoesNotExistError);
  });
});

describe('BookService.registerBook', () => {
  it('inserts the book via the DAO and returns the created record', async () => {
    const payload: IBook = makeBook();
    const created = makeBook();
    mockedBookDao.insert.mockResolvedValue(created);

    const result = await BookService.registerBook(payload);

    expect(mockedBookDao.insert).toHaveBeenCalledWith(payload);
    expect(result).toEqual(created);
  });
});

describe('BookService.modifyBook', () => {
  it('updates the book by barcode and returns the updated record', async () => {
    const updated = makeBook({ title: 'Updated Title' });
    mockedBookDao.updateByBarcode.mockResolvedValue(updated);

    const result = await BookService.modifyBook({ barcode: '0306406152', title: 'Updated Title' });

    expect(mockedBookDao.updateByBarcode).toHaveBeenCalledWith('0306406152', {
      barcode: '0306406152',
      title: 'Updated Title',
    });
    expect(result).toEqual(updated);
  });

  it('throws BookDoesNotExistError when there is nothing to update', async () => {
    mockedBookDao.updateByBarcode.mockResolvedValue(null);

    await expect(BookService.modifyBook({ barcode: 'missing' })).rejects.toThrow(
      BookDoesNotExistError,
    );
  });
});

describe('BookService.removeBook', () => {
  it('returns a success message when the DAO deletes the book', async () => {
    mockedBookDao.removeByBarcode.mockResolvedValue(makeBook());

    const result = await BookService.removeBook('0306406152');

    expect(mockedBookDao.removeByBarcode).toHaveBeenCalledWith('0306406152');
    expect(result).toBe('Successfully deleted book');
  });

  it('throws BookDoesNotExistError when there is nothing to delete', async () => {
    mockedBookDao.removeByBarcode.mockResolvedValue(null);

    await expect(BookService.removeBook('missing')).rejects.toThrow(BookDoesNotExistError);
  });
});

describe('BookService.queryBooks', () => {
  it('builds pagination metadata from the DAO search result', async () => {
    const items = [makeBook(), makeBook({ id: 'book-2' })];
    mockedBookDao.search.mockResolvedValue({ items, totalCount: 42 });

    const result = await BookService.queryBooks(2, 10, 'title', undefined, undefined, 'author');

    expect(mockedBookDao.search).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      title: 'title',
      barcode: undefined,
      description: undefined,
      author: 'author',
      subject: undefined,
      genre: undefined,
    });
    expect(result).toEqual({
      totalCount: 42,
      currentPage: 2,
      totalPages: 5,
      limit: 10,
      pageCount: 2,
      items,
    });
  });

  it("rounds totalPages up when totalCount doesn't divide evenly by limit", async () => {
    mockedBookDao.search.mockResolvedValue({ items: [], totalCount: 1 });

    const result = await BookService.queryBooks(1, 25);

    expect(result.totalPages).toBe(1);
  });
});
