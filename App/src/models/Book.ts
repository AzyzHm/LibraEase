import { LoanRecord } from "./LoanRecord";
import { User } from "./User";

export type Book = {
    id : string;
    barcode: string;
    cover: string;
    title: string;
    authors: string[];
    description: string;
    subjects: string[];
    publicationDate: Date | null;
    publisher: string;
    pages: number | null;
    genre: string;
}

export type CheckoutBookPayload = {
    book:Book;
    libraryCard:string;
    employee:User;
}

export type  CheckinBookPayload = {
    book:Book;
    employee:User;
    record:LoanRecord;
}