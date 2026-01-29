import { Router } from "express";
import { UserController } from "./user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { UserRole } from "../../constants/role.enum";
import { validate } from "../../middleware/validate.middleware";
import { changePasswordSchema, createUserSchema } from "./user.validator";


const router = Router();


router.get("/", authenticate, UserController.list);
router.post("/", authenticate, validate(createUserSchema), requireRole([UserRole.SYSTEM_ADMIN]), UserController.create);
router.get("/me", authenticate, UserController.me);
router.put("/change-password", authenticate, validate(changePasswordSchema), UserController.updatePassword);
router.put("/:uuid", authenticate, requireRole([UserRole.SYSTEM_ADMIN]), UserController.update);
router.get("/admin/list", authenticate, requireRole([UserRole.SYSTEM_ADMIN]), UserController.getSystemUsers);
router.post("/create", authenticate, requireRole([UserRole.SYSTEM_ADMIN]), UserController.createSystemUser);
router.put("/:id/update", authenticate, requireRole([UserRole.SYSTEM_ADMIN]), UserController.updateSystemUser);
router.post("/:id/reset-password", authenticate, requireRole([UserRole.SYSTEM_ADMIN]), UserController.resetPassword);
router.delete("/:id/delete", authenticate, requireRole([UserRole.SYSTEM_ADMIN]), UserController.delete);

export default router;