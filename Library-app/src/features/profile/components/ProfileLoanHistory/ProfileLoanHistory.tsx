import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

import './ProfileLoanHistory.css';
import { RootState } from '../../../../redux/ReduxStore';
import { LoanRecord } from '../../../../models/LoanRecord';
import { ProfileLoanRecord } from '../ProfileLoanRecord/ProfileLoanRecord';

export const ProfileLoanHistory: React.FC = () => {
    const user = useSelector((state: RootState) => state.authentication.profileUser);

    const [records, setRecords] = useState<LoanRecord[]>([]);

    const fetchRecordsForUser = async () => {
        if (user) {
            try {
                let res = await axios.post('http://localhost:8000/loan/query', {
                    property: 'patron',
                    value: user._id
                });

                let r = res.data.records;

                setRecords(r);
            } catch (e) {
                // handle error
            }
        }
    };

    useEffect(() => {
        fetchRecordsForUser();
    },[user]);

    return (
        <div className="profile-loan-history">
            <h3 className="profile-loan-header">{user?.firstname}'s Item Loan History:</h3>
            {records.map((record) => {
                return (
                <ProfileLoanRecord key={record._id} record={record} />
                );
            })}
        </div>
    )


}