import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { SearchController } from "./search.controller";
import { globalSearchSchema, suggestSchema } from "./search.validator";

const router = Router();
const controller = new SearchController();

router.use(authenticate);

router.get("/", validate(globalSearchSchema), controller.global);
router.get("/suggest", validate(suggestSchema), controller.suggest);

export default router;
