import { getDB } from "../../config/db";

export class IssueRepository {
    static async countByStatus(statusId: number): Promise<{ count: number }> {
        const db = await getDB();
        const result = await db.get(`SELECT COUNT(*) as count FROM issues WHERE statusId = ?`, [statusId]);
        return result;
    }
}