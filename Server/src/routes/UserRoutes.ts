import express from 'express';

import UserController from '../controllers/UserController';
import { ValidateSchema, Schemas } from '../middlewares/Validation';
import { authenticate, authorize } from '../middlewares/Auth';

const router = express.Router();

router.get('/', UserController.getAllUsers);

// Must come before '/:userId' so it doesn't get swallowed by that route.
// Admin-only: exposes every pending signup's details.
router.get('/pending', authenticate, authorize('ADMIN'), UserController.getPendingUsers);

router.get('/:userId',ValidateSchema(Schemas.user.userId,'params') ,UserController.getUserById);

router.delete('/:userId', authenticate, ValidateSchema(Schemas.user.userId,'params') ,UserController.deleteUser);

router.put('/', authenticate, ValidateSchema(Schemas.user.update,'body') ,UserController.updateUser);

// Admin-only: these change another user's account status.
router.put('/:userId/approve',authenticate, authorize('ADMIN'), ValidateSchema(Schemas.user.userId,'params') ,UserController.approveUserHandler);
router.put('/:userId/reject',authenticate, authorize('ADMIN'), ValidateSchema(Schemas.user.userId,'params') ,UserController.rejectUserHandler);

export = router;