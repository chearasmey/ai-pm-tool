import { Request, Response } from "express";
import { ProjectService } from "./project.service";
import { successResponse } from "../../utils/response";

const service = new ProjectService();

export class ProjectController {
  async create(req: Request, res: Response) {
    const project = await service.createProject(
      req.user,
      req.body
    );

    return successResponse(res, project, "PROJECT_CREATED", 201);
  }
}
