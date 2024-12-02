import { Book } from "../../../models/Book";

export function mapAuthorsToString(book: Book): string {
  let authors = "";

  for(let author of book.authors) {
    authors += author + ", ";
  }

  return authors.slice(0, authors.length - 2);
}