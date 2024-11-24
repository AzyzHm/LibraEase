import express from 'express';

import UserController from '../controllers/UserController';
import { ValidateSchema, Schemas } from '../middlewares/Validation';

const router = express.Router();

router.get('/', UserController.getAllUsers);

router.get('/:userId',ValidateSchema(Schemas.user.userId,'params') ,UserController.getUserById);

router.delete('/:userId',ValidateSchema(Schemas.user.userId,'params') ,UserController.deleteUser);

router.put('/',ValidateSchema(Schemas.user.update,'body') ,UserController.updateUser);

export = router;