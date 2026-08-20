import bycrypt from 'bcryptjs';
import {config} from '../config';
import * as UserDao from '../daos/UserDao';
import {IUserModel} from '../daos/UserDao';
import {IUser} from '../models/User';
import { UnableToSaveUserError,UnableToFetchUserError, UserDoesNotExistError, AccountPendingApprovalError, InvalidRoleTransitionError } from '../utils/LibraryErrors';

export async function register(user:IUser):Promise<IUserModel>{
    const ROUNDS = config.server.rounds;

    try {
        const hashedPassword = await bycrypt.hash(user.password, ROUNDS);
        const created = await UserDao.insert({...user, type: 'PATRON', password: hashedPassword, status: 'PENDING'});
        return created;
    } catch (error:any) {
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
    const { password, type, ...profileUpdates } = user;

    const updated = await UserDao.updateById(user.id, profileUpdates);

    if (!updated) {
        throw new UserDoesNotExistError("No user exists with the given id");
    }

    return updated;
}

export async function promoteUser(userId: string): Promise<IUserModel> {
    const target = await UserDao.findById(userId);
    if (!target) throw new UserDoesNotExistError("No user exists with the given id");
    if (target.type === 'ADMIN') throw new InvalidRoleTransitionError("The admin's role cannot be changed");
    if (target.type === 'EMPLOYEE') throw new InvalidRoleTransitionError("User is already an employee");

    const updated = await UserDao.updateById(userId, { type: 'EMPLOYEE' });
    if (!updated) throw new UserDoesNotExistError("No user exists with the given id");
    return updated;
}

export async function demoteUser(userId: string): Promise<IUserModel> {
    const target = await UserDao.findById(userId);
    if (!target) throw new UserDoesNotExistError("No user exists with the given id");
    if (target.type === 'ADMIN') throw new InvalidRoleTransitionError("The admin's role cannot be changed");
    if (target.type === 'PATRON') throw new InvalidRoleTransitionError("User is already a patron");

    const updated = await UserDao.updateById(userId, { type: 'PATRON' });
    if (!updated) throw new UserDoesNotExistError("No user exists with the given id");
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