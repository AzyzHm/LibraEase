import React, { useEffect ,useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';

import './CatalogOverview.css';

import { AppDispatch,RootState } from '../../../../redux/ReduxStore';
import { fetchAllBooks } from '../../../../redux/slices/BookSlice';
import { generateRandomGenres, getRandomBooksByGenre } from '../../utils/CatalogUtils';
import { CatalogOverviewSection } from '../CatalogOverviewSection/CatalogOverviewSection';


export const CatalogOverview:React.FC = () => {

    const bookState = useSelector((state: RootState) => state.book);
    const dispatch:AppDispatch = useDispatch();

    const [genres,setGenres] = useState<string[]>(() => {
        return generateRandomGenres();
    });

    useEffect(() => {
        dispatch(fetchAllBooks());
    },[]);

    return(
        <>
            {
                bookState.books.length > 0 && !bookState.loading ?
                <div className="catalog-overview">
                    <h2>
                        welcome to our library, we currently have {bookState.books && bookState.books.length} books.
                    </h2>
                    <h4>
                        Browse our selected books below, or search for something using the top navigation bar.
                    </h4>
                    {genres.map((genre) => {
                        return <CatalogOverviewSection key={genre} books={getRandomBooksByGenre(genre,bookState.books)} label = {genre} />    
                    })}
                </div> : <></>

            }
        </>
    )
}