import { Request, Response } from 'express';
import {
  findAllUsers,
  findUserById,
  removeUser,
  modifyUser,
  findPendingUsers,
  approveUser,
  rejectUser,
  promoteUser,
  demoteUser,
} from '../services/UserService';
import { UserDoesNotExistError, InvalidRoleTransitionError } from '../utils/LibraryErrors';

function sanitizeUser(user: any) {
  if (!user) return user;
  const { password, ...safeUser } = user.toObject ? user.toObject() : user;
  return safeUser;
}

async function getAllUsers(req: Request, res: Response) {
  const requester = req.user!;
  try {
    const users = await findAllUsers();
    const visibleUsers =
      requester.type === 'EMPLOYEE'
        ? users.filter((user) => user.type === 'PATRON')
        : users.filter((user) => user.type !== 'ADMIN');

    res
      .status(200)
      .json({ message: 'Users retrieved successfully', users: visibleUsers.map(sanitizeUser) });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Unable to retrieve users at this time', error: error.message });
  }
}

async function getPendingUsers(req: Request, res: Response) {
  try {
    const users = await findPendingUsers();
    res
      .status(200)
      .json({ message: 'Pending users retrieved successfully', users: users.map(sanitizeUser) });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Unable to retrieve pending users at this time', error: error.message });
  }
}

async function getUserById(req: Request, res: Response) {
  const userId = req.params.userId as string;
  const requester = req.user!;

  if (requester.type !== 'ADMIN' && requester.type !== 'EMPLOYEE' && requester.id !== userId) {
    res.status(403).json({ message: 'You can only view your own account' });
    return;
  }

  try {
    const user = await findUserById(userId);
    res.status(200).json({ message: 'User retrieved successfully', user: sanitizeUser(user) });
  } catch (error: any) {
    if (error instanceof UserDoesNotExistError) {
      res.status(404).json({ message: 'User not found', error: error.message });
    } else {
      res.status(500).json({ message: 'Unable to retrieve user', error: error.message });
    }
  }
}

async function deleteUser(req: Request, res: Response) {
  const userId = req.params.userId as string;
  const requester = req.user!;

  if (requester.type !== 'ADMIN' && requester.id !== userId) {
    res.status(403).json({ message: 'You can only delete your own account' });
    return;
  }

  try {
    const message = await removeUser(userId);
    res.status(200).json({ message });
  } catch (error: any) {
    if (error instanceof UserDoesNotExistError) {
      res.status(404).json({ message: 'User not found', error: error.message });
    } else {
      res.status(500).json({ message: 'Unable to delete user', error: error.message });
    }
  }
}

async function updateUser(req: Request, res: Response) {
  const user = req.body;
  const requester = req.user!;

  if (requester.type !== 'ADMIN' && requester.id !== user.id) {
    res.status(403).json({ message: 'You can only update your own account' });
    return;
  }

  try {
    if (requester.type !== 'ADMIN') {
      const existing = await findUserById(user.id);
      user.type = existing!.type;
    }

    const updatedUser = await modifyUser(user);
    res
      .status(200)
      .json({ message: 'User updated successfully', updatedUser: sanitizeUser(updatedUser) });
  } catch (error: any) {
    if (error instanceof UserDoesNotExistError) {
      res.status(404).json({ message: 'User not found', error: error.message });
    } else {
      res.status(500).json({ message: 'Unable to update user', error: error.message });
    }
  }
}

async function approveUserHandler(req: Request, res: Response) {
  const userId = req.params.userId as string;
  try {
    const user = await approveUser(userId);
    res.status(200).json({ message: 'User approved successfully', user: sanitizeUser(user) });
  } catch (error: any) {
    if (error instanceof UserDoesNotExistError) {
      res.status(404).json({ message: 'User not found', error: error.message });
    } else {
      res.status(500).json({ message: 'Unable to approve user', error: error.message });
    }
  }
}

async function rejectUserHandler(req: Request, res: Response) {
  const userId = req.params.userId as string;
  try {
    const user = await rejectUser(userId);
    res.status(200).json({ message: 'User rejected', user: sanitizeUser(user) });
  } catch (error: any) {
    if (error instanceof UserDoesNotExistError) {
      res.status(404).json({ message: 'User not found', error: error.message });
    } else {
      res.status(500).json({ message: 'Unable to reject user', error: error.message });
    }
  }
}

async function promoteUserHandler(req: Request, res: Response) {
  const userId = req.params.userId as string;
  try {
    const user = await promoteUser(userId);
    res.status(200).json({ message: 'User promoted to employee', user: sanitizeUser(user) });
  } catch (error: any) {
    if (error instanceof UserDoesNotExistError) {
      res.status(404).json({ message: 'User not found', error: error.message });
    } else if (error instanceof InvalidRoleTransitionError) {
      res.status(409).json({ message: error.message, error: error.message });
    } else {
      res.status(500).json({ message: 'Unable to promote user', error: error.message });
    }
  }
}

async function demoteUserHandler(req: Request, res: Response) {
  const userId = req.params.userId as string;
  try {
    const user = await demoteUser(userId);
    res.status(200).json({ message: 'User demoted to patron', user: sanitizeUser(user) });
  } catch (error: any) {
    if (error instanceof UserDoesNotExistError) {
      res.status(404).json({ message: 'User not found', error: error.message });
    } else if (error instanceof InvalidRoleTransitionError) {
      res.status(409).json({ message: error.message, error: error.message });
    } else {
      res.status(500).json({ message: 'Unable to demote user', error: error.message });
    }
  }
}

export default {
  getAllUsers,
  getPendingUsers,
  getUserById,
  deleteUser,
  updateUser,
  approveUserHandler,
  rejectUserHandler,
  promoteUserHandler,
  demoteUserHandler,
};
