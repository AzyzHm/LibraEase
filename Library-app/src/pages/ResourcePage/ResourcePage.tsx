import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { AppDispatch, RootState } from '../../redux/ReduxStore';
import { loadBookByBarcode } from '../../redux/slices/BookSlice';
import { BookOverview } from '../../features/book';

export default function ResourcePage() {
    const dispatch: AppDispatch = useDispatch();

    const bookState = useSelector((state: RootState) => state.book);

    const { barcode } = useParams();

    const navigate = useNavigate();

    useEffect(() => {
        if (barcode) {
            dispatch(loadBookByBarcode(barcode));
        }
        if(bookState.error) navigate("/catalog");
    }, [bookState.error,barcode]);

    return (
        <div className="page">
            <div className="page-container">
                <BookOverview />
            </div>
        </div>
    );
}
