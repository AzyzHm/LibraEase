import {useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/ReduxStore';
import { fetchUser } from '../../redux/slices/AuthenticationSlice';
import './ProfilePage.css';
import { useNavigate,useParams } from 'react-router-dom';
import { UpdateUserForm } from '../../features/profile';

export default function ProfilePage() {
    const loggedInUser = useSelector((state:RootState) => state.authentication.loggedInUser);
    const profileUser = useSelector((state:RootState) => state.authentication.profileUser);

    const dispatch:AppDispatch = useDispatch();

    const {userId} = useParams();

    const navigate = useNavigate();

    useEffect(() => {
        if(userId) {
            if(loggedInUser?._id === userId || loggedInUser?.type === 'EMPLOYEE'){
                dispatch(fetchUser({userId,property:'profileUser'}));
            }else{
                navigate('/');
            }
        }
    }, [userId])

    return (
        <div className="page">
            <div className='page-container'>
                <h1>{profileUser?.firstname}'s Profile</h1>
                <div className="profile-page-cols">
                    <div className="profile-page-left-column">
                        < UpdateUserForm />
                    </div>
                    <div className="profile-page-right-column">
                        
                    </div>
                </div>
            </div>
        </div>
    )
}

