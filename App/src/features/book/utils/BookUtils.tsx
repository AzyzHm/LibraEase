import { Book } from "../../../models/Book";
import { LoanRecord } from "../../../models/LoanRecord";
import { BookCheckin } from "../components/BookCheckin/BookCheckin";
import { BookCheckout } from "../components/BookCheckout/BookCheckout";

export function mapAuthorsToString(book: Book): string {
  let authors = "";

  for(let author of book.authors) {
    authors += author + ", ";
  }

  return authors.slice(0, authors.length - 2);
}

export function determineLoanModalContent(records: LoanRecord[]): JSX.Element {
  if(records.length === 0 || records[0].status === "AVAILABLE") {
      return <BookCheckout />;
  }
  return <BookCheckin />;
}