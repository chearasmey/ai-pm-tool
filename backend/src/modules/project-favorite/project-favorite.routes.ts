import { Router } from "express";
import { ProjectFavoriteController } from "./project-favorite.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const controller = new ProjectFavoriteController();

router.use(authenticate);

router.get("/starred", controller.list);
router.post("/:projectKey/star", controller.star);
router.delete("/:projectKey/star", controller.unstar);

export default router;
