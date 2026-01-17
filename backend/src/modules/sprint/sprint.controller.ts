import { Request, Response } from "express";
import { SprintService } from "./sprint.service";

export class SprintController {
    async create(req: Request, res: Response) {
        const { projectId} = req.params;
        const user = req.user;
        const payload = req.body;

        return await SprintService.create(Number(projectId), payload, user);
    }
}