import { supabase, unwrap } from "../config/supabaseClient";
import { ILibraryCard } from "../models/LibraryCard";
import { IUserModel } from "./UserDao";

export interface ILibraryCardModel extends ILibraryCard {
    id: string;
}

// user comes back joined/expanded, matching what `.populate('user')` used to give
export interface ILibraryCardWithUser extends ILibraryCardModel {
    userDetails: IUserModel;
}

const TABLE = "library_cards";
const SELECT_WITH_USER = "*, userDetails:users(*)";

export async function find(): Promise<ILibraryCardWithUser[]> {
    const rows = await unwrap<any[]>(supabase.from(TABLE).select(SELECT_WITH_USER));
    return (rows || []).map((row) => ({ ...row, user: row.user_id }));
}

export async function insert(card: ILibraryCard): Promise<ILibraryCardModel> {
    // ILibraryCard.user is the user's id; the DB column is user_id
    const row = await unwrap<any>(
        supabase.from(TABLE).insert({ user_id: card.user }).select().single()
    );
    return { ...row, user: row.user_id };
}

export async function findByUserId(userId: string): Promise<ILibraryCardWithUser | null> {
    const row = await unwrap<any>(
        supabase.from(TABLE).select(SELECT_WITH_USER).eq("user_id", userId).maybeSingle()
    );
    return row ? { ...row, user: row.user_id } : null;
}

export async function findById(id: string): Promise<ILibraryCardWithUser | null> {
    const row = await unwrap<any>(
        supabase.from(TABLE).select(SELECT_WITH_USER).eq("id", id).maybeSingle()
    );
    return row ? { ...row, user: row.user_id } : null;
}