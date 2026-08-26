import { Request, Response } from 'express';
import { login, register, findUserById } from '../services/UserService';
import { IUser } from '../models/User';
import { IUserModel } from '../daos/UserDao';
import { UnableToFetchUserError, AccountPendingApprovalError } from '../utils/LibraryErrors';
import { signAuthToken } from '../utils/Jwt';
import { setAuthCookies, clearAuthCookies } from '../utils/Cookies';
import { getErrorMessage } from '../utils/errors';

function publicUser(user: IUserModel) {
  return {
    id: user.id,
    type: user.type,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
  };
}

async function handleRegister(req: Request, res: Response): Promise<void> {
  const user: IUser = req.body;
  try {
    const registedUser = await register(user);
    res.status(201).json({
      message:
        'Registration submitted. An admin needs to approve your account before you can log in.',
      user: { ...publicUser(registedUser), status: registedUser.status },
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
    setAuthCookies(res, token);
    res.status(200).json({
      message: 'User logged in successfully',
      user: publicUser(user),
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

function handleLogout(req: Request, res: Response): void {
  clearAuthCookies(res);
  res.status(200).json({ message: 'Logged out successfully' });
}

async function handleMe(req: Request, res: Response): Promise<void> {
  const requester = req.user!;
  try {
    const user = await findUserById(requester.id);
    res.status(200).json({ message: 'Current user retrieved successfully', user: publicUser(user) });
  } catch (error: unknown) {
    res
      .status(401)
      .json({ message: 'Unable to retrieve current user', error: getErrorMessage(error) });
  }
}

export default {
  handleRegister,
  handleLogin,
  handleLogout,
  handleMe,
};