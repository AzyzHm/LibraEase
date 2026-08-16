import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import "./PendingUsersPanel.css";
import { AppDispatch, RootState } from "../../../../redux/ReduxStore";
import { approveUser, fetchPendingUsers, rejectUser } from "../../../../redux/slices/AdminSlice";

export const PendingUsersPanel: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const { pendingUsers, loading, errorMessage } = useSelector((state: RootState) => state.admin);

    useEffect(() => {
        dispatch(fetchPendingUsers());
    }, []);

    return (
        <div className="pending-users-panel">
            <h2>Pending Sign-Ups</h2>
            {errorMessage && <p className="pending-users-error">{errorMessage}</p>}
            {loading && pendingUsers.length === 0 && <p>Loading...</p>}
            {!loading && pendingUsers.length === 0 && !errorMessage && (
                <p className="pending-users-empty">No accounts are waiting for approval.</p>
            )}
            <div className="pending-users-list">
                {pendingUsers.map((user) => (
                    <div className="pending-user-row" key={user.id}>
                        <div className="pending-user-info">
                            <h3>{user.firstname} {user.lastname}</h3>
                            <p>{user.email}</p>
                            <span className="pending-user-type">{user.type}</span>
                        </div>
                        <div className="pending-user-actions">
                            <button
                                className="pending-user-approve"
                                onClick={() => dispatch(approveUser(user.id))}
                            >
                                Approve
                            </button>
                            <button
                                className="pending-user-reject"
                                onClick={() => dispatch(rejectUser(user.id))}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};