import { Request, Response } from 'express';
import { login, register } from '../services/UserService';
import { IUser } from '../models/User';
import { IUserModel } from '../daos/UserDao';
import { UnableToFetchUserError, AccountPendingApprovalError } from '../utils/LibraryErrors';
import { signAuthToken } from '../utils/Jwt';
import { getErrorMessage } from '../utils/errors';

async function handleRegister(req: Request, res: Response): Promise<void> {
  const user: IUser = req.body;
  try {
    const registedUser = await register(user);
    res.status(201).json({
      message:
        'Registration submitted. An admin needs to approve your account before you can log in.',
      user: {
        id: registedUser.id,
        type: registedUser.type,
        firstname: registedUser.firstname,
        lastname: registedUser.lastname,
        email: registedUser.email,
        status: registedUser.status,
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (message.includes('already exists')) {
      res.status(409).json({ message: 'User with email already exists!', error: message });
    } else {
      res.status(500).json({ message: 'Unable to register user at this time!', error: message });
    }
  }
}

async function handleLogin(req: Request, res: Response): Promise<void> {
  const credentials = req.body;
  try {
    const user: IUserModel = await login(credentials);
    const token = signAuthToken(user);
    res.status(200).json({
      message: 'User logged in successfully',
      token,
      user: {
        id: user.id,
        type: user.type,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AccountPendingApprovalError) {
      res.status(403).json({ message: error.message, error: error.message });
    } else if (error instanceof UnableToFetchUserError) {
      res.status(401).json({ message: 'Incorrect email or password', error: error.message });
    } else {
      const message = getErrorMessage(error);
      res.status(500).json({ message: 'Unable to login user at this time', error: message });
    }
  }
}

export default {
  handleRegister,
  handleLogin,
};