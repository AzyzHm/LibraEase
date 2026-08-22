import * as LoanRecordDao from '../../../src/daos/LoanRecordDao';
import { ILoanRecordModel } from '../../../src/daos/LoanRecordDao';
import * as LoanRecordService from '../../../src/services/LoanRecordService';
import { ILoanRecord } from '../../../src/models/LoanRecord';
import {
  LoanRecordDoesNotExistError,
  BookAlreadyLoanedError,
} from '../../../src/utils/LibraryErrors';

jest.mock('../../../src/daos/LoanRecordDao');

const mockedLoanRecordDao = LoanRecordDao as jest.Mocked<typeof LoanRecordDao>;

function makeRecord(overrides: Partial<ILoanRecordModel> = {}): ILoanRecordModel {
  return {
    id: 'record-1',
    status: 'LOANED',
    loanedDate: new Date('2026-01-01'),
    dueDate: new Date('2026-01-15'),
    returnedDate: null,
    patron: 'patron-1',
    employeeOut: 'employee-1',
    employeeIn: null,
    item: 'book-1',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoanRecordService.generateRecord', () => {
  it('inserts the record via the DAO and returns the created record', async () => {
    const payload: ILoanRecord = {
      status: 'LOANED',
      loanedDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
      patron: 'patron-1',
      employeeOut: 'employee-1',
      item: 'book-1',
    };
    const created = makeRecord();
    mockedLoanRecordDao.insert.mockResolvedValue(created);

    const result = await LoanRecordService.generateRecord(payload);

    expect(mockedLoanRecordDao.insert).toHaveBeenCalledWith(payload);
    expect(result).toEqual(created);
  });
});

describe('LoanRecordService.modifyRecord', () => {
  it('updates the record by id and returns the updated record', async () => {
    const updated = makeRecord({ status: 'AVAILABLE', returnedDate: new Date('2026-01-10') });
    mockedLoanRecordDao.updateById.mockResolvedValue(updated);

    const toUpdate = makeRecord({ status: 'AVAILABLE', returnedDate: new Date('2026-01-10') });
    const result = await LoanRecordService.modifyRecord(toUpdate);

    expect(mockedLoanRecordDao.updateById).toHaveBeenCalledWith('record-1', toUpdate);
    expect(result).toEqual(updated);
  });

  it('throws LoanRecordDoesNotExistError when the DAO finds nothing to update', async () => {
    mockedLoanRecordDao.updateById.mockResolvedValue(null);

    await expect(LoanRecordService.modifyRecord(makeRecord())).rejects.toThrow(
      LoanRecordDoesNotExistError,
    );
  });

  // Regression: marking a book returned via self-service (no staff member
  // involved) sends employeeOut through as null rather than omitting it.
  // The service must pass that through untouched instead of dropping it
  // or rejecting it before it reaches the DAO.
  it('passes through employeeOut: null unchanged when marking a book returned', async () => {
    const markedReturned = makeRecord({
      status: 'AVAILABLE',
      returnedDate: new Date('2026-01-10'),
      employeeOut: null,
    });
    mockedLoanRecordDao.updateById.mockResolvedValue(markedReturned);

    const toUpdate = makeRecord({
      status: 'AVAILABLE',
      returnedDate: new Date('2026-01-10'),
      employeeOut: null,
    });
    const result = await LoanRecordService.modifyRecord(toUpdate);

    expect(mockedLoanRecordDao.updateById).toHaveBeenCalledWith(
      'record-1',
      expect.objectContaining({ employeeOut: null }),
    );
    expect(result.employeeOut).toBeNull();
  });
});

describe('LoanRecordService.findAllRecords', () => {
  it('returns every record from the DAO', async () => {
    const records = [makeRecord(), makeRecord({ id: 'record-2' })];
    mockedLoanRecordDao.find.mockResolvedValue(records);

    const result = await LoanRecordService.findAllRecords();

    expect(result).toEqual(records);
  });
});

describe('LoanRecordService.queryRecords', () => {
  it('delegates to findByProperty with the given property/value pair', async () => {
    const records = [makeRecord()];
    mockedLoanRecordDao.findByProperty.mockResolvedValue(records as any);

    const result = await LoanRecordService.queryRecords({ property: 'patron', value: 'patron-1' });

    expect(mockedLoanRecordDao.findByProperty).toHaveBeenCalledWith('patron', 'patron-1');
    expect(result).toEqual(records);
  });
});

describe('LoanRecordService.isItemAvailable', () => {
  it('returns true when there is no active (unreturned, LOANED) record for the item', async () => {
    mockedLoanRecordDao.findByItem.mockResolvedValue([
      makeRecord({ status: 'AVAILABLE', returnedDate: new Date() }) as any,
    ]);

    const result = await LoanRecordService.isItemAvailable('book-1');

    expect(result).toBe(true);
  });

  it('returns false when a LOANED record with no returnedDate exists', async () => {
    mockedLoanRecordDao.findByItem.mockResolvedValue([
      makeRecord({ status: 'LOANED', returnedDate: null }) as any,
    ]);

    const result = await LoanRecordService.isItemAvailable('book-1');

    expect(result).toBe(false);
  });

  it('returns true when the item has never been loaned', async () => {
    mockedLoanRecordDao.findByItem.mockResolvedValue([]);

    const result = await LoanRecordService.isItemAvailable('book-1');

    expect(result).toBe(true);
  });
});

describe('LoanRecordService.selfCheckout', () => {
  it('creates a LOANED record when the item is available', async () => {
    mockedLoanRecordDao.findByItem.mockResolvedValue([]);
    const created = makeRecord({ employeeOut: undefined });
    mockedLoanRecordDao.insert.mockResolvedValue(created);

    const dueDate = new Date('2026-02-01');
    const result = await LoanRecordService.selfCheckout('patron-1', 'book-1', dueDate);

    expect(mockedLoanRecordDao.insert).toHaveBeenCalledWith({
      status: 'LOANED',
      loanedDate: expect.any(Date),
      dueDate,
      patron: 'patron-1',
      item: 'book-1',
    });
    expect(result).toEqual(created);
  });

  it('throws BookAlreadyLoanedError when the item is currently loaned out', async () => {
    mockedLoanRecordDao.findByItem.mockResolvedValue([
      makeRecord({ status: 'LOANED', returnedDate: null }) as any,
    ]);

    await expect(
      LoanRecordService.selfCheckout('patron-1', 'book-1', new Date('2026-02-01')),
    ).rejects.toThrow(BookAlreadyLoanedError);
    expect(mockedLoanRecordDao.insert).not.toHaveBeenCalled();
  });
});
