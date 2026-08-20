/**
 * One-off script to bulk-insert books.json into the Supabase `books` table.
 *
 * Usage:
 *   1. Put books.json at the root of Server/ (or update BOOKS_JSON_PATH below).
 *   2. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Server/.env
 *   3. npm run import:books
 *
 * NOTE: field names below (barcode, cover, title, authors, publicationDate, ...)
 * assume books.json matches the shape of IBook in src/models/Book.ts.
 * Once you share the actual books.json, adjust the `mapBook` function to match
 * its real field names.
 */
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const BOOKS_JSON_PATH = path.join(__dirname, "..", "books.json");
const CHUNK_SIZE = 500;

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function mapBook(raw: any) {
    return {
        barcode: raw.barcode,
        cover: raw.cover,
        title: raw.title,
        authors: raw.authors,
        description: raw.description,
        subjects: raw.subjects,
        publication_date: raw.publicationDate,
        publisher: raw.publisher,
        pages: raw.pages,
        genre: raw.genre,
    };
}

async function run() {
    if (!fs.existsSync(BOOKS_JSON_PATH)) {
        console.error(`Could not find books.json at ${BOOKS_JSON_PATH}`);
        process.exit(1);
    }

    const raw = JSON.parse(fs.readFileSync(BOOKS_JSON_PATH, "utf-8"));
    const books: any[] = Array.isArray(raw) ? raw : raw.books;

    if (!Array.isArray(books)) {
        console.error("Expected books.json to be an array (or an object with a top-level `books` array).");
        process.exit(1);
    }

    const rows = books.map(mapBook);
    console.log(`Importing ${rows.length} books in chunks of ${CHUNK_SIZE}...`);

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from("books").insert(chunk);
        if (error) {
            console.error(`Chunk ${i}-${i + chunk.length} failed:`, error.message);
        } else {
            console.log(`Inserted rows ${i}-${i + chunk.length}`);
        }
    }

    console.log("Done.");
}

run();
