import mongoose, {Document, Schema} from 'mongoose';

import {ILoanRecord} from '../models/LoanRecord';
import { ref } from 'joi';

export interface ILoanRecordModel extends ILoanRecord, Document {}

export const LoanRecordSchema: Schema = new Schema(
    {
        status: {type: String, required: true},
        loanedDate: {type: Date, required: true},
        dueDate: {type: Date, required: true},
        returnedDate: {type: Date, required: false},
        patron: {type: String, required: true},
        employeeOut: {type: String, required: true},
        employeeIn: {type: String, required: false},
        item: {type: String, required: true,ref: 'Book'}
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ILoanRecordModel>('LoanRecord', LoanRecordSchema);