import { LoanRecord } from "./LoanRecord";
import { User } from "./User";

export type Book = {
    _id : string;
    barcode: string;
    cover: string;
    title: string;
    authors: string[];
    description: string;
    subjects: string[];
    publicationDate: Date;
    publisher: string;
    pages: number;
    genre: string;
    records:LoanRecord[];
}

export type CheckoutBookPayload = {
    book:Book;
    libraryCard:string;
    employee:User;
}

export type  CheckinBookPayload = {
    book:Book;
    employee:User;
}