import mongoose, {Schema, Document} from "mongoose";
import {IBook} from "../models/Book";
import { LoanRecordSchema } from "./LoanRecordDao";

export interface IBookModel extends IBook, Document {};

const BookSchema: Schema = new Schema({
    barcode : {type: String, required: true, unique: true},
    cover : {type: String, required: true},
    title : {type: String, required: true, unique: true},
    authors : {type: [String], required: true},
    description : {type: String, required: true},
    subjects : {type: [String], required: true},
    publicationDate : {type: Date, required: true},
    publisher : {type: String, required: true},
    pages : {type: Number, required: true},
    genre : {type: String, required: true},
    records : [LoanRecordSchema]
});

export default mongoose.model<IBookModel>("Book", BookSchema);