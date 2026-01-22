import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { ForYouController } from "./for-you.controller";

const router = Router();
const controller = new ForYouController();

router.use(authenticate);
router.get("/", controller.get);

export default router;
