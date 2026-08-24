import { supabase, unwrap } from '../config/supabaseClient';
import { ILibraryCard } from '../models/LibraryCard';
import { IUserModel } from './UserDao';

export interface ILibraryCardModel extends ILibraryCard {
  id: string;
}

export interface ILibraryCardWithUser extends ILibraryCardModel {
  userDetails: IUserModel;
}

const TABLE = 'library_cards';
const SELECT_WITH_USER = '*, userDetails:users(*)';

type Row = Record<string, unknown>;

export async function find(): Promise<ILibraryCardWithUser[]> {
  const rows = await unwrap<Row[]>(supabase.from(TABLE).select(SELECT_WITH_USER));
  return (rows || []).map((row) => ({ ...row, user: row.user_id }) as ILibraryCardWithUser);
}

export async function insert(card: ILibraryCard): Promise<ILibraryCardModel> {
  const row = await unwrap<Row>(
    supabase.from(TABLE).insert({ user_id: card.user }).select().single(),
  );
  return { ...row, user: row?.user_id } as ILibraryCardModel;
}

export async function findByUserId(userId: string): Promise<ILibraryCardWithUser | null> {
  const row = await unwrap<Row>(
    supabase.from(TABLE).select(SELECT_WITH_USER).eq('user_id', userId).maybeSingle(),
  );
  return row ? ({ ...row, user: row.user_id } as ILibraryCardWithUser) : null;
}

export async function findById(id: string): Promise<ILibraryCardWithUser | null> {
  const row = await unwrap<Row>(
    supabase.from(TABLE).select(SELECT_WITH_USER).eq('id', id).maybeSingle(),
  );
  return row ? ({ ...row, user: row.user_id } as ILibraryCardWithUser) : null;
}