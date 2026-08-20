import express from 'express';

import UserController from '../controllers/UserController';
import { ValidateSchema, Schemas } from '../middlewares/Validation';
import { authenticate, authorize } from '../middlewares/Auth';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN','EMPLOYEE'), UserController.getAllUsers);

router.get('/pending', authenticate, authorize('ADMIN'), UserController.getPendingUsers);

router.get('/:userId', authenticate, ValidateSchema(Schemas.user.userId,'params') ,UserController.getUserById);

router.delete('/:userId', authenticate, ValidateSchema(Schemas.user.userId,'params') ,UserController.deleteUser);

router.put('/', authenticate, ValidateSchema(Schemas.user.update,'body') ,UserController.updateUser);

router.put('/:userId/approve',authenticate, authorize('ADMIN'), ValidateSchema(Schemas.user.userId,'params') ,UserController.approveUserHandler);
router.put('/:userId/reject',authenticate, authorize('ADMIN'), ValidateSchema(Schemas.user.userId,'params') ,UserController.rejectUserHandler);

router.put('/:userId/promote',authenticate, authorize('ADMIN'), ValidateSchema(Schemas.user.userId,'params') ,UserController.promoteUserHandler);
router.put('/:userId/demote',authenticate, authorize('ADMIN'), ValidateSchema(Schemas.user.userId,'params') ,UserController.demoteUserHandler);

export = router;