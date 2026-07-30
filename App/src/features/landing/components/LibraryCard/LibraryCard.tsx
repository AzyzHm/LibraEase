import React from 'react';
import { useDispatch } from 'react-redux';
import libraryCard from '../../../../assets/librarycard.png';

import './LibraryCard.css';
import { AppDispatch } from '../../../../redux/ReduxStore';
import { setDisplayLibraryCard } from '../../../../redux/slices/ModalSlice';

export const LibraryCard:React.FC = () => {
    const dispatch:AppDispatch = useDispatch();

    const handleDisplayModal = () => {
        dispatch(setDisplayLibraryCard(true));
    }

    return (
        <div className="get-library-card">
            <h2>Get A Library Card</h2>
            <img src={libraryCard} className="get-library-card-img" />
            <p>Learn how to get your own Library Card <span className='get-library-card-link' onClick={handleDisplayModal}>here.</span> </p>
        </div>
    )
}