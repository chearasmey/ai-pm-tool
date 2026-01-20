import { ca, is } from "zod/locales";
import { UserRole } from "../../constants/role.enum";
import { AppError } from "../../errors/app.error";
import { ProjectRepository } from "../projects/project.repository";
import { Issue } from "./issue.model";
import { IssueRepository } from "./issue.repository";
import { CreateIssueRequest } from "./issue.request";

export class IssueService {
    async countByStatus(statusId: number): Promise<{ count: number }> {
        return await IssueRepository.countByStatus(statusId);
    }

    private async resolveStatusId(projectId: number, incomingStatusId?: number): Promise<number> {
        if (!incomingStatusId) return await ProjectRepository.getDefaultStatusId(projectId);
        const isStatusInProject = await ProjectRepository.isStatusInProject(projectId, incomingStatusId);
        return isStatusInProject ? incomingStatusId : await ProjectRepository.getDefaultStatusId(projectId);
    }

    async createIssue(user: any, projectKey: string, createIssueRequest: CreateIssueRequest): Promise<Issue> {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);

        const isMember = await ProjectRepository.isUserInProject(project.id, user.id);
        if (!isMember && ![UserRole.SYSTEM_ADMIN, UserRole.PROJECT_ADMIN].includes(user.role)) {
            throw new AppError("No permission to create issue in this project", "NO_PERMISSION", 403);
        }

        const statusId = await this.resolveStatusId(project.id, createIssueRequest.statusId);
        createIssueRequest.statusId = statusId;
        createIssueRequest.projectId = project.id;
        createIssueRequest.createdBy = user.id;

        const priority = (createIssueRequest.priority ?? "MEDIUM");
        createIssueRequest.priority = priority;

        const remaining = createIssueRequest.remainingEstimate === undefined
            ? createIssueRequest.originalEstimate ?? null
            : createIssueRequest.remainingEstimate;
        createIssueRequest.remainingEstimate = remaining;

        return await IssueRepository.createIssue(createIssueRequest);
    }

    async getIssueMetaData(user: any, projectKey: string): Promise<any> {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        const isMember = await ProjectRepository.isUserInProject(project.id, user.id);
        if (!isMember && ![UserRole.SYSTEM_ADMIN, UserRole.PROJECT_ADMIN].includes(user.role)) {
            throw new AppError("No permission to create issue in this project", "NO_PERMISSION", 403);
        }

        const [statuses, members, defaultStatusId] = await Promise.all([
            ProjectRepository.listStatuses(project.id),
            ProjectRepository.listProjectMembers(project.id),
            ProjectRepository.getDefaultStatusId(project.id)
        ]);

        return {
            project,
            statuses,
            members,
            defaultStatusId
        };
    }
    async moveIssue(issueId: number, statusId: number) {
        const issue = await IssueRepository.findById(issueId);
        if (!issue) throw new AppError("Issue not found", "ISSUE_NOT_FOUND", 404);
        const isStatusInProject = await ProjectRepository.isStatusInProject(issue.projectId, issue.statusId);
        if (!isStatusInProject) throw new AppError("Status not found in project", "STATUS_NOT_IN_PROJECT", 404);

        return await IssueRepository.moveIssueTo(issueId, statusId);
    }

    async moveToSprint(issueId: number, sprintId: number): Promise<Issue> {
        const issue = await IssueRepository.findById(issueId);
        if (!issue) throw new AppError("Issue not found", "ISSUE_NOT_FOUND", 404);
        const isStatusInProject = await ProjectRepository.isStatusInProject(issue.projectId, issue.statusId);
        if (!isStatusInProject) throw new AppError("Status not found in project", "STATUS_NOT_IN_PROJECT", 404);

        return await IssueRepository.updateSprint(issueId, sprintId);
    }

    async moveToBacklog(issueId: number) {
        const issue = await IssueRepository.findById(issueId);
        if (!issue) throw new AppError("Issue not found", "ISSUE_NOT_FOUND", 404);
        const isStatusInProject = await ProjectRepository.isStatusInProject(issue.projectId, issue.statusId);
        if (!isStatusInProject) throw new AppError("Status not found in project", "STATUS_NOT_IN_PROJECT", 404);

        return await IssueRepository.removeFromSprint(issueId);
    }

    async getIssueById(id: number, user: any): Promise<Issue> {
        const issue = await IssueRepository.findById(id);
        if (!issue) throw new AppError("Issue not found", "ISSUE_NOT_FOUND", 404);
        const project = await ProjectRepository.findById(issue.projectId);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        const isMember = await ProjectRepository.isUserInProject(project.id, user.id);
        if (!isMember && ![UserRole.SYSTEM_ADMIN, UserRole.PROJECT_ADMIN].includes(user.role)) {
            throw new AppError("No permission to create/update/delete issue in this project", "NO_PERMISSION", 403);
        }
        return issue;
    }

    async updateIssueById(id: number, updateData: any, user: any): Promise<Issue> {
        const issue = await this.getIssueById(id, user);

        if (!issue) throw new AppError("Issue not found", "ISSUE_NOT_FOUND", 404);

        return await IssueRepository.updateIssueById(id, updateData);
    }

    async deleteIssueById(id: number, user: any, cascade: boolean): Promise<{ deletedIds: number[], deletedCount: number }> {
        const issue = await this.getIssueById(id, user);
        if (!issue) throw new AppError("Issue not found", "ISSUE_NOT_FOUND", 404);
        return await IssueRepository.deleteIssueById(id, cascade);
    }
}