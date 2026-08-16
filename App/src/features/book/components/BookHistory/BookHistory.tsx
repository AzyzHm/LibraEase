import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import './BookHistory.css';
import { Book } from '../../../../models/Book';
import { AppDispatch, RootState } from '../../../../redux/ReduxStore';
import { fetchLoanRecordsForBook } from '../../../../redux/slices/BookSlice';
import { BookHistoryItem } from '../BookHistoryItem/BookHistoryItem';

interface BookHistoryProps {
    book: Book
}

export const BookHistory: React.FC<BookHistoryProps> = ({book}) => {
    const dispatch: AppDispatch = useDispatch();
    const records = useSelector((state: RootState) => state.book.loanRecordsByBookId[book.id]) || [];

    useEffect(() => {
        dispatch(fetchLoanRecordsForBook(book.id));
    }, [book.id]);

    return (
        <div className="book-history">
            <h2>Loan History</h2>
            <div className="book-history-box">
                {
                    records.map((record) => {
                        return (
                            <BookHistoryItem key={record.id} record={record} />
                        )
                    })
                }
            </div>
        </div>
    )
}