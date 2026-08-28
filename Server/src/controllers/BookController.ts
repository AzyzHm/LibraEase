import { Request, Response } from 'express';
import { registerBook, modifyBook, removeBook, queryBooks } from '../services/BookService';
import { BookDoesNotExistError, BookHasLoanHistoryError } from '../utils/LibraryErrors';

async function getAllBooks(req: Request, res: Response) {
  const { page = 1, limit = 25 } = req.query;
  try {
    const books = await queryBooks(Number(page), Number(limit));
    res.status(200).json({ message: 'Retrieved all books', page: books });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Unable to retrieve books at this time', error });
  }
}

async function createBook(req: Request, res: Response) {
  const book = req.body;
  try {
    const savedBook = await registerBook(book);
    res.status(201).json({ message: 'Book created successfully', savedBook });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Unable to save book at this time', error });
  }
}

async function updateBook(req: Request, res: Response) {
  const book = req.body;
  try {
    const updatedBook = await modifyBook(book);
    res.status(200).json({ message: 'Book updated successfully', updatedBook });
  } catch (error: unknown) {
    if (error instanceof BookDoesNotExistError) {
      res.status(404).json({ message: 'Cannot update book that does not exist', error });
    } else {
      res.status(500).json({ message: 'Unable to update book at this time', error });
    }
  }
}

async function deleteBook(req: Request, res: Response) {
  const { barcode } = req.params as { barcode: string };
  try {
    const message = await removeBook(barcode);
    res.status(200).json({ message });
  } catch (error: unknown) {
    if (error instanceof BookDoesNotExistError) {
      res.status(404).json({ message: 'Cannot delete a book that does not exist', error });
    } else if (error instanceof BookHasLoanHistoryError) {
      res.status(409).json({ message: error.message, error: error.message });
    } else {
      res.status(500).json({ message: 'Unable to delete book at this time', error });
    }
  }
}

async function searchForBooksByQuery(req: Request, res: Response) {
  const { title, barcode, description, author, subject, genre, page = 1, limit = 25 } = req.query;
  try {
    const books = await queryBooks(
      Number(page),
      Number(limit),
      title as string,
      barcode as string,
      description as string,
      author as string,
      subject as string,
      genre as string,
    );
    res.status(200).json({ message: 'Books retrieved successfully', page: books });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Unable to retrieve books at this time', error });
  }
}

export default { getAllBooks, createBook, updateBook, deleteBook, searchForBooksByQuery };
