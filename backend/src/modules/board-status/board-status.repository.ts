import { getDB } from "../../config/db";
import { AppError } from "../../errors/app.error";
import { ProjectType } from "../projects/project.type";
import { BoardStatus } from "./board-status.model";
export type BoardColumn = {
    id: number;
    name: string;
    category: "TODO" | "IN_PROGRESS" | "DONE";
    position: number;
    issues: BoardIssue[];
};

export type BoardIssue = {
    id: number;
    projectId: number;
    sprintId: number | null;
    type: "EPIC" | "STORY" | "TASK" | "BUG" | "SUBTASK";
    title: string;
    description: string | null;
    statusId: number;
    assigneeId: number | null;
    assigneeName: string | null;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
};

export type SprintSummary = {
    id: number;
    name: string;
    goal: string | null;
    startDate: string | null;
    endDate: string | null;
    status: "PLANNED" | "ACTIVE" | "COMPLETED";
};

export class BoardStatusRepository {
    static async seedDefaults(projectId: number, type: ProjectType) {
        const db = await getDB();

        const statuses =
            type === "scrum"
                ? [
                    { name: "To Do", category: "TODO", position: 1 },
                    { name: "In Progress", category: "IN_PROGRESS", position: 2 },
                    { name: "QA", category: "IN_PROGRESS", position: 3 },
                    { name: "Done", category: "DONE", position: 4 }
                ]
                : [
                    { name: "To Do", category: "TODO", position: 1 },
                    { name: "Done", category: "DONE", position: 2 }
                ];

        const stmt = await db.prepare(`
                                INSERT INTO board_status (projectId, name, category, position)
                                VALUES (?, ?, ?, ?)
                                `);

        try {
            await db.exec("BEGIN");
            for (const s of statuses) {
                await stmt.run(projectId, s.name, s.category, s.position);
            }
            await db.exec("COMMIT");
        } catch (e) {
            await db.exec("ROLLBACK");
            throw e;
        } finally {
            await stmt.finalize();
        }
    }
    static async getBoardByProjectKey(id: number): Promise<{
        project: { id: number; projectKey: string; name: string; type: string };
        columns: BoardColumn[];
    }> {
        const db = await getDB();
        // 1) Resolve project
        const project = await db.get(
            `SELECT id, projectKey, name, type
       FROM projects
       WHERE id = ?`,
            id
        );

        if (!project) {
            throw new Error("PROJECT_NOT_FOUND");
        }


        // 2) Load statuses (board columns)
        const statuses = await db.all(
            `SELECT id, name, category, position
       FROM board_status
       WHERE projectId = ?
       ORDER BY position ASC, id ASC`,
            id
        );

        // 3) Load issues joined with users for assigneeName
        // NOTE: We return statusId to group in code (fast enough for typical boards).
        const issues: BoardIssue[] = await db.all(
            `
      SELECT
        i.id,
        i.projectId,
        i.type,
        i.title,
        i.description,
        i.statusId,
        i.assigneeId,
        u.name AS assigneeName,
        i.createdBy,
        i.createdAt,
        i.updatedAt
      FROM issues i
      LEFT JOIN users u ON u.id = i.assigneeId
      WHERE i.projectId = ?
      ORDER BY i.updatedAt DESC, i.id DESC
      `,
            id
        );

        // 4) Group issues by statusId
        const issuesByStatusId = new Map<number, BoardIssue[]>();
        for (const issue of issues) {
            const arr = issuesByStatusId.get(issue.statusId) ?? [];
            arr.push(issue);
            issuesByStatusId.set(issue.statusId, arr);
        }

        // 5) Build columns with issues
        const columns: BoardColumn[] = statuses.map((s: any) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            position: s.position,
            issues: issuesByStatusId.get(s.id) ?? []
        }));

        return { project, columns };

    }

    static async getScrumBoardByProjectKey(projectKey: string): Promise<{
        project: { id: number; projectKey: string; name: string; type: string };
        activeSprint: SprintSummary | null | undefined;
        columns: BoardColumn[];
        backlog: BoardIssue[];
    }> {
        const db = await getDB();

        // 1) Resolve project
        const project = await db.get(
            `SELECT id, projectKey, name, type
       FROM projects
       WHERE projectKey = ?`,
            projectKey
        );
        if (!project) throw new Error("PROJECT_NOT_FOUND");

        // 2) Load statuses (board columns)
        const statuses = await db.all(
            `SELECT id, name, category, position
       FROM board_status
       WHERE projectId = ?
       ORDER BY position ASC, id ASC`,
            project.id
        );

        // 3) Load active sprint (Scrum)
        const activeSprint: SprintSummary | null | undefined = await db.get(
            `SELECT id, name, goal, startDate, endDate, status
       FROM sprint
       WHERE projectId = ? AND status = 'ACTIVE'
       ORDER BY createdAt DESC
       LIMIT 1`,
            project.id
        );

        // 4) Load sprint issues (only if active sprint exists)
        let sprintIssues: BoardIssue[] = [];
        if (activeSprint) {
            sprintIssues = await db.all(
                `
        SELECT
          i.id,
          i.projectId,
          i.sprintId,
          i.type,
          i.title,
          i.description,
          i.statusId,
          i.assigneeId,
          u.name AS assigneeName,
          i.createdBy,
          i.createdAt,
          i.updatedAt
        FROM issues i
        LEFT JOIN users u ON u.id = i.assigneeId
        WHERE i.projectId = ? AND i.sprintId = ?
        ORDER BY i.updatedAt DESC, i.id DESC
        `,
                project.id,
                activeSprint.id
            );
        }

        // 5) Group sprint issues by statusId
        const sprintIssuesByStatusId = new Map<number, BoardIssue[]>();
        for (const issue of sprintIssues) {
            const arr = sprintIssuesByStatusId.get(issue.statusId) ?? [];
            arr.push(issue);
            sprintIssuesByStatusId.set(issue.statusId, arr);
        }

        // 6) Build columns with issues
        const columns: BoardColumn[] = statuses.map((s: any) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            position: s.position,
            issues: sprintIssuesByStatusId.get(s.id) ?? []
        }));

        // 7) Load backlog issues (sprintId IS NULL)
        const backlog: BoardIssue[] = await db.all(
            `
      SELECT
        i.id,
        i.projectId,
        i.sprintId,
        i.type,
        i.title,
        i.description,
        i.statusId,
        i.assigneeId,
        u.name AS assigneeName,
        i.createdBy,
        i.createdAt,
        i.updatedAt
      FROM issues i
      LEFT JOIN users u ON u.id = i.assigneeId
      WHERE i.projectId = ? AND i.sprintId IS NULL
      ORDER BY i.updatedAt DESC, i.id DESC
      `,
            project.id
        );

        return {
            project,
            activeSprint: activeSprint ?? null,
            columns,
            backlog
        };

    }

    static async createBoardStatus(projectId: number, payload: { name: string; category: string }) {
        const db = await getDB();
        const result = await db.run(
            `INSERT INTO board_status (projectId, name, category, position) VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM board_status WHERE projectId = ?))`,
            projectId,
            payload.name,
            payload.category,
            projectId
        );
        return { id: result.lastID };
    }

    static async updateBoardStatus(payload: { statusId: number; name: string }) {
        const db = await getDB();
        const name = payload.name.trim();
        if (!name) throw new AppError("Board status name cannot be empty", "NAME_REQUIRED", 400);


        const current = await db.get(
            `SELECT id, projectId, name
       FROM board_status
       WHERE id = ?`,
            payload.statusId
        );
        if (!current) throw new AppError("Board status not found", "BOARD_STATUS_NOT_FOUND", 404);
        const currentName = String(current.name).trim();

        if (currentName.toLocaleLowerCase() === name.toLocaleLowerCase()) {
            // No changes
            return current;
        }

        const conflict = await db.get(
            `SELECT id
       FROM board_status
       WHERE projectId = ?
         AND LOWER(name) = LOWER(?)
         AND id != ?`,
            current.projectId,
            name,
            payload.statusId
        );

        if (conflict) {
            throw new AppError("Board status name already exists", "NAME_EXISTS", 400);
        }

        // 4) Update normally
        await db.run(
            `UPDATE board_status
       SET name = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
            name,
            payload.statusId
        );

        return db.get(
            `SELECT id, projectId, name, category, position, createdAt, updatedAt
       FROM board_status
       WHERE id = ?`,
            payload.statusId
        );
    }

    static async findById(id: number): Promise<BoardStatus | null> {
        const db = await getDB();
        const result = await db.get(
            `SELECT id, projectId, name, category, position, createdAt, updatedAt
       FROM board_status
       WHERE id = ?`,
            id
        );
        return result ?? null;
    }

    static async countByCategory(projectId: number, category: string) {
        const db = await getDB();
        const result = await db.get(
            `SELECT COUNT(*) as count
       FROM board_status
       WHERE projectId = ? AND category = ?`,
            projectId,
            category
        );
        return result.count ?? 0;
    }

    static async findReplacementStatus(projectId: number, excludeStatusId: number, category: string) {
        const db = await getDB();
        return db.get(
            `SELECT id, name, category, position
       FROM board_status
       WHERE projectId = ? AND category = ? AND id != ?
       ORDER BY position ASC LIMIT 1`,
            projectId,
            category,
            excludeStatusId
        );
    }

    static async countIssuesByStatus(statusId: number): Promise<number> {
        const db = await getDB();
        const row = await db.get(
            `SELECT COUNT(*) AS cnt FROM issues WHERE statusId = ?`,
            statusId
        );
        return row?.cnt ?? 0;
    }

    static async moveIssuesToStatus(fromStatusId: number, toStatusId: number) {
        const db = await getDB();
        // move all issues from old column to replacement column
        await db.run(
            `UPDATE issues
       SET statusId = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE statusId = ?`,
            toStatusId,
            fromStatusId
        );
    }

    static async remove(statusId: number) {
        const db = await getDB();
        await db.run(`DELETE FROM board_status WHERE id = ?`, statusId);
    }

}