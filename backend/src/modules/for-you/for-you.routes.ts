import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { ForYouController } from "./for-you.controller";

const router = Router();
const controller = new ForYouController();

router.use(authenticate);
router.get("/data", controller.get);
router.get("/ai-stream", controller.aiStream);

export default router;
