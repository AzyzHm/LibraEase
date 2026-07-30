import {createSlice , PayloadAction} from '@reduxjs/toolkit';

interface ModelSliceState {
    displayLogin: boolean;
    displayLibraryCard: boolean;
    displayLoan: boolean;
}

const initialState : ModelSliceState = {
    displayLogin : false,
    displayLibraryCard : false,
    displayLoan : false,
}

export const modelSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        setDisplayLogin(state, action: PayloadAction<boolean>){
            state = {
                ...state,
                displayLogin: action.payload
            }
            return state;
    },
    setDisplayLibraryCard(state, action: PayloadAction<boolean>){
        state = {
            ...state,
            displayLibraryCard: action.payload
        }
        return state;
    },
    setDisplayLoan(state, action: PayloadAction<boolean>) {
        state = {
            ...state,
            displayLoan: action.payload
        }
        return state;
    }
}
})

export const {setDisplayLogin, setDisplayLibraryCard, setDisplayLoan} = modelSlice.actions;
export default modelSlice.reducer;