import mongoose,{Schema, Document} from "mongoose";
import {IUser} from "../models/User";

export interface IUserModel extends IUser, Document {}

const UserSchema = new Schema({
    type: {type: String, required: true},
    firstname: {type: String, required: true},
    lastname: {type: String, required: true},
    email: {type: String, unique: true},
    password: {type: String, required: true}
},
{
    versionKey: false
});

export default mongoose.model<IUserModel>('User', UserSchema);