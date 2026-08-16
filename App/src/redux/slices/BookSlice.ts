import { createAsyncThunk,createSlice, PayloadAction } from "@reduxjs/toolkit";

import apiClient from "../../api/Client";
import { Book, CheckinBookPayload, CheckoutBookPayload } from "../../models/Book";
import { LoanRecord } from "../../models/LoanRecord";
import { PageInfo } from "../../models/Page";

interface BookSliceState {
    loading: boolean;
    error: boolean;
    books: Book[];
    currentBook : Book | undefined;
    pagingInformation: PageInfo | null;
    loanRecordsByBookId: Record<string, LoanRecord[]>;
}

const initialState: BookSliceState = {
    loading: true,
    error: false,
    books: [],
    currentBook: undefined,
    pagingInformation: null,
    loanRecordsByBookId: {}
}

export const fetchAllBooks = createAsyncThunk(
    'book/all',
    async (payload,thunkAPI) => {
        try{
            let req = await apiClient.get('/book/');
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
            let req = await apiClient.get(`/book/query${payload}`);
            return req.data.page;
        }catch(e){
            return thunkAPI.rejectWithValue(e);
        }
    }
)

export const fetchLoanRecordsForBook = createAsyncThunk(
    'book/loanRecords',
    async (bookId: string, thunkAPI) => {
        try {
            const res = await apiClient.post('/loan/query', {
                property: 'item',
                value: bookId
            });
            const records: LoanRecord[] = [...res.data.records].sort(
                (a, b) => new Date(b.loanedDate).getTime() - new Date(a.loanedDate).getTime()
            );
            return { bookId, records };
        } catch (e) {
            return thunkAPI.rejectWithValue(e);
        }
    }
);

export const checkoutBook = createAsyncThunk(
    'book/checkout',
    async (payload:CheckoutBookPayload, thunkAPI) => {
      try {
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 14);
  
        const getPatron = await apiClient.get(`/card/${payload.libraryCard}`);
        let patronId = getPatron.data.libraryCard.user.id;
  
        const record = {
          status: "LOANED",
          loanedDate: new Date(),
          dueDate: returnDate,
          patron: patronId,
          employeeOut: payload.employee.id,
          item: payload.book.id
        };
  
        const loading = await apiClient.post(`/loan`, record);
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
        let record = payload.record;
  
        let updatedRecord = {
          status: 'AVAILABLE',
          loanedDate: record.loanedDate,
          dueDate: record.dueDate,
          returnedDate: new Date(),
          patron: record.patron,
          employeeOut: record.employeeOut,
          employeeIn: payload.employee.id,
          item: record.item,
          id: record.id
        };
  
        let loan = await apiClient.put('/loan/', updatedRecord);
  
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
        let res = await apiClient.get(`/book/query?barcode=${payload}`);
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
        builder.addCase(fetchLoanRecordsForBook.fulfilled, (state, action) => {
            state = {
                ...state,
                loanRecordsByBookId: {
                    ...state.loanRecordsByBookId,
                    [action.payload.bookId]: action.payload.records
                }
            }
            return state;
        })
        builder.addCase(checkoutBook.fulfilled, (state, action) => {
            const existing = state.loanRecordsByBookId[action.payload.item] || [];
            state = {
                ...state,
                loading: false,
                loanRecordsByBookId: {
                    ...state.loanRecordsByBookId,
                    [action.payload.item]: [action.payload, ...existing]
                }
            }
            return state;
        });
        builder.addCase(checkinBook.fulfilled, (state, action) => {
            const existing = state.loanRecordsByBookId[action.payload.item] || [];
            const updated = [action.payload, ...existing.slice(1)];
            state = {
                ...state,
                loading: false,
                loanRecordsByBookId: {
                    ...state.loanRecordsByBookId,
                    [action.payload.item]: updated
                }
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