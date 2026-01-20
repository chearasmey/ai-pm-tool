import { AppError } from "../../errors/app.error";
import { ProjectRepository } from "./project.repository";
import { ProjectRole, ProjectType } from "./project.type";
import { UserRole } from "../../constants/role.enum";
import { Project } from "./project.model";
import { BoardStatusRepository } from "../board-status/board-status.repository";

export class ProjectService {
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

        if (await ProjectRepository.existsKey(data.projectKey)) {
            throw new AppError("Project key has aleady in use", "PROJECT_KEY_EXISTS", 409);
        }

        const project = await ProjectRepository.create({
            ...data,
            createdBy: user.id
        });

        if (project) {
            await BoardStatusRepository.seedDefaults(project.id, project.type);
        }

        return project;

    }

    async listProjects(user: { role: UserRole, id: number }, payload: any) {
        const { type, page = 1, limit = 10, search } = payload;

        const result = await ProjectRepository.listProjects({
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

    private async requireProjectOrSystemAdmin(user: any, projectId: number) {
        // Glob admins
        if ([UserRole.SYSTEM_ADMIN, UserRole.PROJECT_ADMIN].includes(user.role)) return;

        // Project role must be admin
        const memberRole = await ProjectRepository.getUserRoleInProject(projectId, user.id);
        if (memberRole !== "admin") throw new AppError("No permission to get project detail", "NO_PERMISSION", 403);
    }

    async getProjectByKey(projectKey: string, currentUser: { role: UserRole, id: number }) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        await this.requireProjectOrSystemAdmin(currentUser, project.id);
        return project;
    }

    async update(projectKey: string, payload: Project, currentUser: { role: UserRole, id: number }) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        await this.requireProjectOrSystemAdmin(currentUser, project.id);

        return await ProjectRepository.updateProjectByKey(projectKey, payload);
    }

    async delete(projectKey: string, currentUser: { role: UserRole, id: number }) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        await this.requireProjectOrSystemAdmin(currentUser, project.id);

        return await ProjectRepository.deleteProjectByKey(projectKey);
    }

    async addMembers(projectKey: string, currentUser: { role: UserRole, id: number }, payload: { userIds: number[], role: ProjectRole }) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        await this.requireProjectOrSystemAdmin(currentUser, project.id);

        return await ProjectRepository.addMembers(project.id, payload);
    }

    async getProjectMembers(projectKey: string, search?: string) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        return search ? await ProjectRepository.findProjectMembers(projectKey, search) : await ProjectRepository.listProjectMembers(project.id);
    }

    async removeMember(projectKey: string, currentUser: { role: UserRole, id: number }, userId: number) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        await this.requireProjectOrSystemAdmin(currentUser, project.id);

        return await ProjectRepository.removeMember(project.id, userId);
    }

    async getBoard(projectKey: string, currentUser: { role: UserRole, id: number }) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        await this.requireProjectOrSystemAdmin(currentUser, project.id);

        return project.type == ProjectType.SCRUM ? await BoardStatusRepository.getScrumBoardByProjectKey(projectKey) : await BoardStatusRepository.getBoardByProjectKey(project.id);
    }

    async getMemberRole(projectId: number, currentUser: { role: UserRole, id: number }) {
        return await ProjectRepository.getMemberRole(projectId, currentUser.id);
    }
}
