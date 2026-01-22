import { Request, Response } from "express";
import { ProjectFavoriteService } from "./project-favorite.service";
import { successResponse } from "../../utils/response";


const service = new ProjectFavoriteService();

export class ProjectFavoriteController {
    async list(req: Request, res: Response) {
        const data = await service.listStarred(req.user, req.query);
        return successResponse(res, data, "STARRED_PROJECTS");
    }

    async star(req: Request, res: Response) {
        const data = await service.starProject(req.user, req.params.projectKey);
        return successResponse(res, data, "PROJECT_STARRED", 201);
    }

    async unstar(req: Request, res: Response) {
        const data = await service.unstarProject(req.user, req.params.projectKey);
        return successResponse(res, data, "PROJECT_UNSTARRED", 200);
    }
}
