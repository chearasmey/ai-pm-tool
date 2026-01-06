import { Request, Response } from "express";
import { AppError } from "../../errors/app.error";
import { ProjectRepository } from "./project.repository";
import { ProjectInterface, ProjectType } from "./project.type";
import { UserRole } from "../../constants/role.enum";

export class ProjectService {
    private readonly repo = new ProjectRepository();

    async createProject(
        user: { id: number; role: string },
        data: any
    ) {
        if (!user) {
            throw new AppError("User is unauthorized", "UNAUTHORIZED", 401);
        }
        if (!["system_admin", "project_admin"].includes(user.role)) {
            throw new AppError("No permission", "FORBIDDEN", 403);
        }

        if (await this.repo.existsKey(data.projectKey)) {
            throw new AppError("Project key has aleady in use", "PROJECT_KEY_EXISTS", 409);
        }

        return this.repo.create({
            ...data,
            createdBy: user.id
        });
    }

    async listProjects(user: {role: UserRole, id: number}, payload: any) {
        const { type, page = 1, limit = 10, search } = payload;

        const result = await this.repo.listProjects({
            type: type as ProjectType,
            userId: user.id,
            role: user.role,
            page: Number(page),
            limit: Number(limit),
            search: search as string
        });

        return {
            items: result.items,
            pagination: result.pagination
        };
    }

    async getProjectByKey(projectKey: string, currentUser: {role: UserRole, id:number}) {
        const project = await this.repo.findByKey(projectKey);
        if(!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404)
        if(currentUser.role !== "system_admin" && project.createdBy !== currentUser.id) throw new AppError("No permission to get project detail", "NO_PERMISSION", 403);
        return project;
    }

    async update(projectKey: string, payload:ProjectInterface, currentUser: {role: UserRole, id: number}){
        const project = await this.repo.findByKey(projectKey);
        if(!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404)
        if(currentUser.role !== "system_admin" && project.createdBy !== currentUser.id) throw new AppError("No permission to get project detail", "NO_PERMISSION", 403);
        return await this.repo.updateProjectByKey(projectKey, payload );
    }

    async delete(projectKey: string, currentUser: {role: UserRole, id: number}){
        const project = await this.repo.findByKey(projectKey);
        if(!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404)
        if(currentUser.role !== "system_admin" && project.createdBy !== currentUser.id) throw new AppError("No permission to get project detail", "NO_PERMISSION", 403);
        return await this.repo.deleteProjectByKey(projectKey);
    }
}
