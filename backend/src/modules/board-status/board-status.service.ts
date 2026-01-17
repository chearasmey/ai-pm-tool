import { UserRole } from "../../constants/role.enum";
import { AppError } from "../../errors/app.error";
import { ProjectRepository } from "../projects/project.repository";
import { ProjectRole, ProjectType } from "../projects/project.type";
import { BoardStatusRepository } from "./board-status.repository";
import { isAllowedGlobal } from "../../utils/authorization";
import { BoardStatusCategory } from "./board-status.model";
import { getDB } from "../../config/db";
import { SprintRepository } from "../sprint/sprint.repository";
import { IssueRepository } from "../issue/issue.repository";

export class BoardStatusService {
    async getBoard(projectKey: string, currentUser: { role: UserRole, id: number }) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);

        await this.requireProjectAccess(project.id, currentUser);

        if (project.type == ProjectType.SCRUM) {
            const [statuses, sprints, issues] = await Promise.all([
                BoardStatusRepository.listByProject(project.id),
                SprintRepository.listByProject(project.id),
                IssueRepository.listByProject(project.id)
            ]);

            const backlogIssues = issues.filter(issue => issue.sprintId === null);
            const sprintIssuesMap: Record<number, any[]> = {};
            for (const sprint of sprints) sprintIssuesMap[sprint.id] = [];
            for (const issue of issues) {
                if (issue.sprintId !== null && sprintIssuesMap[issue.sprintId]) {
                    sprintIssuesMap[issue.sprintId].push(issue);
                }
            }
            return { project, statuses, sprints, backlogIssues, sprintIssuesMap };
        }
        return await BoardStatusRepository.getBoardByProjectKey(project.id);
    }

    async createBoardStatus(projectKey: string, payload: { name: string; category: string }, currentUser: { role: UserRole, id: number }) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        if (currentUser.role !== "system_admin" && project.createdBy !== currentUser.id) throw new AppError("No permission to create board status", "NO_PERMISSION", 403);
        return await BoardStatusRepository.createBoardStatus(project.id, payload);
    }

    async updateBoardStatus(projectKey: string, payload: { statusId: number; name: string }, currentUser: { role: UserRole, id: number }) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
        if (currentUser.role !== "system_admin" && project.createdBy !== currentUser.id) throw new AppError("No permission to update board status", "NO_PERMISSION", 403);
        return await BoardStatusRepository.updateBoardStatus(payload);
    }

    async removeBoardStatus(statusId: number, currentUser: { role: UserRole, id: number }) {
        const status = await BoardStatusRepository.findById(statusId);
        if (!status) throw new AppError("Board status not found", "BOARD_STATUS_NOT_FOUND", 404);

        // ✅ Permission check
        if (!isAllowedGlobal(currentUser.role)) {
            const memberRole = await ProjectRepository.getUserRoleInProject(status.projectId, currentUser.id);
            if (memberRole !== ProjectRole.ADMIN) throw new AppError("No permission to delete board status", "NO_PERMISSION", 403);
        }

        // ✅ Protect last TODO / DONE
        if (status.category === BoardStatusCategory.TODO) {
            const todoCount = await BoardStatusRepository.countByCategory(status.projectId, "TODO");
            if (todoCount <= 1) throw new AppError("Cannot delete last TODO status", "CANNOT_DELETE_LAST_TODO", 403);
        }

        if (status.category === BoardStatusCategory.DONE) {
            const doneCount = await BoardStatusRepository.countByCategory(status.projectId, "DONE");
            if (doneCount <= 1) throw new AppError("Cannot delete last DONE status", "CANNOT_DELETE_LAST_DONE", 403);
        }

        // ✅ If has issues -> move to another status with SAME category
        const issueCount = await BoardStatusRepository.countIssuesByStatus(statusId);
        if (issueCount > 0) {
            const replacement = await BoardStatusRepository.findReplacementStatus(
                status.projectId,
                statusId,
                status.category
            );

            if (!replacement) {
                // no other column with same category to move issues to
                throw new AppError("No same category status to move issues to", "NO_SAME_CATEGORY_STATUS_TO_MOVE", 400);
            }

            // Move then delete (transaction recommended)
            const db = await getDB();
            await db.exec("BEGIN");
            try {
                await BoardStatusRepository.moveIssuesToStatus(statusId, replacement.id);
                await BoardStatusRepository.remove(statusId);
                await db.exec("COMMIT");
            } catch (e) {
                await db.exec("ROLLBACK");
                throw e;
            }

            return {
                movedIssues: issueCount,
                movedToStatusId: replacement.id
            };
        }

        // ✅ No issues -> delete directly
        await BoardStatusRepository.remove(statusId);
        return { movedIssues: 0, movedToStatusId: null };

    }

    private async requireProjectAccess(projectId: number, currentUser: { role: UserRole, id: number }) {
        if (isAllowedGlobal(currentUser.role)) return;
        const isMember = await ProjectRepository.isUserInProject(projectId, currentUser.id);
        if (!isMember) throw new AppError("No permission to access project", "NO_PERMISSION", 403);
    }
}