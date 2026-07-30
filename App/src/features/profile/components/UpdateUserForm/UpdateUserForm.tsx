import React,{useState, useEffect} from "react";

import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../../../../redux/ReduxStore';
import { useNavigate } from "react-router-dom";
import { User } from "../../../../models/User";

import './UpdateUserForm.css';
import { Create } from "@mui/icons-material";
import { resetUser, updateUser } from "../../../../redux/slices/AuthenticationSlice";

export const UpdateUserForm:React.FC = () => {
    const userState = useSelector((state:RootState) => state.authentication);
    const dispatch:AppDispatch = useDispatch(); 

    const [displayUpdate, setDisplayUpdate] = useState<boolean>(false);
    const [user,setUser] = useState<User | undefined>(userState.profileUser);
    const navigate = useNavigate();

    const updateUserSate = (e:React.ChangeEvent<HTMLInputElement>) => {
        setDisplayUpdate(true);
        if(e.target.value && e.target.name && user) {
            setUser({
                ...user,
                [e.target.name]: e.target.value
            })
        }
    }

    const submitUpdateUser = (e:React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if(user) {
            dispatch(updateUser(user));
        }
        setDisplayUpdate(false);
    }

    const logout = (e:React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        localStorage.removeItem('userId');
        dispatch(resetUser('loggedInUser'));
        dispatch(resetUser('profileUser'));
        navigate('/');
    }

    useEffect(() => {
        if(!user){
            setUser(userState.profileUser);
        }
    }, [userState.profileUser,user])

    return (
        <form className="update-user-form">
            <div className="update-user-input-group">
                <h4>First Name:</h4>
                <input className="update-user-input" name="firstname" value={user?.firstname || ''} onChange={updateUserSate} disabled={userState.loggedInUser?._id !== userState.profileUser?._id}/>
                {userState.loggedInUser?._id === userState.profileUser?._id && <Create sx={{
                    position :'absolute',
                    top: '65%',
                    right: '0'
                }} />}
            </div>
            <div className="update-user-input-group">
                <h4>Last Name:</h4>
                <input className="update-user-input" name="lastname" value={user?.lastname || ''} onChange={updateUserSate} disabled={userState.loggedInUser?._id !== userState.profileUser?._id}/>
                {userState.loggedInUser?._id === userState.profileUser?._id && <Create sx={{
                    position :'absolute',
                    top: '65%',
                    right: '0'
                }} />}
            </div>
            <div className="update-user-input-group">
                <h4>Email:</h4>
                <input className="update-user-input" name="email" value={user?.email || ''} onChange={updateUserSate} disabled={userState.loggedInUser?._id !== userState.profileUser?._id}/>
                {userState.loggedInUser?._id === userState.profileUser?._id && <Create sx={{
                    position :'absolute',
                    top: '65%',
                    right: '0'
                }} />}
            </div>
            {displayUpdate ? <button className="profile-button" onClick={submitUpdateUser}>Update Profile</button> : <></>}
            {userState.loggedInUser?._id === userState.profileUser?._id ? <button className="profile-button" onClick={logout}>Logout of Account</button> : <></>}
        </form>

            )

}