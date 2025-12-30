import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { loginSchema } from "./auth.validator";


const router = Router();
router.post("/login", validate(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/refresh-token", AuthController.refreshToken);
export default router;