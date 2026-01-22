import { getDB } from "../../config/db";

export class ProjectFavoriteRepository {
    static async star(projectId: number, userId: number) {
        const db = await getDB();
        // INSERT OR IGNORE avoids duplicate unique constraint crash
        await db.run(
            `INSERT OR IGNORE INTO project_favorite (projectId, userId) VALUES (?, ?)`,
            projectId,
            userId
        );
        return true;
    }

    static async unstar(projectId: number, userId: number) {
        const db = await getDB();
        await db.run(
            `DELETE FROM project_favorite WHERE projectId = ? AND userId = ?`,
            projectId,
            userId
        );
        return true;
    }

    static async isStarred(projectId: number, userId: number): Promise<boolean> {
        const db = await getDB();
        const row = await db.get(
            `SELECT 1 FROM project_favorite WHERE projectId = ? AND userId = ? LIMIT 1`,
            projectId,
            userId
        );
        return !!row;
    }

    static async listStarredProjects(params: {
        userId: number;
        globalRole: string;
        type?: "scrum" | "kanban";
        search?: string;
        page: number;
        limit: number;
    }) {
        const db = await getDB();
        const { userId, globalRole, type, search, page, limit } = params;

        const offset = (page - 1) * limit;

        // Visibility rules:
        // SYSTEM_ADMIN -> can see all projects they starred (and can star any visible)
        // PROJECT_ADMIN -> can see starred only if createdBy = self OR member
        // NORMAL -> can see starred only if member
        //
        // We'll enforce visibility during listing by joining to project_member.

        const where: string[] = [];
        const values: any[] = [];

        // starred by user
        where.push(`pf.userId = ?`);
        values.push(userId);

        if (type) {
            where.push(`LOWER(p.type) = ?`);
            values.push(type.toLowerCase());
        }

        if (search) {
            where.push(`(p.name LIKE ? OR p.projectKey LIKE ?)`);
            values.push(`%${search}%`, `%${search}%`);
        }

        // visibility filter
        // If globalRole is SYSTEM_ADMIN => no extra filter
        // Else require either membership OR createdBy = self (for PROJECT_ADMIN)
        let visibilitySql = "";
        if (globalRole === "system_admin") {
            visibilitySql = "";
        } else if (globalRole === "project_admin") {
            visibilitySql = `
        AND (
          p.createdBy = ?
          OR EXISTS (
            SELECT 1 FROM project_member pm
            WHERE pm.projectId = p.id AND pm.userId = ?
          )
        )
      `;
            values.push(userId, userId);
        } else {
            // NORMAL
            visibilitySql = `
        AND EXISTS (
          SELECT 1 FROM project_member pm
          WHERE pm.projectId = p.id AND pm.userId = ?
        )
      `;
            values.push(userId);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")} ${visibilitySql}` : `WHERE 1=1 ${visibilitySql}`;

        // COUNT
        const countRow = await db.get(
            `
      SELECT COUNT(*) AS total
      FROM project_favorite pf
      JOIN projects p ON p.id = pf.projectId
      ${whereSql}
      `,
            values
        );

        // LIST (include lead user name)
        const rows = await db.all(
            `
      SELECT
        p.id,
        p.name,
        p.projectKey,
        p.type,
        p.description,
        p.leadUserId,
        u.name AS leadUserName,
        p.createdAt,
        p.updatedAt,
        pf.createdAt AS starredAt
      FROM project_favorite pf
      JOIN projects p ON p.id = pf.projectId
      LEFT JOIN users u ON u.id = p.leadUserId
      ${whereSql}
      ORDER BY pf.createdAt DESC
      LIMIT ? OFFSET ?
      `,
            [...values, limit, offset]
        );

        return {
            items: rows,
            page,
            limit,
            total: Number(countRow?.total ?? 0),
            totalPages: Math.ceil(Number(countRow?.total ?? 0) / limit)
        };
    }
}
