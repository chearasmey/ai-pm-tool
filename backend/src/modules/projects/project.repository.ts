import { getDB } from "../../config/db";
import { ProjectInterface, ProjectType } from "./project.type";

export class ProjectRepository {
    async create(data: {
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

    async findById(id: number) {
        const db = await getDB();
        return db.get("SELECT * FROM projects WHERE id = ?", id);
    }

    async findByKey(projectKey: string) {
        const db = await getDB();
        return db.get("SELECT * FROM projects WHERE projectKey = ?", projectKey);
    }

    async existsKey(projectKey: string): Promise<boolean | undefined> {
        const db = await getDB();
        return db.get("SELECT * FROM projects WHERE projectKey = ?", projectKey)
    }

    async listProjects(params: {
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
            whereClause += ` AND p.createdBy = :userId`;

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

    buildPagination(page: number, limit: number) {
        const safePage = Math.max(page || 1, 1);
        const safeLimit = Math.min(limit || 10, 50);
        return {
            offset: (safePage - 1) * safeLimit,
            limit: safeLimit
        };
    }

    async updateProjectByKey(projectKey: string, payload: Partial<ProjectInterface>) {
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

    async deleteProjectByKey(projectKey: string) {
        const db = await getDB();
        return await db.run(`DELETE FROM projects WHERE projectKey = :projectKey`, [projectKey]);
    }
}
