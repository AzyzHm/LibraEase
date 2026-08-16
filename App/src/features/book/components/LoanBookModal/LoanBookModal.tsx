import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/ReduxStore';
import { setDisplayLoan } from '../../../../redux/slices/ModalSlice';
import { fetchLoanRecordsForBook } from '../../../../redux/slices/BookSlice';
import { Modal } from '../../../../components';
import { determineLoanModalContent } from '../../utils/BookUtils';

export const LoanBookModal: React.FC = () => {
    const currentBook = useSelector((state: RootState) => state.book.currentBook);
    const records = useSelector((state: RootState) =>
        currentBook ? state.book.loanRecordsByBookId[currentBook.id] : undefined
    );

    const dispatch: AppDispatch = useDispatch();

    useEffect(() => {
        if (currentBook) {
            dispatch(fetchLoanRecordsForBook(currentBook.id));
        }
    }, [currentBook?.id]);

    const closeModal = () => {
        dispatch(setDisplayLoan(false));
    };

    return (
        <Modal content={currentBook ? determineLoanModalContent(records || []) : <></>} toggleModal={closeModal} />
    );
};