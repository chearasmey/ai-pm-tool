import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { SprintController } from "./sprint.controller";


const router = Router();
const controller = new SprintController();

router.use(authenticate);

router.post("/project/:projectId", controller.create);

export default router;