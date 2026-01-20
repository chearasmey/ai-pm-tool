import { getDB } from "../../config/db";

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export class SprintRepository {
    static async listByProject(projectId: number) {
        const db = await getDB();
        return db.all(
            `
      SELECT id, projectId, name, status, startDate, endDate, goal, createdAt, updatedAt
      FROM sprints
      WHERE projectId = ?
      ORDER BY id ASC
      `,
            projectId
        );
    }

    static async findById(id: number) {
        const db = await getDB();
        return db.get(
            `SELECT id, projectId, name, status, startDate, endDate, goal FROM sprints WHERE id = ?`,
            id
        );
    }

    static async hasActiveSprint(projectId: number) {
        const db = await getDB();
        const row = await db.get(
            `SELECT 1 FROM sprints WHERE projectId = ? AND status = 'ACTIVE' LIMIT 1`,
            projectId
        );
        return !!row;
    }

    static async create(projectId: number, payload: { name: string; startDate?: string; endDate?: string; goal?: string | null, createdBy: number }) {
        const db = await getDB();
        const r = await db.run(
            `
      INSERT INTO sprints (projectId, name, status, startDate, endDate, goal, createdBy)
      VALUES (?, ?, 'PLANNED', ?, ?, ?, ?)
      `,
            projectId,
            payload.name,
            payload.startDate ?? null,
            payload.endDate ?? null,
            payload.goal ?? null,
            payload.createdBy
        );

        return this.findById(r.lastID!);
    }

    static async startSprint(id: number) {
        const db = await getDB();
        await db.run(
            `
      UPDATE sprints
      SET status = 'ACTIVE',
          startDate = COALESCE(startDate, CURRENT_TIMESTAMP),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
            id
        );
        return this.findById(id);
    }

    static async stopSprint(id: number) {
        const db = await getDB();
        await db.run(
            `
      UPDATE sprints
      SET status = 'COMPLETED',
          startDate = COALESCE(startDate, CURRENT_TIMESTAMP),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
            id
        );
        return this.findById(id);
    }

    static async countIssuesInSprint(sprintId: number) {
        const db = await getDB();

        const row = await db.get(`
                SELECT COUNT(*) AS cnt FROM issues 
                WHERE sprintId = ?
            `, sprintId);

        return Number(row?.cnt ?? 0);
    }

    static async findActiveByProjectId(projectId: number) {
        const db = await getDB();
        const activedSprint = await db.get(`
                SELECT * FROM sprints WHERE projectId = ? AND status='ACTIVE' LIMIT 1
            `, projectId);
        if (!activedSprint) return { sprint: {}, issues: [] }

        const issues = await db.all(`
                SELECT *
                FROM issues
                WHERE sprintId = ?
            `,
            activedSprint.id
        );

        return { sprint: activedSprint, issues };
    }
}
