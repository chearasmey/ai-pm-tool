import { UserRole } from "../../constants/role.enum";
import { AppError } from "../../errors/app.error";
import { ProjectRepository } from "../projects/project.repository";
import { SprintRepository } from "./sprint.repository";

export class SprintService {
    static async create(projectId: number, payload: { name: string; startDate?: string; endDate?: string; goal?: string | null }, user: any) {
        return await SprintRepository.create(projectId, { ...payload, createdBy: user.id });
    };

    private static async requireSprintAdmin(user: any, projectId: number) {
        // Glob admins
        if ([UserRole.SYSTEM_ADMIN, UserRole.PROJECT_ADMIN].includes(user.role)) return;

        // Project role must be admin
        const memberRole = await ProjectRepository.getUserRoleInProject(projectId, user.id);
        if (memberRole !== "admin") throw new AppError("No permission to get project detail", "NO_PERMISSION", 403);
    }

    static async startSprint(user: any, sprintId: number) {
        const sprint = await SprintRepository.findById(sprintId);
        if (!sprint) throw new AppError("Sprint not found", "SPRINT_NOT_FOUND", 404);

        await this.requireSprintAdmin(user, sprint.projectId);

        const issueCount = await SprintRepository.countIssuesInSprint(sprintId);
        console.log({ issueCount });

        if (issueCount < 1) throw new AppError("Sprint is empty", "SPRINT_EMPTY");

        const hasActive = await SprintRepository.hasActiveSprint(sprint.projectId);
        if (hasActive) throw new AppError("Sprint have already active", "ACTIVE_SPRINT_EXISTS");

        return SprintRepository.startSprint(sprintId);
    }

    static async stopSprint(user: any, sprintId: number) {
        const sprint = await SprintRepository.findById(sprintId);
        if (!sprint) throw new AppError("Sprint not found", "SPRINT_NOT_FOUND", 404);

        await this.requireSprintAdmin(user, sprint.projectId);

        return SprintRepository.stopSprint(sprintId);
    }

    static async deleteSprint(user: any, sprintId: number) {
        const sprint = await SprintRepository.findById(sprintId);
        if (!sprint) throw new AppError("Sprint not found", "SPRINT_NOT_FOUND", 404);

        await this.requireSprintAdmin(user, sprint.projectId);

        return SprintRepository.deleteSprint(sprintId);
    }

    static async updateSprint(user: any, sprintId: number, payload: any) {
        const sprint = await SprintRepository.findById(sprintId);
        if (!sprint) throw new AppError("Sprint not found", "SPRINT_NOT_FOUND", 404);

        await this.requireSprintAdmin(user, sprint.projectId);

        return SprintRepository.updateSprint(sprintId, payload);
    }

    static async getActiveSprintByProjectId(projectId: number) {
        const sprint = await SprintRepository.findActiveByProjectId(projectId);
        if (!sprint) throw new AppError("Sprint not found", "SPRINT_NOT_FOUND", 404);

        return sprint;
    }
}