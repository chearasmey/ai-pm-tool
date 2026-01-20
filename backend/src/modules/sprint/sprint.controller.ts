import { Request, Response } from "express";
import { SprintService } from "./sprint.service";
import { successResponse } from "../../utils/response";

export class SprintController {
    async create(req: Request, res: Response) {
        const { projectId } = req.params;
        const user = req.user;
        const payload = req.body;

        const sprint =  await SprintService.create(Number(projectId), payload, user);
        return successResponse(res, sprint, "Sprint starts successfully", 201);
    }

    async start(req: Request, res: Response) {
        const sprintId = Number(req.params.sprintId);
        const sprint = await SprintService.startSprint(req.user, sprintId);
        return successResponse(res, sprint, "Sprint starts successfully");
    }

    async stop(req: Request, res: Response) {
        const sprintId = Number(req.params.sprintId);
        const sprint = await SprintService.stopSprint(req.user, sprintId);
        return successResponse(res, sprint, "Sprint stops successfully");
    }

    async getIssuesFromActiveSprint(req: Request, res: Response) {
        const projectId = Number(req.params.projectId);
        const sprint = await SprintService.getActiveSprintByProjectId(projectId);
        return successResponse(res, sprint, "Get active sprint successfully")
    }
}