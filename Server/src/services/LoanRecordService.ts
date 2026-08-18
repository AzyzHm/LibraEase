import * as LoanRecordDao from "../daos/LoanRecordDao";
import { ILoanRecordModel } from "../daos/LoanRecordDao";
import { ILoanRecord } from "../models/LoanRecord";
import { LoanRecordDoesNotExistError } from "../utils/LibraryErrors";

// NOTE: the old Mongo version also pushed a copy of every record into
// Book.records[]. That embedded array doesn't exist anymore (see
// models/Book.ts) — a loan record's link to its book is just the
// `item` foreign key, and you read a book's loans via a join
// (LoanRecordDao.findByItem), not by re-reading the book document.

export async function generateRecord(record: ILoanRecord): Promise<ILoanRecordModel> {
    return await LoanRecordDao.insert(record);
}

export async function modifyRecord(record: ILoanRecordModel): Promise<ILoanRecordModel> {
    const updated = await LoanRecordDao.updateById(record.id, record);
    if (updated) return updated;
    throw new LoanRecordDoesNotExistError("Record does not exist");
}

export async function findAllRecords(): Promise<ILoanRecordModel[]> {
    return await LoanRecordDao.find();
}

export async function queryRecords(params: { property: string; value: string | Date }): Promise<ILoanRecordModel[]> {
    return await LoanRecordDao.findByProperty(params.property, params.value);
}
