import { getDB } from "../../config/db";

export type IndexProjectRow = {
    id: number;
    projectKey: string;
    type: string; // SCRUM/KANBAN
    name: string;
    description: string | null;
    updatedAt: string | null;
    createdAt: string | null;
};

export type IndexIssueRow = {
    id: number;
    projectId: number;
    type: string; // EPIC/STORY/TASK/BUG/SUBTASK...
    title: string;
    description: string | null;
    status: string | null; // your issues.status
    updatedAt: string | null;
    createdAt: string | null;
};

export class SemanticRepository {
    async listAllProjects(): Promise<IndexProjectRow[]> {
        const db = await getDB();
        return db.all(
            `
      SELECT id, projectKey, type, name, description, updatedAt, createdAt
      FROM projects
      ORDER BY id ASC
      `
        );
    }

    async listAllIssues(): Promise<IndexIssueRow[]> {
        const db = await getDB();

        return db.all(
            `
      SELECT i.id, i.projectId, i.type, i.title, i.description, bs.name AS status, i.updatedAt, i.createdAt
      FROM issues i
      LEFT JOIN board_status bs ON bs.id = i.statusId
      ORDER BY i.id ASC
      `
        );
    }
}
