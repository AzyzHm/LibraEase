import express from 'express';
import AuthControllers from '../controllers/AuthController';
import { Schemas, ValidateSchema } from '../middlewares/Validation';
import { authLimiter } from '../middlewares/RateLimit';
import { authenticate } from '../middlewares/Auth';

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
router.post('/logout', AuthControllers.handleLogout);
router.get('/me', authenticate, AuthControllers.handleMe);

export default router;
