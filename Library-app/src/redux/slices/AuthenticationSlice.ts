import { createAsyncThunk,createSlice,PayloadAction } from "@reduxjs/toolkit";

import { LoginUserPayload,RegisterUserPayload, User } from "../../models/User";

import axios from "axios";

interface AuthenticationSliceState {
    loggedInUser: User | undefined;
    loading: boolean;
    error: boolean;
    registerSuccess: boolean;
}

const initialState: AuthenticationSliceState = {
    loggedInUser: undefined,
    loading: false,
    error: false,
    registerSuccess: false,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (user:LoginUserPayload,thunkAPI) => {
        try {
            const req = await axios.post('http://localhost:8000/auth/login',user);
            return req.data.user;
        } catch (e) {
            return thunkAPI.rejectWithValue(e);
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (user:RegisterUserPayload,thunkAPI) => {
        try {
            const req = await axios.post('http://localhost:8000/auth/register',user);
            return req.data.user;
        } catch (e) {
            console.log(e);
            return thunkAPI.rejectWithValue(e);
        }
    }
);

export const AuthenticationSlice = createSlice({
    name: "authentication",
    initialState,
    reducers: {
        resetRegisterSuccess: (state) => {
            state = {
                ...state,
                registerSuccess: false
            }
            return state;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(loginUser.pending, (state,action) => {
            state = {
                ...state,
                error: false,
                loading: true
            }
            return state;
        });
        builder.addCase(registerUser.pending, (state,action) => {
            state = {
                ...state,
                error: false,
                loading: true
            }
            return state;
        });
        builder.addCase(loginUser.fulfilled, (state,action) => {
            state = {
                ...state,
                loading: false,
                loggedInUser: action.payload
            }
            return state;
        });
        builder.addCase(registerUser.fulfilled, (state,action) => {
            state = {
                ...state,
                loading: false,
                registerSuccess: true,
            }
            return state;
        });
        builder.addCase(loginUser.rejected, (state,action) => {
            state = {
                ...state,
                error: true,
                loading: false
            }
            return state;
        });
        builder.addCase(registerUser.rejected, (state,action) => {
            state = {
                ...state,
                error: true,
                loading: false
            }
            return state;
        });
    }
});

export const {resetRegisterSuccess} = AuthenticationSlice.actions;

export default AuthenticationSlice.reducer;