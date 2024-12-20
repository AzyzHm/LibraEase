import React from 'react';

import './BookAdditionalInfo.css';
import { Book } from '../../../../models/Book';

interface BookAdditionalInfoProps {
    book: Book;
}

export const BookAdditionalInfo: React.FC<BookAdditionalInfoProps> = ({book}) => {
    return (
        <div className="additional-book-info">
            <h2>Additional Information about {book.title}</h2>
            <div className="additional-book-info-container">
                <div className="additional-book-info-group">
                    <h3 className="additional-book-info-text">Published By:</h3>
                    <p className="additional-book-info-text">{book.publisher}</p>
                </div>
                <div className="additional-book-info-group">
                    <h3 className="additional-book-info-text">Published On:</h3>
                    <p className="additional-book-info-text">{new Date(book.publicationDate).toDateString()}</p>
                </div>
                <div className="additional-book-info-group">
                    <h3 className="additional-book-info-text">ISBN:</h3>
                    <p className="additional-book-info-text">{book.barcode}</p>
                </div>
                <div className="additional-book-info-group">
                    <h3 className="additional-book-info-text">Number of Pages:</h3>
                    <p className="additional-book-info-text">{book.pages}</p>
                </div>
            </div>
        </div>
    );
}
