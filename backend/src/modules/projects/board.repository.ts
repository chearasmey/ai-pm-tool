import { getDB } from "../../config/db";
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

export class BoardRepository {
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
      FROM issue i
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
        FROM issue i
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
      FROM issue i
      LEFT JOIN users u ON u.id = i.assigneeId
      WHERE i.projectId = ? AND i.sprintId IS NULL
      ORDER BY i.updatedAt DESC, i.id DESC
      `,
      project.id
    );

    return {
      project,
      activeSprint: activeSprint??null,
      columns,
      backlog
    };

  }
}