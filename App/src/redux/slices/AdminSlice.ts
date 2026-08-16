import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import apiClient from "../../api/Client";
import { User } from "../../models/User";

interface AdminSliceState {
    pendingUsers: User[];
    loading: boolean;
    errorMessage: string | null;
}

const initialState: AdminSliceState = {
    pendingUsers: [],
    loading: false,
    errorMessage: null,
};

function extractErrorMessage(e: unknown, fallback: string): string {
    const anyErr = e as any;
    return anyErr?.response?.data?.message || fallback;
}

export const fetchPendingUsers = createAsyncThunk(
    "admin/fetchPendingUsers",
    async (_: void, thunkAPI) => {
        try {
            const req = await apiClient.get("/users/pending");
            return req.data.users as User[];
        } catch (e) {
            return thunkAPI.rejectWithValue(extractErrorMessage(e, "Unable to load pending users"));
        }
    }
);

export const approveUser = createAsyncThunk(
    "admin/approveUser",
    async (userId: string, thunkAPI) => {
        try {
            const req = await apiClient.put(`/users/${userId}/approve`);
            return req.data.user as User;
        } catch (e) {
            return thunkAPI.rejectWithValue(extractErrorMessage(e, "Unable to approve user"));
        }
    }
);

export const rejectUser = createAsyncThunk(
    "admin/rejectUser",
    async (userId: string, thunkAPI) => {
        try {
            const req = await apiClient.put(`/users/${userId}/reject`);
            return req.data.user as User;
        } catch (e) {
            return thunkAPI.rejectWithValue(extractErrorMessage(e, "Unable to reject user"));
        }
    }
);

export const AdminSlice = createSlice({
    name: "admin",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchPendingUsers.pending, (state) => {
            state.loading = true;
            state.errorMessage = null;
        });
        builder.addCase(fetchPendingUsers.fulfilled, (state, action) => {
            state.loading = false;
            state.pendingUsers = action.payload;
        });
        builder.addCase(fetchPendingUsers.rejected, (state, action) => {
            state.loading = false;
            state.errorMessage = (action.payload as string) || "Unable to load pending users";
        });
        builder.addCase(approveUser.fulfilled, (state, action) => {
            state.pendingUsers = state.pendingUsers.filter(u => u.id !== action.payload.id);
        });
        builder.addCase(rejectUser.fulfilled, (state, action) => {
            state.pendingUsers = state.pendingUsers.filter(u => u.id !== action.payload.id);
        });
        builder.addCase(approveUser.rejected, (state, action) => {
            state.errorMessage = (action.payload as string) || "Unable to approve user";
        });
        builder.addCase(rejectUser.rejected, (state, action) => {
            state.errorMessage = (action.payload as string) || "Unable to reject user";
        });
    }
});

export default AdminSlice.reducer;