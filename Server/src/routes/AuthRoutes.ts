import express from 'express';
import AuthControllers from '../controllers/AuthController';
import { Schemas, ValidateSchema } from '../middlewares/Validation';
import { authLimiter } from '../middlewares/RateLimit';

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  ValidateSchema(Schemas.user.create, 'body'),
  AuthControllers.handleRegister,
);
router.post(
  '/login',
  authLimiter,
  ValidateSchema(Schemas.user.login, 'body'),
  AuthControllers.handleLogin,
);

export default router;
