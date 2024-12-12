import { useNavigate } from "react-router-dom";

import './BookCard.css';
import { Book } from "../../../../models/Book";
import { mapAuthorsToString } from "../../utils/BookUtils";

interface BookCardProps {
    book: Book;
}

export const  BookCard:React.FC<BookCardProps> = ({book}) => {
    const navigate = useNavigate();

    const displayBook = () => {
        navigate(`/resource/${book.barcode}`);
    }
    return (
        <div className="book-card" id="book-card" onClick={displayBook}>
            <img src={book.cover} className="book-card-cover" />
            <div className="book-card-info">
                <h1 className="book-card-title">{book.title}</h1>
                <h3 className="book-card-author">{mapAuthorsToString(book)}</h3>
                <p className="book-card-description">{book.description}</p>
            </div>
        </div>
    )
}