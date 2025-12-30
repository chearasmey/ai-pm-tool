import { Router } from "express";
import { UserController } from "./user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { UserRole } from "../../constants/role.enum";
import { validate } from "../../middleware/validate.middleware";
import { changePasswordSchema, createUserSchema } from "./user.validator";


const router = Router();


router.get("/", authenticate, requireRole([UserRole.SYSTEM_ADMIN]), UserController.list);
router.post("/", authenticate, validate(createUserSchema), requireRole([UserRole.SYSTEM_ADMIN]), UserController.create);
router.get("/me", authenticate, UserController.me);
router.put("/change-password", authenticate, validate(changePasswordSchema), UserController.updatePassword);
router.put("/:uuid", authenticate, requireRole([UserRole.SYSTEM_ADMIN]), UserController.update);


export default router;