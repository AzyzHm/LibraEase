import bycrypt from 'bcrypt';
import {config} from '../config';

import UserDao,{IUserModel} from '../daos/UserDao';
import {IUser} from '../models/User';
import { UnableToSaveUserError,UnableToFetchUserError } from '../utils/LibraryErrors';

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