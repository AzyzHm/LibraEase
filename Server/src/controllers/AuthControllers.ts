import { Request, Response } from "express";
import { login,register } from "../services/UserService";
import { IUser } from "../models/User";
import { IUserModel } from "../daos/UserDao";
import { UnableToFetchUserError } from "../utils/LibraryErrors";

async function handleRegister(req: Request, res: Response): Promise<void> {
    const user: IUser = req.body;
    try {
        const registedUser = await register(user);
        res.status(201).json({
            message: "User created successfully",
            user: {
                _id : registedUser._id,
                type: registedUser.type,
                firstname: registedUser.firstname,
                lastname: registedUser.lastname,
                email: registedUser.email
            }
        });
    } catch (error:any) {
        if(error.message.includes("E11000 duplicate key error collection:")){
            res.status(409).json({ message: "User with email already exists!", error:error.message});
        }else{
            res.status(500).json({ message: "Unable to register user at this time!", error:error.message });
        }
    }
}

async function handleLogin(req: Request, res: Response): Promise<void> {
    const credentials = req.body;
    try {
        const user:IUserModel = await login(credentials);
        res.status(200).json({
            message: "User logged in successfully",
            user: {
                _id : user._id,
                type: user.type,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email
            }
        });
    }
    catch (error:any) {
        if(error instanceof UnableToFetchUserError){
            res.status(401).json({ message: "Unable to login user at this time", error:error.message });
        }else{
            res.status(500).json({ message: "Unable to login user at this time", error:error.message });
        }

    }
}

export default {
    handleRegister,handleLogin
};