import {Request , Response} from 'express';
import { findAllUsers,findUserById,removeUser,modifyUser,findPendingUsers,approveUser,rejectUser } from '../services/UserService';
import { UserDoesNotExistError } from '../utils/LibraryErrors';

async function getAllUsers(req:Request,res:Response) {
    try {
        let users = await findAllUsers();
        res.status(200).json({message:"Users retrieved successfully",users});
    }catch (error:any) {
        res.status(500).json({message:"Unable to retrieve users at this time",error:error.message});
    }
}

async function getPendingUsers(req:Request,res:Response) {
    try {
        let users = await findPendingUsers();
        res.status(200).json({message:"Pending users retrieved successfully",users});
    }catch (error:any) {
        res.status(500).json({message:"Unable to retrieve pending users at this time",error:error.message});
    }
}

async function getUserById(req:Request,res:Response) {
    const userId = req.params.userId as string;

    try {
        let user = await findUserById(userId);
        res.status(200).json({message:"User retrieved successfully",user});
    }catch (error:any) {
        if(error instanceof UserDoesNotExistError){
            res.status(404).json({message:"User not found",error:error.message});
        }else{
        res.status(500).json({message:"Unable to retrieve user",error:error.message});
    }}
}

async function deleteUser(req:Request,res:Response) {
    const userId = req.params.userId as string;

    try {
        let message = await removeUser(userId);
        res.status(200).json({message});
    }catch (error:any) {
        if(error instanceof UserDoesNotExistError){
            res.status(404).json({message:"User not found",error:error.message});
        }else{
        res.status(500).json({message:"Unable to delete user",error:error.message});
    }}
}

async function updateUser(req:Request,res:Response) {
    const user = req.body;

    try {
        let updatedUser = await modifyUser(user);
        res.status(200).json({message:"User updated successfully",updatedUser});
    }catch (error:any) {
        if(error instanceof UserDoesNotExistError){
            res.status(404).json({message:"User not found",error:error.message});
        }else{
        res.status(500).json({message:"Unable to update user",error:error.message});
    }}
}

// NOTE: these two aren't protected by any admin-only auth check yet — see the
// heads-up in chat. Add an auth/role-guard middleware before shipping this.
async function approveUserHandler(req:Request,res:Response) {
    const userId = req.params.userId as string;
    try {
        let user = await approveUser(userId);
        res.status(200).json({message:"User approved successfully",user});
    }catch (error:any) {
        if(error instanceof UserDoesNotExistError){
            res.status(404).json({message:"User not found",error:error.message});
        }else{
        res.status(500).json({message:"Unable to approve user",error:error.message});
    }}
}

async function rejectUserHandler(req:Request,res:Response) {
    const userId = req.params.userId as string;
    try {
        let user = await rejectUser(userId);
        res.status(200).json({message:"User rejected",user});
    }catch (error:any) {
        if(error instanceof UserDoesNotExistError){
            res.status(404).json({message:"User not found",error:error.message});
        }else{
        res.status(500).json({message:"Unable to reject user",error:error.message});
    }}
}

export default {getAllUsers,getPendingUsers,getUserById,deleteUser,updateUser,approveUserHandler,rejectUserHandler};
