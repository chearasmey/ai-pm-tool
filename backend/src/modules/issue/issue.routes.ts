import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { IssueController } from "./issue.controller";
import { validate } from "../../middleware/validate.middleware";
import { createIssueSchema } from "./issue.validator";

const router = Router();
const issueController = new IssueController();

router.use(authenticate);

router.get("/count-by-status/:statusId", issueController.countByStatus);
router.post("/:projectKey", validate(createIssueSchema), issueController.createIssue);
router.get("/:projectKey/meta-data", issueController.getIssueMetaData);
router.put("/:issueId/to-sprint", issueController.moveToSprint);
router.put("/:issueId/to-backlog", issueController.moveToBacklog);
router.get("/detail/:id", issueController.getIssueById);
router.put("/detail/:id", issueController.updateIssueById);
router.delete("/detail/:id", issueController.deleteIssueById);
export default router;