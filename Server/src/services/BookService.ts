import BookDao,{IBookModel} from "../daos/BookDao";
import { IBook } from "../models/Book";
import { IPagination } from "../models/Pagination";
import { BookDoesNotExistError } from "../utils/LibraryErrors";

export async function findAllBooks(): Promise<IBookModel[]> {
    return await BookDao.find();
}

export async function modifyBook(book : IBookModel): Promise<IBookModel> {
    try{
        let id = await BookDao.findOneAndUpdate({barcode: book.barcode}, book,{new: true});
        if(id) return book;
        throw new BookDoesNotExistError("Item does not exist");
    }catch(error:any){
        throw error;
    }
}

export async function registerBook(book : IBook): Promise<IBookModel> {
    const saveBook = new BookDao(book);
    return await saveBook.save();
}

export async function removeBook(barcode : string): Promise<string> {
    try{
        let id = await BookDao.findOneAndDelete({barcode});
        if(id) return "Successfully deleted book";
        throw new BookDoesNotExistError("Book does not exist");
    }catch(error:any){
        throw error;
    }
}

export async function queryBooks(page:number,limit:number,title?:string, barcode?:string, description?:string, author?: string,subject?:string, genre?:string)
:Promise<IPagination<IBookModel>>{
    let books:IBookModel[] = await BookDao.find();
    let filteredBooks:IBookModel[] = [];
    books.forEach((book) => {
        if(barcode){
            if(book.barcode.toLowerCase().includes(barcode.toLowerCase()) && !filteredBooks.some((filteredBook) => filteredBook.barcode === book.barcode)){
                filteredBooks.push(book);
            }
        }
        if(title){
            if(book.title.toLowerCase().includes(title.toLowerCase()) && !filteredBooks.some((filteredBook) => filteredBook.barcode === book.barcode)){
                filteredBooks.push(book);
            }
        }
        if(description){
            if(book.description.toLowerCase().includes(description.toLowerCase()) && !filteredBooks.some((filteredBook) => filteredBook.barcode === book.barcode)){
                filteredBooks.push(book);
            }
        }
        if(author){
            if(book.authors.some((authorName) => authorName.toLowerCase().includes(author.toLowerCase())) && !filteredBooks.some((filteredBook) => filteredBook.barcode === book.barcode)){
                filteredBooks.push(book);
            }
        }
        if(subject){
            if(book.subjects.some((subjectName) => subjectName.toLowerCase().includes(subject.toLowerCase())) && !filteredBooks.some((filteredBook) => filteredBook.barcode === book.barcode)){
                filteredBooks.push(book);
            }
        }
        if(genre){
            if(book.genre.toLowerCase().includes(genre.toLowerCase()) && !filteredBooks.some((filteredBook) => filteredBook.barcode === book.barcode)){
                filteredBooks.push(book);
            }
        }
    });
    return paginateBooks(filteredBooks, page, limit);
}

export function paginateBooks(books:IBookModel[], page:number, limit:number):IPagination<IBookModel>{
    let pageBooks:IBookModel[] = [];

    const pages = Math.ceil(books.length / Number(limit));

    if(Number(page) > pages){
        const startPoint = (Number(page) - 1) * Number(limit);
        pageBooks = books.slice(startPoint);
    }else{
        const startPoint = (Number(page) - 1)* Number(limit);
        const endPoint = startPoint + Number(limit);
        pageBooks = books.slice(startPoint, endPoint);
    }
    const pageObject = {
        totalCount: books.length,
        currentPage: Number(page),
        totalPages: pages,
        limit: Number(limit),
        pageCount: pageBooks.length,
        items: pageBooks
    }
    return pageObject;
}