import { createAsyncThunk,createSlice } from "@reduxjs/toolkit";

import axios from "axios";
import { Book } from "../../models/Book";

interface BookSliceState {
    loading: boolean;
    error: boolean;
    books: Book[];
}

const initialState: BookSliceState = {
    loading: true,
    error: false,
    books: []
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

export const BookSlice = createSlice({
    name: 'book',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchAllBooks.pending, (state,action) => {
            state = {
                ...state,
                books: [],
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
    }
})

export const {} = BookSlice.actions;
export default BookSlice.reducer;
