import { createAsyncThunk,createSlice,PayloadAction } from "@reduxjs/toolkit";

import { FetchUserPayload, LoginUserPayload,RegisterUserPayload, User } from "../../models/User";

import apiClient from "../../api/Client";

interface AuthenticationSliceState {
    loggedInUser: User | undefined;
    profileUser: User | undefined;
    libraryCard: string;
    loading: boolean;
    errorMessage: string | null;
    registerSuccess: boolean;
}

const initialState: AuthenticationSliceState = {
    loggedInUser: undefined,
    profileUser: undefined,
    libraryCard: "",
    loading: false,
    errorMessage: null,
    registerSuccess: false,
};

function extractErrorMessage(e: unknown, fallback: string): string {
    const anyErr = e as any;
    return anyErr?.response?.data?.message || fallback;
}

export const loginUser = createAsyncThunk(
    'auth/login',
    async (user:LoginUserPayload,thunkAPI) => {
        try {
            const req = await apiClient.post('/auth/login',user);
            return req.data.user;
        } catch (e) {
            return thunkAPI.rejectWithValue(extractErrorMessage(e, "Invalid email or password"));
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (user:RegisterUserPayload,thunkAPI) => {
        try {
            const req = await apiClient.post('/auth/register',user);
            return req.data.user;
        } catch (e) {
            return thunkAPI.rejectWithValue(extractErrorMessage(e, "Unable to register at this time"));
        }
    }
);

export const fetchUser = createAsyncThunk(
    'auth/fetch',
    async(payload:FetchUserPayload,thunkAPI) => {
        try {
            const req = await apiClient.get(`/users/${payload.userId}`);
            const user  = req.data.user;
            
            return {user,property:payload.property};
    
        } catch (e) {
            return thunkAPI.rejectWithValue(extractErrorMessage(e, "Unable to load user"));
        }
    }
);

export const updateUser = createAsyncThunk(
    'auth/update',
    async(payload:User,thunkAPI) => {
        try {
            const req = await apiClient.put('/users/',payload);
            return req.data.user;
        } catch (e) {
            return thunkAPI.rejectWithValue(extractErrorMessage(e, "Unable to update user"));
        }
    }
);

export const getLibraryCard = createAsyncThunk(
    'auth/libraryCard',
    async(userId:string,thunkAPI) => {
        try {
            const req = await apiClient.post(`/card/`,{user:userId});
            return req.data.libraryCard;
        } catch (e:any) {
            return thunkAPI.rejectWithValue(extractErrorMessage(e, "Unable to load library card"));
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
        },
        resetUser(state,action:PayloadAction<string>) {
            state = {
                ...state,
                [action.payload]: undefined
            }
            return state;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(loginUser.pending, (state,action) => {
            state = {
                ...state,
                errorMessage: null,
                loading: true
            }
            return state;
        });
        builder.addCase(registerUser.pending, (state,action) => {
            state = {
                ...state,
                errorMessage: null,
                loading: true
            }
            return state;
        });
        builder.addCase(fetchUser.pending, (state,action) => {
            state = {
                ...state,
                errorMessage: null,
                loading: true
            }
            return state;
        });
        builder.addCase(updateUser.pending, (state,action) => {
            state = {
                ...state,
                errorMessage: null,
                loading: true
            }
            return state;
        });
        builder.addCase(getLibraryCard.pending, (state,action) => {
            state = {
                ...state,
                errorMessage: null,
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
        builder.addCase(fetchUser.fulfilled, (state,action) => {
            state = {
                ...state,
                [action.payload.property]: action.payload.user,
                loading: false
            }
            return state;
        });
        builder.addCase(updateUser.fulfilled, (state,action) => {
            state = {
                ...state,
                loggedInUser: action.payload,
                profileUser : action.payload,
                loading: false
            }
            return state;
        });
        builder.addCase(getLibraryCard.fulfilled, (state,action) => {
            state = {
                ...state,
                loading: false,
                libraryCard: action.payload.id
                
            }
            return state;
        });
        builder.addCase(loginUser.rejected, (state,action) => {
            state = {
                ...state,
                errorMessage: (action.payload as string) || "Invalid email or password",
                loading: false
            }
            return state;
        });
        builder.addCase(registerUser.rejected, (state,action) => {
            state = {
                ...state,
                errorMessage: (action.payload as string) || "Unable to register at this time",
                loading: false
            }
            return state;
        });
        builder.addCase(fetchUser.rejected, (state,action) => {
            state = {
                ...state,
                errorMessage: (action.payload as string) || "Unable to load user",
                loading: false
            }
            return state;
        });
        builder.addCase(updateUser.rejected, (state,action) => {
            state = {
                ...state,
                errorMessage: (action.payload as string) || "Unable to update user",
                loading: false
            }
            return state;
        });
    }
});

export const {resetRegisterSuccess, resetUser} = AuthenticationSlice.actions;

export default AuthenticationSlice.reducer;