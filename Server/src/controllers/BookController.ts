import { Request,Response } from "express";
import { findAllBooks,registerBook,modifyBook,removeBook } from "../services/BookService";

import { IBook } from "../models/Book";
import { IBookModel } from "../daos/BookDao";
import { BookDoesNotExistError } from "../utils/LibraryErrors";

async function getAllBooks(req: Request, res: Response){
    try{
        const books = await findAllBooks();
        res.status(200).json({message: "Retrieved all books", count:books.length,books});
    }catch(error:any){
        res.status(500).json({message: "Unable to retrieve books at this time",error});
    }
}

async function createBook(req: Request, res: Response){
    let book = req.body;
    try{
        const savedBook = await registerBook(book);
        res.status(201).json({message: "Book created successfully",savedBook});
    }catch(error:any){
        res.status(500).json({message: "Unable to save book at this time",error});
    }
}

async function updateBook(req: Request, res: Response){
    let book = req.body;
    try{
        const updatedBook = await modifyBook(book);
        res.status(200).json({message: "Book updated successfully",updatedBook});
    }catch(error:any){
        if(error instanceof BookDoesNotExistError){
            res.status(404).json({message: "Cannot update book that does not exist",error});
        }else{
        res.status(500).json({message: "Unable to update book at this time",error});
    }
}
}

async function deleteBook(req: Request, res: Response){
    let {barcode} = req.params;
    try{
        const message = await removeBook(barcode);
        res.status(200).json({message});
    }catch(error:any){
        if(error instanceof BookDoesNotExistError){
            res.status(404).json({message: "Cannot delete a book that does not exist",error});
        }else{
        res.status(500).json({message: "Unable to delete book at this time",error});
    }
}
}

export default {getAllBooks,createBook,updateBook,deleteBook};