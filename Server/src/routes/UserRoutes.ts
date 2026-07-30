import express from 'express';

import UserController from '../controllers/UserController';
import { ValidateSchema, Schemas } from '../middlewares/Validation';

const router = express.Router();

router.get('/', UserController.getAllUsers);

// Must come before '/:userId' so it doesn't get swallowed by that route.
router.get('/pending', UserController.getPendingUsers);

router.get('/:userId',ValidateSchema(Schemas.user.userId,'params') ,UserController.getUserById);

router.delete('/:userId',ValidateSchema(Schemas.user.userId,'params') ,UserController.deleteUser);

router.put('/',ValidateSchema(Schemas.user.update,'body') ,UserController.updateUser);

// TODO: gate these behind an admin-only auth middleware once one exists —
// right now anyone who can hit the API can approve/reject signups.
router.put('/:userId/approve',ValidateSchema(Schemas.user.userId,'params') ,UserController.approveUserHandler);
router.put('/:userId/reject',ValidateSchema(Schemas.user.userId,'params') ,UserController.rejectUserHandler);

export = router;
