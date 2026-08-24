import { supabase, unwrap } from '../config/supabaseClient';
import { ILoanRecord } from '../models/LoanRecord';
import { IBookModel } from './BookDao';

export interface ILoanRecordModel extends ILoanRecord {
  id: string;
}

export interface ILoanRecordWithItem extends ILoanRecordModel {
  itemDetails: IBookModel;
}

const TABLE = 'loan_records';
const SELECT_WITH_ITEM = '*, itemDetails:books(*)';

const TO_ROW_MAP: Record<string, string> = {
  loanedDate: 'loaned_date',
  dueDate: 'due_date',
  returnedDate: 'returned_date',
  employeeOut: 'employee_out',
  employeeIn: 'employee_in',
};
const FROM_ROW_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TO_ROW_MAP).map(([app, db]) => [db, app]),
);

type Row = Record<string, unknown>;

function toRow(record: Partial<ILoanRecord>): Row {
  const row: Row = {};
  for (const [key, value] of Object.entries(record)) {
    row[TO_ROW_MAP[key] || key] = value;
  }
  return row;
}

function fromRow(row: Row | null): ILoanRecordModel {
  if (!row) return row as unknown as ILoanRecordModel;
  const mapped: Row = {};
  for (const [key, value] of Object.entries(row)) {
    mapped[FROM_ROW_MAP[key] || key] = value;
  }
  return mapped as unknown as ILoanRecordModel;
}

export async function insert(record: ILoanRecord): Promise<ILoanRecordModel> {
  const row = await unwrap<Row>(supabase.from(TABLE).insert(toRow(record)).select().single());
  return fromRow(row);
}

export async function updateById(
  id: string,
  record: Partial<ILoanRecord>,
): Promise<ILoanRecordModel | null> {
  const row = await unwrap<Row>(
    supabase.from(TABLE).update(toRow(record)).eq('id', id).select().maybeSingle(),
  );
  return row ? fromRow(row) : null;
}

export async function find(): Promise<ILoanRecordModel[]> {
  const rows = await unwrap<Row[]>(supabase.from(TABLE).select('*'));
  return (rows || []).map(fromRow);
}

export async function findByItem(bookId: string): Promise<ILoanRecordWithItem[]> {
  const rows = await unwrap<Row[]>(
    supabase
      .from(TABLE)
      .select(SELECT_WITH_ITEM)
      .eq('item', bookId)
      .order('loaned_date', { ascending: false }),
  );
  return (rows || []).map(fromRow) as ILoanRecordWithItem[];
}

export async function findByProperty(
  property: string,
  value: string | Date,
): Promise<ILoanRecordWithItem[]> {
  const column = TO_ROW_MAP[property] || property;
  const rows = await unwrap<Row[]>(
    supabase
      .from(TABLE)
      .select(SELECT_WITH_ITEM)
      .eq(column, value as string | Date)
      .order('loaned_date', { ascending: false }),
  );
  return (rows || []).map(fromRow) as ILoanRecordWithItem[];
}
