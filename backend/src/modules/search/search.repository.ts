import { getDB } from "../../config/db";
import { EntityType } from "../embedding/embedding-repository";

type User = { id: number; role: "system_admin" | "project_admin" | "normal" | string };

export type SearchEntityType = "PROJECT" | "ISSUE";

export type GlobalSearchResult =
    | {
        entityType: "PROJECT";
        projectId: number;
        projectKey: string;
        projectType: string;          // ✅ add
        name: string;
        description: string | null;
        updatedAt: string | null;
        score: number;
    }
    | {
        entityType: "ISSUE";
        issueId: number;
        issueType: string;
        title: string;
        description: string | null;

        projectId: number;
        projectKey: string;
        projectName: string;
        projectType: string;          // ✅ add

        status: string | null;
        updatedAt: string | null;
        score: number;
    };


function parseTypes(types?: string): SearchEntityType[] {
    if (!types) return ["PROJECT", "ISSUE"];
    const arr = types
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);

    const ok: SearchEntityType[] = [];
    if (arr.includes("PROJECT")) ok.push("PROJECT");
    if (arr.includes("ISSUE")) ok.push("ISSUE");
    return ok.length ? ok : ["PROJECT", "ISSUE"];
}

/**
 * Visibility rules (same as your earlier project list):
 * - SYSTEM_ADMIN: all
 * - PROJECT_ADMIN: createdBy=self OR member
 * - USER: member only
 *
 * Requires:
 * - projects.createdBy exists (INTEGER)
 * - project_member(projectId, userId) exists
 *
 * If your schema differs, adjust this function.
 */
function projectVisibilitySql(user: User) {
    if (user.role === "system_admin") {
        return { sql: "", params: [] as any[] };
    }

    if (user.role === "project_admin") {
        return {
            sql: `
        AND (
          p.createdBy = ?
          OR EXISTS (
            SELECT 1 FROM project_member pm
            WHERE pm.projectId = p.id AND pm.userId = ?
          )
        )
      `,
            params: [user.id, user.id]
        };
    }

    return {
        sql: `
      AND EXISTS (
        SELECT 1 FROM project_member pm
        WHERE pm.projectId = p.id AND pm.userId = ?
      )
    `,
        params: [user.id]
    };
}

export class SearchRepository {
    private isSystemAdmin(user: User) {
        return String(user.role).toUpperCase() === "SYSTEM_ADMIN";
    }
    async suggest(user: User, q: string, limit = 10) {
        const db = await getDB();
        const like = `%${q}%`;

        // Suggestions come from:
        // - projects.name, projects.projectKey
        // - issues.title
        // (Visibility applied on projects; issues through projects join)
        const vis = projectVisibilitySql(user);

        // projects suggestions
        const projectRows = await db.all(
            `
      SELECT
        p.projectKey AS value,
        p.name AS label,
        'PROJECT' AS source,
        CASE
          WHEN p.projectKey LIKE ? THEN 3
          WHEN p.name LIKE ? THEN 2
          ELSE 1
        END AS score
      FROM projects p
      WHERE (p.projectKey LIKE ? OR p.name LIKE ?)
      ${vis.sql}
      ORDER BY score DESC, COALESCE(p.updatedAt, p.createdAt) DESC
      LIMIT ?
      `,
            like,
            like,
            like,
            like,
            ...vis.params,
            limit
        );

        // issues title suggestions (limit separately then merge)
        const issueRows = await db.all(
            `
      SELECT
        i.title AS value,
        i.title AS label,
        'ISSUE' AS source,
        CASE
          WHEN i.title LIKE ? THEN 2
          ELSE 1
        END AS score
      FROM issues i
      JOIN projects p ON p.id = i.projectId
      WHERE i.title LIKE ?
      ${vis.sql}
      ORDER BY score DESC, COALESCE(i.updatedAt, i.createdAt) DESC
      LIMIT ?
      `,
            like,
            like,
            ...vis.params,
            limit
        );

        const merged = [...projectRows, ...issueRows]
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .slice(0, limit);

        // unique by value
        const seen = new Set<string>();
        const suggestions = [];
        for (const s of merged) {
            if (seen.has(s.value)) continue;
            seen.add(s.value);
            suggestions.push({
                value: s.value,
                label: s.label,
                source: s.source
            });
        }

        return { suggestions };
    }

    async globalSearch(user: User, q: string, types: SearchEntityType[], limit = 20): Promise<{ results: GlobalSearchResult[] }> {
        const db = await getDB();
        const like = `%${q}%`;
        const vis = projectVisibilitySql(user);

        const parts: string[] = [];
        const params: any[] = [];

        if (types.includes("PROJECT")) {
            parts.push(`
    SELECT
      'PROJECT' AS entityType,

      p.id AS projectId,
      p.projectKey AS projectKey,
      p.type AS projectType,
      p.name AS projectName,

      NULL AS issueId,
      NULL AS issueType,
      NULL AS issueTitle,

      p.description AS description,
      NULL AS status,

      p.updatedAt AS updatedAt,
      CASE
        WHEN p.projectKey LIKE ? THEN 6
        WHEN p.name LIKE ? THEN 5
        WHEN p.description LIKE ? THEN 3
        ELSE 1
      END AS score
    FROM projects p
    WHERE (p.projectKey LIKE ? OR p.name LIKE ? OR p.description LIKE ?)
    ${vis.sql}
  `);
            params.push(like, like, like, like, like, like, ...vis.params);
        }

        if (types.includes("ISSUE")) {
            parts.push(`
    SELECT
      'ISSUE' AS entityType,

      p.id AS projectId,
      p.projectKey AS projectKey,
      p.type AS projectType,
      p.name AS projectName,

      i.id AS issueId,
      i.type AS issueType,
      i.title AS issueTitle,

      i.description AS description,
      bs.name AS status,

      i.updatedAt AS updatedAt,
      CASE
        WHEN i.title LIKE ? THEN 6
        WHEN i.description LIKE ? THEN 4
        WHEN p.projectKey LIKE ? THEN 3
        ELSE 1
      END AS score
    FROM issues i
    JOIN projects p ON p.id = i.projectId
    LEFT JOIN board_status bs ON bs.id = i.statusId
    WHERE (i.title LIKE ? OR i.description LIKE ? OR p.projectKey LIKE ? OR p.name LIKE ?)
    ${vis.sql}
  `);

            params.push(like, like, like, like, like, like, like, ...vis.params);
        }

        const sql = `
      SELECT * FROM (
        ${parts.join("\nUNION ALL\n")}
      )
      ORDER BY score DESC, COALESCE(updatedAt, '') DESC
      LIMIT ?
    `;

        const rows = await db.all(sql, ...params, limit);

        const results: GlobalSearchResult[] = rows.map((r: any) => {
            if (r.entityType === "PROJECT") {
                return {
                    entityType: "PROJECT",
                    projectId: r.projectId,
                    projectKey: r.projectKey,
                    projectType: r.projectType,
                    name: r.projectName,
                    description: r.description ?? null,
                    updatedAt: r.updatedAt ?? null,
                    score: Number(r.score ?? 0)
                };
            }

            return {
                entityType: "ISSUE",
                issueId: r.issueId,
                issueType: r.issueType ?? "TASK",
                title: r.issueTitle ?? "",
                description: r.description ?? null,

                projectId: r.projectId,
                projectKey: r.projectKey,
                projectName: r.projectName ?? "",
                projectType: r.projectType,

                status: r.status ?? null,
                updatedAt: r.updatedAt ?? null,
                score: Number(r.score ?? 0)
            };
        });


        return { results };
    }

    static readonly parseTypes = parseTypes;

    async getEmbeddingRowsForModel(model: string, entityTypes: EntityType[] = ["PROJECT", "ISSUE"]) {
        const db = await getDB();
        const placeholders = entityTypes.map(() => "?").join(",");
        return db.all(
            `
      SELECT entityType, entityId, vectorJson
      FROM embeddings
      WHERE model = ?
        AND entityType IN (${placeholders})
      `,
            model,
            ...entityTypes
        );
    }

    async getEntitiesByIds(user: any, ids: { entityType: EntityType; entityId: number }[]) {
        const db = await getDB();
        if (!ids.length) return { results: [] as any[] };

        // split
        const projectIds = ids.filter(x => x.entityType === "PROJECT").map(x => x.entityId);
        const issueIds = ids.filter(x => x.entityType === "ISSUE").map(x => x.entityId);

        // NOTE: apply visibility via project join (same as your globalSearch visibility)
        const vis = (this as any).constructor?.projectVisibilitySql
            ? (this as any).constructor.projectVisibilitySql(user)
            : { sql: "", params: [] };

        const results: any[] = [];

        if (projectIds.length) {
            const pRows = await db.all(
                `
        SELECT
          'PROJECT' AS entityType,
          p.id AS projectId,
          p.projectKey,
          p.type AS projectType,
          p.name,
          p.description,
          p.updatedAt
        FROM projects p
        WHERE p.id IN (${projectIds.map(() => "?").join(",")})
        ${vis.sql}
        `,
                ...projectIds,
                ...vis.params
            );
            results.push(...pRows.map((p: any) => ({
                entityType: "PROJECT",
                projectId: p.projectId,
                projectKey: p.projectKey,
                projectType: p.projectType,
                name: p.name,
                description: p.description ?? null,
                updatedAt: p.updatedAt ?? null
            })));
        }

        if (issueIds.length) {
            const iRows = await db.all(
                `
        SELECT
          'ISSUE' AS entityType,
          i.id AS issueId,
          i.type AS issueType,
          i.title,
          i.description,
          i.statusId,
          i.updatedAt,
          p.id AS projectId,
          p.projectKey,
          p.name AS projectName,
          p.type AS projectType
        FROM issues i
        JOIN projects p ON p.id = i.projectId
        WHERE i.id IN (${issueIds.map(() => "?").join(",")})
        ${vis.sql}
        `,
                ...issueIds,
                ...vis.params
            );
            results.push(...iRows.map((r: any) => ({
                entityType: "ISSUE",
                issueId: r.issueId,
                issueType: r.issueType,
                title: r.title,
                description: r.description ?? null,
                status: r.status ?? null,
                updatedAt: r.updatedAt ?? null,
                projectId: r.projectId,
                projectKey: r.projectKey,
                projectName: r.projectName,
                projectType: r.projectType
            })));
        }

        return { results };
    }

    /**
   * Return embeddings rows only for entities user can see:
   * - SYSTEM_ADMIN: all embeddings
   * - Others: must be project_member of the project
   */
    async getVisibleEmbeddingRowsForUser(user: User, model: string, entityTypes: EntityType[] = ["PROJECT", "ISSUE"]) {
        const db = await getDB();

        // SYSTEM_ADMIN can load all embeddings (still filter by type/model)
        if (this.isSystemAdmin(user)) {
            const placeholders = entityTypes.map(() => "?").join(",");
            return db.all(
                `
        SELECT entityType, entityId, vectorJson
        FROM embeddings
        WHERE model = ?
          AND entityType IN (${placeholders})
        `,
                model,
                ...entityTypes
            );
        }

        const includeProjects = entityTypes.includes("PROJECT");
        const includeIssues = entityTypes.includes("ISSUE");
        const parts: string[] = [];
        const params: any[] = [];

        if (includeProjects) {
            parts.push(`
        SELECT e.entityType, e.entityId, e.vectorJson
        FROM embeddings e
        JOIN projects p ON p.id = e.entityId
        WHERE e.model = ?
          AND e.entityType = 'PROJECT'
          AND EXISTS (
            SELECT 1 FROM project_member pm
            WHERE pm.projectId = p.id AND pm.userId = ?
          )
      `);
            params.push(model, user.id);
        }

        if (includeIssues) {
            parts.push(`
        SELECT e.entityType, e.entityId, e.vectorJson
        FROM embeddings e
        JOIN issues i ON i.id = e.entityId
        JOIN projects p ON p.id = i.projectId
        WHERE e.model = ?
          AND e.entityType = 'ISSUE'
          AND EXISTS (
            SELECT 1 FROM project_member pm
            WHERE pm.projectId = p.id AND pm.userId = ?
          )
      `);
            params.push(model, user.id);
        }

        const sql = parts.join("\nUNION ALL\n");
        return db.all(sql, ...params);
    }

    /**
     * Fetch entity details for visible IDs only (extra safety).
     * SYSTEM_ADMIN: no filter
     * Others: must be project_member
     */
    async getVisibleEntitiesByIds(user: User, ids: { entityType: EntityType; entityId: number }[]) {
        const db = await getDB();
        if (!ids.length) return { results: [] as any[] };

        const projectIds = ids.filter(x => x.entityType === "PROJECT").map(x => x.entityId);
        const issueIds = ids.filter(x => x.entityType === "ISSUE").map(x => x.entityId);

        const results: any[] = [];
        const isAdmin = this.isSystemAdmin(user);

        if (projectIds.length) {
            const whereMember = isAdmin
                ? ""
                : `AND EXISTS (SELECT 1 FROM project_member pm WHERE pm.projectId = p.id AND pm.userId = ?)`;

            const rows = await db.all(
                `
        SELECT
          'PROJECT' AS entityType,
          p.id AS projectId,
          p.projectKey,
          p.type AS projectType,
          p.name,
          p.description,
          p.updatedAt
        FROM projects p
        WHERE p.id IN (${projectIds.map(() => "?").join(",")})
        ${whereMember}
        `,
                ...(isAdmin ? [] : [user.id]),
                ...projectIds
            );

            results.push(
                ...rows.map((p: any) => ({
                    entityType: "PROJECT",
                    projectId: p.projectId,
                    projectKey: p.projectKey,
                    projectType: p.projectType,
                    name: p.name,
                    description: p.description ?? null,
                    updatedAt: p.updatedAt ?? null
                }))
            );
        }

        if (issueIds.length) {
            const whereMember = isAdmin
                ? ""
                : `AND EXISTS (SELECT 1 FROM project_member pm WHERE pm.projectId = p.id AND pm.userId = ?)`;

            const rows = await db.all(
                `
        SELECT
          'ISSUE' AS entityType,
          i.id AS issueId,
          i.type AS issueType,
          i.title,
          i.description,
          bs.name AS status,
          i.updatedAt,
          p.id AS projectId,
          p.projectKey,
          p.name AS projectName,
          p.type AS projectType
        FROM issues i
        JOIN projects p ON p.id = i.projectId
        LEFT JOIN board_status bs ON bs.id = i.statusId
        WHERE i.id IN (${issueIds.map(() => "?").join(",")})
        ${whereMember}
        `,
                ...(isAdmin ? [] : [user.id]),
                ...issueIds
            );

            results.push(
                ...rows.map((r: any) => ({
                    entityType: "ISSUE",
                    issueId: r.issueId,
                    issueType: r.issueType,
                    title: r.title,
                    description: r.description ?? null,
                    status: r.status ?? null,
                    updatedAt: r.updatedAt ?? null,
                    projectId: r.projectId,
                    projectKey: r.projectKey,
                    projectName: r.projectName,
                    projectType: r.projectType
                }))
            );
        }

        return { results };
    }

}
