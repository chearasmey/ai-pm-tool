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

    return successResponse(res, project, "Project has been created", 201);
  }

  async list(req: Request, res: Response) {
    const user = req.user;
    const payload = req.query;
    const projects = await service.listProjects(user, payload);
    return successResponse(res, projects, "Get project list successfully", 200);
  }

  async getByKey(req: Request, res: Response) {
    const { projectKey } = req.params;
    const user = req.user;
    const projects = await service.getProjectByKey(projectKey, user);
    return successResponse(res, projects, "Get project successful", 200);
  }

  async update(req: Request, res: Response) {
    const { projectKey } = req.params;
    const user = req.user;
    const payload = req.body;
    const projects = await service.update(projectKey, payload, user);
    return successResponse(res, projects, "Update project successful", 200);
  }

  async delete(req: Request, res: Response) {
    const { projectKey } = req.params;
    const user = req.user;
    await service.delete(projectKey, user);
    return successResponse(res, null, "The project has been deleted successfull", 200);
  }

  async addMembers(req: Request, res: Response) {
    const { projectKey } = req.params;
    const user = req.user;
    const payload = req.body;
    await service.addMembers(projectKey, user, payload);
    return successResponse(res, null, "Add members successfully", 201);
  }

  async getProjectMembers(req: Request, res: Response) {
    const { projectKey } = req.params;
    const { search } = req.query;
    const members = search ? await service.getProjectMembers(projectKey, search as string) : await service.getProjectMembers(projectKey);
    return successResponse(res, members, "Get members successfully", 200);
  }

  async removeMember(req: Request, res: Response) {
    const { projectKey, userId } = req.params;
    const user = req.user;
    await service.removeMember(projectKey, user, Number(userId));
    return successResponse(res, null, "Remove user successfully", 200);

  }

  async getBoard(req: Request, res: Response) {
    const { projectKey } = req.params;
    const user = req.user;
    const boards = await service.getBoard(projectKey, user);
    return successResponse(res, boards, "Get boards successfully", 200);
  }

  async getMemberRole(req: Request, res: Response) {
    const projectId = Number(req.params.projectId);
    const user = req.user;
    const member = await service.getMemberRole(projectId, user);
    return successResponse(res, member, "Get member role successfully", 200);
  }
  
  async getProjectStarsByUser(req: Request, res: Response) {
    const user = req.user;
    const projectIds = await service.getProjectStarsByUser(user);
    return successResponse(res, projectIds, "Get stars project ids successfully", 200);
  }

}
