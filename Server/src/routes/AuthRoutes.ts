import express from "express";
import AuthControllers from "../controllers/AuthControllers";
import { Schemas, ValidateSchema } from "../middlewares/Validation";

const router = express.Router();

router.post('/register',ValidateSchema(Schemas.user.create), AuthControllers.handleRegister);
router.post('/login',ValidateSchema(Schemas.user.login), AuthControllers.handleLogin);

export default router;