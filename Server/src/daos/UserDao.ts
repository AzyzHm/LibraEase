import { supabase, unwrap } from "../config/supabaseClient";
import { IUser } from "../models/User";

export interface IUserModel extends IUser {
    id: string;
}

const TABLE = "users";

export async function find(): Promise<IUserModel[]> {
    const rows = await unwrap<any[]>(supabase.from(TABLE).select("*"));
    return (rows || []) as IUserModel[];
}

export async function findById(id: string): Promise<IUserModel | null> {
    return await unwrap<any>(supabase.from(TABLE).select("*").eq("id", id).maybeSingle());
}

export async function findByEmail(email: string): Promise<IUserModel | null> {
    return await unwrap<any>(supabase.from(TABLE).select("*").eq("email", email).maybeSingle());
}

export async function insert(user: IUser): Promise<IUserModel> {
    return await unwrap<any>(supabase.from(TABLE).insert(user).select().single());
}

export async function updateById(id: string, user: Partial<IUser>): Promise<IUserModel | null> {
    return await unwrap<any>(supabase.from(TABLE).update(user).eq("id", id).select().maybeSingle());
}

export async function removeById(id: string): Promise<IUserModel | null> {
    return await unwrap<any>(supabase.from(TABLE).delete().eq("id", id).select().maybeSingle());
}
