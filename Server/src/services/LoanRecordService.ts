import * as LoanRecordDao from '../daos/LoanRecordDao';
import { ILoanRecordModel } from '../daos/LoanRecordDao';
import { ILoanRecord } from '../models/LoanRecord';
import { LoanRecordDoesNotExistError, BookAlreadyLoanedError } from '../utils/LibraryErrors';

export async function generateRecord(record: ILoanRecord): Promise<ILoanRecordModel> {
  if (record.status === 'LOANED') {
    const available = await isItemAvailable(record.item);
    if (!available) {
      throw new BookAlreadyLoanedError('This book is currently loaned out');
    }
  }

  return await LoanRecordDao.insert(record);
}

export async function modifyRecord(record: ILoanRecordModel): Promise<ILoanRecordModel> {
  const updated = await LoanRecordDao.updateById(record.id, record);
  if (updated) return updated;
  throw new LoanRecordDoesNotExistError('Record does not exist');
}

export async function findAllRecords(): Promise<ILoanRecordModel[]> {
  return await LoanRecordDao.find();
}

export async function queryRecords(params: {
  property: string;
  value: string | Date;
}): Promise<ILoanRecordModel[]> {
  return await LoanRecordDao.findByProperty(params.property, params.value);
}

export async function isItemAvailable(itemId: string): Promise<boolean> {
  const records = await LoanRecordDao.findByItem(itemId);
  return !records.some((record) => record.status === 'LOANED' && !record.returnedDate);
}

export async function selfCheckout(
  patronId: string,
  item: string,
  dueDate: Date,
): Promise<ILoanRecordModel> {
  const available = await isItemAvailable(item);
  if (!available) {
    throw new BookAlreadyLoanedError('This book is currently loaned out');
  }

  const record: ILoanRecord = {
    status: 'LOANED',
    loanedDate: new Date(),
    dueDate,
    patron: patronId,
    item,
  };

  return await LoanRecordDao.insert(record);
}
