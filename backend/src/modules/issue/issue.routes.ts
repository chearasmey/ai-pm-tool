import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { IssueController } from "./issue.controller";

const router = Router();
const issueController = new IssueController();

router.use(authenticate);

router.get("/count-by-status/:statusId", issueController.countByStatus);
export default router;