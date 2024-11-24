import bycrypt from 'bcrypt';
import {config} from '../config';

import UserDao,{IUserModel} from '../daos/UserDao';
import {IUser} from '../models/User';
import { UnableToSaveUserError,UnableToFetchUserError, UserDoesNotExistError } from '../utils/LibraryErrors';
import { Error } from 'mongoose';

export async function register(user:IUser):Promise<IUserModel>{
    const ROUNDS = config.server.rounds;

    try {
        const hashedPassword = await bycrypt.hash(user.password, ROUNDS);
        const saved = new UserDao({...user, password: hashedPassword});
        return await saved.save();
    } catch (error:any) {
        throw new UnableToSaveUserError(error.message);
    }
}

export async function login(credentials:{email:string,password:string}):Promise<IUserModel>{
    const {email,password} = credentials;
    try {
        const user = await UserDao.findOne({email});
        if(!user) throw new UnableToFetchUserError("User not found");
        else{
            const isMatch = await bycrypt.compare(password,user.password);
            if(!isMatch) throw new UnableToFetchUserError("Invalid password");
            else return user;
        }
    }catch (error:any) {
        throw error;
    }
}

export async function findAllUsers():Promise<IUserModel[]>{
    try {
        return await UserDao.find();
    } catch (error) {
        return [];
    }
}

export async function findUserById(id:string):Promise<IUserModel|null>{
    try {
        const user = await UserDao.findById(id);
        if(user) return user;
        throw new UserDoesNotExistError("No user exists with the given id");
    }
    catch (error:any) {
        throw error;
    }
}

export async function modifyUser(user:IUserModel):Promise<IUserModel>{
    try {
        let id = await UserDao.findByIdAndUpdate(user._id,user,{new:true});
        if (!id) throw new UserDoesNotExistError("No user exists with the given id");
        return user;
    }catch(error:any){
        throw error;
    }
}

export async function removeUser(userId:string):Promise<string>{
    try{
        let deleted = await UserDao.findByIdAndDelete(userId);
        if(!deleted) throw new UserDoesNotExistError("No user exists with the given id");
        return "User deleted successfully";
    }
    catch(error){
        throw error;
    }
}