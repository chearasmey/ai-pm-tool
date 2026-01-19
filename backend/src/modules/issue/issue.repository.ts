import { getDB } from "../../config/db";
import { AppError } from "../../errors/app.error";
import { CreateIssueRequest } from "./issue.request";

export class IssueRepository {
    static async countByStatus(statusId: number): Promise<{ count: number }> {
        const db = await getDB();
        const result = await db.get(`SELECT COUNT(*) as count FROM issues WHERE statusId = ?`, [statusId]);
        return result;
    }

    static async createIssue(payload: CreateIssueRequest) {
        const db = await getDB();
        const result = await db.run(
            `
      INSERT INTO issues (
        projectId,
        title, type, description,
        startDate, dueDate,
        originalEstimate, remainingEstimate, timeSpent,
        priority,
        statusId, assigneeId,
        createdBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            payload.projectId,
            payload.title,
            payload.type,
            payload.description,
            payload.startDate,
            payload.dueDate,
            payload.originalEstimate,
            payload.remainingEstimate,
            payload.timeSpent,
            payload.priority,
            payload.statusId,
            payload.assigneeId,
            payload.createdBy
        );
        return await db.get(`SELECT * FROM issues WHERE id = ?`, [result.lastID]);
    }

    static async findById(id: number) {
        const db = await getDB();
        return db.get(
            `
      SELECT
        i.*,
        u.name AS assigneeName,
        bs.name AS statusName
      FROM issues i
      LEFT JOIN users u ON u.id = i.assigneeId
      LEFT JOIN board_status bs ON bs.id = i.statusId
      WHERE i.id = ?
      `,
            id
        );
    }

    static async updateStatusId(issueId: number, statusId: number) {
        const db = await getDB();
        await db.run(`UPDATE issues SET statusId = ? WHERE id = ?`, [statusId, issueId]);
        return await db.get(`SELECT * FROM issues WHERE id = ?`, [issueId]);
    }

    static async updateIssueById(id: number, updateData: any) {
        const db = await getDB();
        const fields = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = fields.map(field => `${field} = ?`).join(", ");
        values.push(id);
        await db.run(`UPDATE issues SET ${setClause} WHERE id = ?`, values);
        return await db.get(`SELECT * FROM issues WHERE id = ?`, [id]);
    }

    static async deleteIssueById(id: number, cascade: boolean) {
        const db = await getDB();
        await db.exec("BEGIN");
        let deletedIds: number[] = [];
        let deletedCount = 0;
        try {
            if (cascade) {
                const childIssues = await db.all(`SELECT id FROM issues WHERE parentId = ?`, [id]);
                deletedIds = childIssues.map((issue: any) => issue.id);
                deletedIds.push(id);
                deletedCount = deletedIds.length;

                await db.run(`DELETE FROM issues WHERE id = ?`, [id]);
                await db.run(`DELETE FROM issues WHERE parentId = ?`, [id]);
            } else {
                await db.run(`DELETE FROM issues WHERE id = ?`, [id]);
                deletedIds = [id];
                deletedCount = 1;
            }
            await db.exec("COMMIT");
            return { deletedIds, deletedCount };
        } catch (error: any) {
            await db.exec("ROLLBACK");
            throw new AppError("Failed to delete issue: " + error.message, "DELETE_ISSUE_FAILED", 500);
        }
    }

    static async listByProject(projectId: number) {
        const db = await getDB();
        return db.all(
            `
      SELECT
        i.*,
        u.name AS assigneeName,
        bs.name AS statusName
      FROM issues i
      LEFT JOIN users u ON u.id = i.assigneeId
      LEFT JOIN board_status bs ON bs.id = i.statusId
      WHERE i.projectId = ?
      ORDER BY i.createdAt DESC
      `,
            projectId
        );
    }

    static async updateSprint(issueId: number, sprintId: number) {
        const db = await getDB();
        await db.run(
            `
        UPDATE issues
        SET sprintId = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
            sprintId,
            issueId
        );
        return this.findById(issueId);
    }

    static async removeFromSprint(issueId: number) {
        const db = await getDB();
        await db.run(`
                UPDATE issues
                SET sprintId = NULL, updatedAt = CURRENT_TIMESTAMP
                WHERE id = ?
            `,
            issueId
        );
        return this.findById(issueId);
    }
}