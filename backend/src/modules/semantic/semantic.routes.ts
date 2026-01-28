import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { SemanticController } from "./semantic.controller";

const router = Router();
const controller = new SemanticController();

router.use(authenticate);

router.post("/reindex", controller.reindex);

export default router;
