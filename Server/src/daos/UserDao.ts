import { supabase, unwrap } from '../config/supabaseClient';
import { IUser } from '../models/User';

export interface IUserModel extends IUser {
  id: string;
}

const TABLE = 'users';

export async function find(): Promise<IUserModel[]> {
  const rows = await unwrap<IUserModel[]>(supabase.from(TABLE).select('*'));
  return rows || [];
}

export async function findById(id: string): Promise<IUserModel | null> {
  return await unwrap<IUserModel>(supabase.from(TABLE).select('*').eq('id', id).maybeSingle());
}

export async function findByEmail(email: string): Promise<IUserModel | null> {
  return await unwrap<IUserModel>(
    supabase.from(TABLE).select('*').eq('email', email).maybeSingle(),
  );
}

export async function insert(user: IUser): Promise<IUserModel> {
  const inserted = await unwrap<IUserModel>(supabase.from(TABLE).insert(user).select().single());
  return inserted as IUserModel;
}

export async function updateById(id: string, user: Partial<IUser>): Promise<IUserModel | null> {
  return await unwrap<IUserModel>(
    supabase.from(TABLE).update(user).eq('id', id).select().maybeSingle(),
  );
}

export async function removeById(id: string): Promise<IUserModel | null> {
  return await unwrap<IUserModel>(
    supabase.from(TABLE).delete().eq('id', id).select().maybeSingle(),
  );
}