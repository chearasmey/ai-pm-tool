import { Request, Response } from "express";
import { SearchService } from "./search.service";
import { successResponse } from "../../utils/response";

const service = new SearchService();

export class SearchController {
    async suggest(req: Request, res: Response) {
        const { q, limit } = req.query as any;
        const data = await service.suggest(req.user, String(q), limit ? Number(limit) : undefined);
        return successResponse(res, data, "SEARCH_SUGGEST");
    }

    async global(req: Request, res: Response) {
        const { q, types, limit, mode } = req.query as any;
        const data = await service.global(
            req.user,
            String(q),
            types ? String(types) : undefined,
            limit ? Number(limit) : undefined,
            mode === "hybrid" ? "hybrid" : "keyword"
        );
        return successResponse(res, data, "SEARCH_GLOBAL");
    }

}
