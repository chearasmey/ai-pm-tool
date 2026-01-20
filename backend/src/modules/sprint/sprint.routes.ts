import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { SprintController } from "./sprint.controller";


const router = Router();
const controller = new SprintController();

router.use(authenticate);

router.post("/project/:projectId", controller.create);
router.put("/:sprintId/start", controller.start);
router.put("/:sprintId/stop", controller.stop);
router.delete("/:sprintId/delete", controller.delete);
router.put("/:sprintId/update", controller.update);
router.get("/project/:projectId/active", controller.getIssuesFromActiveSprint);

export default router;