import * as LibraryCardDao from '../../../src/daos/LibraryCardDao';
import { ILibraryCardWithUser } from '../../../src/daos/LibraryCardDao';
import * as LibraryCardService from '../../../src/services/LibraryCardService';
import { ILibraryCard } from '../../../src/models/LibraryCard';
import { LibraryCardDoesNotExistError } from '../../../src/utils/LibraryErrors';

jest.mock('../../../src/daos/LibraryCardDao');

const mockedLibraryCardDao = LibraryCardDao as jest.Mocked<typeof LibraryCardDao>;

function makeCard(overrides: Partial<ILibraryCardWithUser> = {}): ILibraryCardWithUser {
  return {
    id: 'card-1',
    user: 'user-1',
    userDetails: {
      id: 'user-1',
      type: 'PATRON',
      firstname: 'Jane',
      lastname: 'Doe',
      email: 'jane@example.com',
      password: 'hashed-password',
      status: 'APPROVED',
    },
    ...overrides,
  } as ILibraryCardWithUser;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LibraryCardService.findAllLibraryCards', () => {
  it('returns every card from the DAO', async () => {
    const cards = [makeCard(), makeCard({ id: 'card-2' })];
    mockedLibraryCardDao.find.mockResolvedValue(cards);

    const result = await LibraryCardService.findAllLibraryCards();

    expect(result).toEqual(cards);
  });
});

describe('LibraryCardService.registerLibraryCard', () => {
  const payload: ILibraryCard = { user: 'user-1' };

  it('inserts the card then re-fetches it by user id', async () => {
    const created = makeCard();
    mockedLibraryCardDao.insert.mockResolvedValue(created);
    mockedLibraryCardDao.findByUserId.mockResolvedValue(created);

    const result = await LibraryCardService.registerLibraryCard(payload);

    expect(mockedLibraryCardDao.insert).toHaveBeenCalledWith(payload);
    expect(mockedLibraryCardDao.findByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(created);
  });

  it('throws LibraryCardDoesNotExistError if the re-fetch after insert finds nothing', async () => {
    mockedLibraryCardDao.insert.mockResolvedValue(makeCard());
    mockedLibraryCardDao.findByUserId.mockResolvedValue(null);

    await expect(LibraryCardService.registerLibraryCard(payload)).rejects.toThrow(
      LibraryCardDoesNotExistError,
    );
  });

  it('on a unique-violation (23505), returns the existing card for that user instead of failing', async () => {
    const existing = makeCard();
    mockedLibraryCardDao.insert.mockRejectedValue({ code: '23505', message: 'duplicate key' });
    mockedLibraryCardDao.findByUserId.mockResolvedValue(existing);

    const result = await LibraryCardService.registerLibraryCard(payload);

    expect(result).toEqual(existing);
  });

  it('re-throws a unique-violation if no existing card can be found either', async () => {
    mockedLibraryCardDao.insert.mockRejectedValue({ code: '23505', message: 'duplicate key' });
    mockedLibraryCardDao.findByUserId.mockResolvedValue(null);

    await expect(LibraryCardService.registerLibraryCard(payload)).rejects.toMatchObject({
      code: '23505',
    });
  });

  it('re-throws any non-unique-violation error from the DAO', async () => {
    mockedLibraryCardDao.insert.mockRejectedValue(new Error('connection reset'));

    await expect(LibraryCardService.registerLibraryCard(payload)).rejects.toThrow(
      'connection reset',
    );
  });
});

describe('LibraryCardService.findLibraryCard', () => {
  it('returns the card when found by id', async () => {
    const card = makeCard();
    mockedLibraryCardDao.findById.mockResolvedValue(card);

    const result = await LibraryCardService.findLibraryCard('card-1');

    expect(mockedLibraryCardDao.findById).toHaveBeenCalledWith('card-1');
    expect(result).toEqual(card);
  });

  it('throws LibraryCardDoesNotExistError when not found', async () => {
    mockedLibraryCardDao.findById.mockResolvedValue(null);

    await expect(LibraryCardService.findLibraryCard('missing')).rejects.toThrow(
      LibraryCardDoesNotExistError,
    );
  });
});

describe('LibraryCardService.findLibraryCardByUserId', () => {
  it('returns the card when found by user id', async () => {
    const card = makeCard();
    mockedLibraryCardDao.findByUserId.mockResolvedValue(card);

    const result = await LibraryCardService.findLibraryCardByUserId('user-1');

    expect(mockedLibraryCardDao.findByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(card);
  });

  it('throws LibraryCardDoesNotExistError when the user has no card', async () => {
    mockedLibraryCardDao.findByUserId.mockResolvedValue(null);

    await expect(LibraryCardService.findLibraryCardByUserId('user-1')).rejects.toThrow(
      LibraryCardDoesNotExistError,
    );
  });
});