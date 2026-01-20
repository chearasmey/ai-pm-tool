import { getDB } from "../../config/db";
import { Project } from "./project.model";
import { ProjectRole, ProjectType } from "./project.type";

export class ProjectRepository {
    static async create(data: {
        name: string;
        projectKey: string;
        type: string;
        description?: string;
        createdBy: number;
    }) {
        const db = await getDB();

        const result = await db.run(
            `INSERT INTO projects 
       (name, projectKey, type, description, createdBy)
       VALUES (?, ?, ?, ?, ?)`,
            data.name,
            data.projectKey,
            data.type,
            data.description ?? null,
            data.createdBy
        );

        return this.findById(result.lastID!);
    }

    static async findById(id: number): Promise<Project | undefined> {
        const db = await getDB();
        return db.get("SELECT * FROM projects WHERE id = ?", id);
    }

    static async findByKey(projectKey: string): Promise<Project | undefined> {
        const db = await getDB();
        return db.get("SELECT * FROM projects WHERE projectKey = ?", projectKey);
    }

    static async existsKey(projectKey: string): Promise<boolean | undefined> {
        const db = await getDB();
        return db.get("SELECT * FROM projects WHERE projectKey = ?", projectKey)
    }

    static async listProjects(params: {
        type: ProjectType;
        userId: number;
        role: string;
        page: number;
        limit: number;
        search?: string;
    }) {
        const db = await getDB();
        const { type, userId, role, page, limit, search } = params;

        const { offset, limit: safeLimit } = this.buildPagination(page, limit);

        let countSql = "";
        let whereClause = `WHERE p.type = :type`;
        const searchClause = search
            ? `AND (p.name LIKE :search OR p.projectKey LIKE :search)`
            : "";
        let joinClause = "";
        let sqlParams = [];
        let countParams = [];


        let baseQuery = `
            SELECT p.id,
                p.name,
                p.projectKey,
                p.description,
                p.type,
                p.updatedAt,
                u.name AS leadUserName
            FROM projects p
            LEFT JOIN users u ON u.id = p.leadUserId
            `;


        if (role === "system_admin") {
            // No additional filter
            if (searchClause) {
                const searchParam = `%${search}%`;
                sqlParams.push(type, searchParam, limit, offset);
                countParams.push(type, searchParam);
            } else {
                sqlParams.push(type, limit, offset);
                countParams.push(type);
            }
        }

        else if (role === "project_admin") {
             joinClause = `
                LEFT JOIN project_member pm
                ON pm.projectId = p.id
            `;
            whereClause += ` AND (pm.userId = :userId OR p.createdBy = :userId)`;

            if (searchClause) {
                const searchParam = `%${search}%`;
                sqlParams.push(type, userId, searchParam, limit, offset);
                countParams.push(type, searchParam);

            } else {
                sqlParams.push(type, userId, limit, offset);
                countParams.push(type);
            }
        }

        else {
            // NORMAL USER
            joinClause = `
                JOIN project_member pm
                ON pm.projectId = p.id
            `;
            whereClause += ` AND pm.userId = :userId`;

            if (searchClause) {
                const searchParam = `%${search}%`;
                sqlParams.push(type, userId, searchParam, limit, offset);
                countParams.push(type, searchParam);

            } else {
                sqlParams.push(type, userId, limit, offset);
                countParams.push(type);
            }
        }


        const sql = `
            ${baseQuery}
            ${joinClause}
            ${whereClause}
            ${searchClause}
            ORDER BY p.createdAt DESC
            LIMIT :limit OFFSET :offset
            `;

        countSql = `
                SELECT COUNT(DISTINCT p.id) as total
                FROM projects p
                ${joinClause}
                ${whereClause}
                ${searchClause}
                `;



        const [items, countResult] = await Promise.all([
            db.all(sql, sqlParams),
            db.get(countSql, countParams)
        ]);

        return {
            items,
            pagination: {
                page,
                limit: safeLimit,
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / safeLimit)
            }
        };
    }

    static buildPagination(page: number, limit: number) {
        const safePage = Math.max(page || 1, 1);
        const safeLimit = Math.min(limit || 10, 50);
        return {
            offset: (safePage - 1) * safeLimit,
            limit: safeLimit
        };
    }

    static async updateProjectByKey(projectKey: string, payload: Partial<Project>) {
        const db = await getDB();
        if (payload.leadUserId === 0 || !payload.leadUserId) {
            delete payload.leadUserId;
        }
        const fields = Object.keys(payload)
            .map(key => `${key} = :${key}`)
            .join(", ");
        const values = Object.values(payload);

        const sql = `
        UPDATE projects
        SET ${fields}
        WHERE projectKey = :key
        `;

        await db.run(sql, [...values, projectKey]);

        return await db.get(`SELECT * FROM projects WHERE projectKey = :projectKey`, [projectKey]);
    }

    static async deleteProjectByKey(projectKey: string) {
        const db = await getDB();
        return await db.run(`DELETE FROM projects WHERE projectKey = :projectKey`, [projectKey]);
    }

    static async addMembers(id: number, payload: { userIds: number[], role: ProjectRole }) {
        const db = await getDB();
        if (!payload.userIds.length) return;

        //User transaction for safety
        await db.exec("BEGIN TRANSACTION");
        try {
            const stmt = await db.prepare(`
        INSERT OR IGNORE INTO project_member (projectId, userId, role)
        VALUES (?, ?, ?)
      `);

            for (const userId of payload.userIds) {
                await stmt.run(id, userId, payload.role);
            }

            await stmt.finalize();
            await db.exec("COMMIT");
        } catch (err) {
            await db.exec("ROLLBACK");
            throw err;
        }

    }

    static async listProjectMembers(id: number) {
        const db = await getDB();

        return await db.all(`
      SELECT
        u.id as userId,
        u.name,
        u.email,
        pm.role,
        pm.createdAt as joinedAt
      FROM project_member pm
      JOIN projects p ON p.id = pm.projectId
      JOIN users u ON u.id = pm.userId
      WHERE p.id = ?
      ORDER BY pm.createdAt ASC
    `, id);
    }

    static async findProjectMembers(projectKey: string, search: string) {
        const db = await getDB();
        const searchClause = search
            ? `AND (u.name LIKE :search OR u.email LIKE :search)`
            : "";
        const params = [projectKey];
        if (searchClause) {
            params.push(`%${search}%`);
        }
        return await db.all(`
        SELECT
            u.id as userId,
            u.name,
            u.email,
            pm.role,
            pm.createdAt as joinedAt
        FROM project_member pm
        JOIN projects p ON p.id = pm.projectId
        JOIN users u ON u.id = pm.userId
        WHERE p.projectKey = :projectKey
        ${searchClause}
        ORDER BY pm.createdAt ASC
        `, params);
    }

    static async removeMember(projectId: number, userId: number) {
        const db = await getDB();
        return await db.run(`DELETE FROM project_member WHERE projectId = :projectId AND userId = :userId`, [projectId, userId]);
    }

    static async getUserRoleInProject(projectId: number, userId: number): Promise<ProjectRole | null> {
        const db = await getDB();
        const result = await db.get(
            `SELECT role FROM project_member WHERE projectId = ? AND userId = ?`,
            projectId,
            userId
        );
        return result ? result.role : null;
    }

    static async isUserInProject(projectId: number, userId: number): Promise<boolean> {
        const db = await getDB();
        const result = await db.get(
            `SELECT 1 FROM project_member WHERE projectId = ? AND userId = ?`,
            projectId,
            userId
        );
        return !!result;
    }

    static async getDefaultStatusId(projectId: number): Promise<number> {
        const db = await getDB();
        const result = await db.get(
            `SELECT id FROM board_status WHERE projectId = ? ORDER BY createdAt ASC LIMIT 1`,
            projectId
        );
        return result.id;
    }

    static async isStatusInProject(projectId: number, statusId: number): Promise<boolean> {
        const db = await getDB();
        const result = await db.get(
            `SELECT 1 FROM board_status WHERE projectId = ? AND id = ?`,
            projectId,
            statusId
        );
        return !!result;
    }

    static async listStatuses(projectId: number) {
        const db = await getDB();
        return await db.all(
            `SELECT *
       FROM board_status
       WHERE projectId = ?
       ORDER BY position ASC, id ASC`,
            projectId
        );
    }

    static async getMemberRole(projectId: number, userId: number) {
        const db = await getDB();
        const result = await db.get(`
                SELECT *
                FROM project_member
                WHERE projectId = ? AND userId = ? LIMIT 1
            `,
            projectId,
            userId
        );

        return result;
    }
}
