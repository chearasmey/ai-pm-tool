import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { BoardStatusController } from "./board-status.controller";

const router = Router();
const boardStatusController = new BoardStatusController();

router.use(authenticate);

router.get("/:projectKey", boardStatusController.getBoard);
router.post("/:projectKey", boardStatusController.createBoardStatus);
router.put("/:projectKey", boardStatusController.updateBoardStatus);
router.delete("/statuses/:statusId", boardStatusController.removeBoardStatus);

export default router;