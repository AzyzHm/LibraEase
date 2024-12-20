import { createAsyncThunk,createSlice, PayloadAction } from "@reduxjs/toolkit";

import axios from "axios";
import { Book, CheckinBookPayload, CheckoutBookPayload } from "../../models/Book";
import { PageInfo } from "../../models/Page";

interface BookSliceState {
    loading: boolean;
    error: boolean;
    books: Book[];
    currentBook : Book | undefined;
    pagingInformation: PageInfo | null;
}

const initialState: BookSliceState = {
    loading: true,
    error: false,
    books: [],
    currentBook: undefined,
    pagingInformation: null
}

export const fetchAllBooks = createAsyncThunk(
    'book/all',
    async (payload,thunkAPI) => {
        try{
            let req = await axios.get('http://localhost:8000/book/');
            return req.data.books;
        }catch(e){
            return thunkAPI.rejectWithValue(e);
        }
    }
)

export const queryBooks = createAsyncThunk(
    'book/query',
    async (payload:string,thunkAPI) => {
        try{
            let req = await axios.get(`http://localhost:8000/book/query${payload}`);
            return req.data.page;
        }catch(e){
            return thunkAPI.rejectWithValue(e);
        }
    }
)

export const checkoutBook = createAsyncThunk(
    'book/checkout',
    async (payload:CheckoutBookPayload, thunkAPI) => {
      try {
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 14);
  
        const getPatron = await axios.get(`http://localhost:8000/card/${payload.libraryCard}`);
        let patronId = getPatron.data.libraryCard.user._id;
  
        const record = {
          status: "LOANED",
          loanDate: new Date(),
          dueDate: returnDate,
          patronId: patronId,
          employeeId: payload.employee._id,
          itemId: payload.book._id
        };
  
        const loading = await axios.post(`http://localhost:8000/loan`, record);
        const loan = loading.data.record;
  
        return loan;
      } catch(e) {
        return thunkAPI.rejectWithValue(e);
      }
    }
  );
  
export const checkinBook = createAsyncThunk(
    'loan/checkin',
    async (payload: CheckinBookPayload, thunkAPI) => {
      try {
        let record = payload.book.records[0];
  
        let updatedRecord = {
          status: 'AVAILABLE',
          loanedDate: record.loanedDate,
          dueDate: record.dueDate,
          returnedDate: new Date(),
          patron: record.patron,
          employeeOut: record.employeeOut,
          employeeIn: payload.employee._id,
          item: record.item,
          _id: record._id
        };
  
        let loan = await axios.put('http://localhost:8000/loan/', updatedRecord);
  
        return loan.data.record;
      } catch (e) {
        return thunkAPI.rejectWithValue(e);
      }
    }
);

export const loadBookByBarcode = createAsyncThunk(
    'book/id',
    async (payload: string, thunkAPI) => {
      try {
        let res = await axios.get(`http://localhost:8000/book/query?barcode=${payload}`);
        let book = res.data.page.items[0];
        if (!book || book.barcode !== payload) {
          throw new Error();
        }
        return book;
      } catch (e) {
        return thunkAPI.rejectWithValue(e);
      }
    }
  );  
  

export const BookSlice = createSlice({
    name: 'book',
    initialState,
    reducers: {
        setCurrentBook(state,action:PayloadAction<Book | undefined>){
            state = {
                ...state,
                currentBook: action.payload
            }
            return state;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchAllBooks.pending, (state,action) => {
            state = {
                ...state,
                books: [],
                loading: true
            }
            return state;
        })
        builder.addCase(queryBooks.pending, (state,action) => {
            state = {
                ...state,
                books: [],
                loading: true
            }
            return state;
        })
        builder.addCase(checkoutBook.pending, (state,action) => {
            state = {
                ...state,
                loading: true
            }
            return state;
        })
        builder.addCase(checkinBook.pending, (state,action) => {
            state = {
                ...state,
                loading: true
            }
            return state;
        })
        builder.addCase(loadBookByBarcode.pending, (state,action) => {
            state = {
                ...state,
                loading: true
            }
            return state;
        })



        builder.addCase(fetchAllBooks.fulfilled, (state,action) => {
            state = {
                ...state,
                books: action.payload,
                loading: false
            }
            return state;
        })
        builder.addCase(queryBooks.fulfilled, (state,action) => {
            state = {
                ...state,
                books: action.payload.items,
                pagingInformation: {
                    totalCount: action.payload.totalCount,
                    currentPage: action.payload.currentPage,
                    totalPages: action.payload.totalPages,
                    limit: action.payload.limit,
                    pageCount: action.payload.pageCount
                },
                loading: false
            }
            return state;
        })
        builder.addCase(checkoutBook.fulfilled, (state, action) => {
            let bookList:Book[] = JSON.parse(JSON.stringify(state.books));
        
            bookList = bookList.map((book) => {
                if (book._id === action.payload.item) {
                    book.records = [action.payload, ...book.records];
                    return book;
                }
                return book;
            });
            state = {
                ...state,
                loading: false,
                books: bookList
            }
            return state;
        });
        builder.addCase(checkinBook.fulfilled, (state, action) => {
            let bookList:Book[] = JSON.parse(JSON.stringify(state.books));
        
            bookList = bookList.map((book) => {
                if (book._id === action.payload.item) {
                    book.records.splice(0,1,action.payload);
                    return book;
                }
                return book;
            });
            state = {
                ...state,
                loading: false,
                books: bookList
            }
            return state;
        });
        builder.addCase(loadBookByBarcode.fulfilled, (state, action) => {
            state = {
                ...state,
                loading: false,
                currentBook: action.payload
            }
            return state;
        });
        
        
        builder.addCase(loadBookByBarcode.rejected, (state, action) => {
            state = {
                ...state,
                loading: false,
                error: true
            }
            return state;
        });


    }
})

export const {setCurrentBook} = BookSlice.actions;
export default BookSlice.reducer;
