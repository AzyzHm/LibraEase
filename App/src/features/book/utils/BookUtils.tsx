import { Book } from "../../../models/Book";
import { BookCheckin } from "../components/BookCheckin/BookCheckin";
import { BookCheckout } from "../components/BookCheckout/BookCheckout";

export function mapAuthorsToString(book: Book): string {
  let authors = "";

  for(let author of book.authors) {
    authors += author + ", ";
  }

  return authors.slice(0, authors.length - 2);
}

export function determineLoanModalContent(book: Book): JSX.Element {
  if(book.records.length === 0 || book.records[0].status === "AVAILABLE") {
      return <BookCheckout />;
  }
  return <BookCheckin />;
}