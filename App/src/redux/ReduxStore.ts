import { configureStore } from "@reduxjs/toolkit";
import authenticationReducer from "./slices/AuthenticationSlice";
import modalReducer from "./slices/ModalSlice";
import bookReducer from "./slices/BookSlice";
import adminReducer from "./slices/AdminSlice";

export const store = configureStore({
    reducer: {
        authentication: authenticationReducer,
        modal: modalReducer,
        book: bookReducer,
        admin: adminReducer
    },
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;