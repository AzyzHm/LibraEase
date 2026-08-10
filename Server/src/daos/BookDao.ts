import { supabase, unwrap } from "../config/supabaseClient";
import { IBook } from "../models/Book";

export interface IBookModel extends IBook {
    id: string;
}

const TABLE = "books";

// DB columns are snake_case (publication_date); the app stays camelCase
// (publicationDate). These two helpers do the translation at the boundary.
function toRow(book: Partial<IBook>): Record<string, any> {
    const { publicationDate, ...rest } = book;
    const row: Record<string, any> = { ...rest };
    if (publicationDate !== undefined) row.publication_date = publicationDate;
    return row;
}

function fromRow(row: any): IBookModel {
    if (!row) return row;
    const { publication_date, ...rest } = row;
    return { ...rest, publicationDate: publication_date, records: rest.records || [] } as IBookModel;
}

export async function find(): Promise<IBookModel[]> {
    const rows = await unwrap<any[]>(supabase.from(TABLE).select("*"));
    return (rows || []).map(fromRow);
}

export async function findById(id: string): Promise<IBookModel | null> {
    const row = await unwrap<any>(supabase.from(TABLE).select("*").eq("id", id).maybeSingle());
    return row ? fromRow(row) : null;
}

export async function findOneByBarcode(barcode: string): Promise<IBookModel | null> {
    const row = await unwrap<any>(supabase.from(TABLE).select("*").eq("barcode", barcode).maybeSingle());
    return row ? fromRow(row) : null;
}

export async function insert(book: IBook): Promise<IBookModel> {
    const row = await unwrap<any>(supabase.from(TABLE).insert(toRow(book)).select().single());
    return fromRow(row);
}

export async function updateByBarcode(barcode: string, book: Partial<IBook>): Promise<IBookModel | null> {
    const row = await unwrap<any>(
        supabase.from(TABLE).update(toRow(book)).eq("barcode", barcode).select().maybeSingle()
    );
    return row ? fromRow(row) : null;
}

export async function removeByBarcode(barcode: string): Promise<IBookModel | null> {
    const row = await unwrap<any>(supabase.from(TABLE).delete().eq("barcode", barcode).select().maybeSingle());
    return row ? fromRow(row) : null;
}

// Real server-side filtering + pagination, replacing the old
// "load everything into memory and filter with .includes()" approach.
export async function search(params: {
    page: number;
    limit: number;
    title?: string;
    barcode?: string;
    description?: string;
    author?: string;
    subject?: string;
    genre?: string;
}): Promise<{ items: IBookModel[]; totalCount: number }> {
    let query = supabase.from(TABLE).select("*", { count: "exact" });

    if (params.barcode) query = query.ilike("barcode", `%${params.barcode}%`);
    if (params.title) query = query.ilike("title", `%${params.title}%`);
    if (params.description) query = query.ilike("description", `%${params.description}%`);
    if (params.genre) query = query.ilike("genre", `%${params.genre}%`);
    if (params.author) query = query.contains("authors", [params.author]);
    if (params.subject) query = query.contains("subjects", [params.subject]);

    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { items: (data || []).map(fromRow), totalCount: count || 0 };
}
