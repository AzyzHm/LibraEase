import express from "express";
import AuthControllers from "../controllers/AuthController";
import { Schemas, ValidateSchema } from "../middlewares/Validation";

const router = express.Router();

router.post('/register',ValidateSchema(Schemas.user.create,'body'), AuthControllers.handleRegister);
router.post('/login',ValidateSchema(Schemas.user.login,'body'), AuthControllers.handleLogin);

export default router;