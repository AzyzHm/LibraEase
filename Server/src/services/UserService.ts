import bycrypt from 'bcryptjs';
import {config} from '../config';
import * as UserDao from '../daos/UserDao';
import {IUserModel} from '../daos/UserDao';
import {IUser} from '../models/User';
import { UnableToSaveUserError,UnableToFetchUserError, UserDoesNotExistError, AccountPendingApprovalError } from '../utils/LibraryErrors';

export async function register(user:IUser):Promise<IUserModel>{
    const ROUNDS = config.server.rounds;

    try {
        const hashedPassword = await bycrypt.hash(user.password, ROUNDS);
        // New accounts always start PENDING, regardless of what the client sends,
        // and only become usable once an admin approves them.
        const created = await UserDao.insert({...user, password: hashedPassword, status: 'PENDING'});
        return created;
    } catch (error:any) {
        // Postgres unique-violation error code, replacing Mongo's E11000
        if (error.code === '23505') {
            throw new UnableToSaveUserError("User with email already exists!");
        }
        throw new UnableToSaveUserError(error.message);
    }
}

export async function login(credentials:{email:string,password:string}):Promise<IUserModel>{
    const {email,password} = credentials;
    try {
        const user = await UserDao.findByEmail(email);
        if(!user) throw new UnableToFetchUserError("User not found");

        const isMatch = await bycrypt.compare(password,user.password);
        if(!isMatch) throw new UnableToFetchUserError("Invalid password");

        if(user.status === 'PENDING') throw new AccountPendingApprovalError("Your account is awaiting admin approval");
        if(user.status === 'REJECTED') throw new AccountPendingApprovalError("Your account request was not approved");

        return user;
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

export async function findPendingUsers():Promise<IUserModel[]>{
    const all = await UserDao.find();
    return all.filter(u => u.status === 'PENDING');
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

export async function modifyUser(user: IUserModel): Promise<IUserModel> {
    const { password, ...profileUpdates } = user;

    const updated = await UserDao.updateById(user.id, profileUpdates);

    if (!updated) {
        throw new UserDoesNotExistError("No user exists with the given id");
    }

    return updated;
}

export async function approveUser(userId:string):Promise<IUserModel>{
    const updated = await UserDao.updateById(userId, { status: 'APPROVED' });
    if(!updated) throw new UserDoesNotExistError("No user exists with the given id");
    return updated;
}

export async function rejectUser(userId:string):Promise<IUserModel>{
    const updated = await UserDao.updateById(userId, { status: 'REJECTED' });
    if(!updated) throw new UserDoesNotExistError("No user exists with the given id");
    return updated;
}

export async function removeUser(userId:string):Promise<string>{
    try{
        let deleted = await UserDao.removeById(userId);
        if(!deleted) throw new UserDoesNotExistError("No user exists with the given id");
        return "User deleted successfully";
    }
    catch(error){
        throw error;
    }
}
