import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { RootState } from "../../redux/ReduxStore";
import { PendingUsersPanel } from "../../features/admin";
import "./AdminPage.css";

export default function AdminPage() {
    const loggedInUser = useSelector((state: RootState) => state.authentication.loggedInUser);
    const navigate = useNavigate();

    useEffect(() => {
        if (loggedInUser && loggedInUser.type !== "ADMIN") {
            navigate("/");
        }
    }, [loggedInUser]);

    if (!loggedInUser || loggedInUser.type !== "ADMIN") {
        return null;
    }

    return (
        <div className="page">
            <div className="page-container">
                <h1>Admin</h1>
                <PendingUsersPanel />
            </div>
        </div>
    );
}