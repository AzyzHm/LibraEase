import { BookModel } from './book.model';

export type LoanStatus = 'AVAILABLE' | 'LOANED';

/** Mirrors Server/src/models/LoanRecord.ts (ILoanRecord). */
export interface LoanRecord {
  status: LoanStatus;
  loanedDate: string;
  dueDate: string;
  returnedDate: string;
  patron: string;
  employeeOut: string;
  employeeIn?: string;
  item: string;
}

export interface LoanRecordModel extends LoanRecord {
  id: string;
}

/** GET /loan and POST /loan/query both join the borrowed book via `itemDetails`. */
export interface LoanRecordWithItem extends LoanRecordModel {
  itemDetails: BookModel;
}

export interface LoanQueryResponse {
  message: string;
  records: LoanRecordWithItem[];
}