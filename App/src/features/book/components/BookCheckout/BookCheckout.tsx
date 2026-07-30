import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import './BookCheckout.css';
import { AppDispatch, RootState } from '../../../../redux/ReduxStore';
import { checkoutBook, setCurrentBook } from '../../../../redux/slices/BookSlice';
import { setDisplayLoan } from '../../../../redux/slices/ModalSlice';

export const BookCheckout: React.FC = () => {
    const user = useSelector((state: RootState) => state.authentication.loggedInUser);
    const book = useSelector((state: RootState) => state.book.currentBook);

    const dispatch: AppDispatch = useDispatch();

    const libraryCardRef = useRef<HTMLInputElement>(null);

    const checkout = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (book && user && libraryCardRef && libraryCardRef.current) {
            dispatch(checkoutBook({
                book,
                employee: user,
                libraryCard: libraryCardRef.current.value
            }));
            dispatch(setCurrentBook(undefined));
            dispatch(setDisplayLoan(false));
        }
    };

    return (
        <div className='book-checkout'>
            { book && user &&
                <form className='book-checkout-form'>
                    <h3>Loan Book Title: {book.title}</h3>
                    <h3>Enter patron's library card ID:</h3>
                    <input className='book-checkout-input' placeholder='Library Card ID' ref={libraryCardRef} />
                    <h3>Checkout Employee ID:</h3>
                    <input className='book-checkout-input' value={user._id} disabled />
                    <button className='book-checkout-button' onClick={checkout}>Loan Book</button>
                </form>
            }
        </div>
    );
};
