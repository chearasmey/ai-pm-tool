import { Router } from "express";
import { ProjectController } from "./project.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createProjectSchema } from "./project.validator";

const router = Router();
const controller = new ProjectController();

router.use(authenticate);

router.post("/", validate(createProjectSchema), controller.create);
router.get("/", controller.list);
router.get("/stars", controller.getProjectStarsByUser);
router.get("/:projectKey", controller.getByKey);
router.put("/:projectKey", controller.update);
router.delete("/:projectKey", controller.delete);
router.post("/:projectKey/members", controller.addMembers);
router.get("/:projectKey/members", controller.getProjectMembers);
router.delete("/:projectKey/members/:userId", controller.removeMember);
router.get("/:projectId/member-role", controller.getMemberRole);

export default router;