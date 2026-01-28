import { Request, Response } from "express";
import { SemanticService } from "./semantic.service";
import { errorResponse, successResponse } from "../../utils/response";

const service = new SemanticService();

export class SemanticController {
    async reindex(req: Request, res: Response) {
        try {
            if (req.user?.role !== "system_admin") {
                return errorResponse(res, "FORBIDDEN", "FORBIDDEN", 403);
            }

            const result = await service.reindexAll();
            return successResponse(res, result, "SEMANTIC_REINDEX_DONE");
        } catch (err: any) {
            return errorResponse(
                res,
                err?.message || "REINDEX_FAILED",
                "SEMANTIC_REINDEX_FAILED",
                500
            );
        }
    }
}
