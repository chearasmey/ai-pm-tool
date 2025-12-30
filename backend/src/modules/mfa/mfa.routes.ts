import { Router } from "express";
import { disable, enable, generateMFA, verifyMFA } from "./mfa.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { verifyMFASchema } from "./mfa.schema";
import { validate } from "../../middleware/validate.middleware";

const router = Router();

router.post("/setup", authenticate, generateMFA);
router.post("/verify", authenticate, validate(verifyMFASchema), verifyMFA);
router.post("/enable", authenticate, enable);
router.post("/disable", authenticate, disable);

export default router;
