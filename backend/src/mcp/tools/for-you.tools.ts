import { getDB } from "../../config/db";

export type ForYouToolName = "get_recent_tasks" | "get_recent_projects";

export async function runForYouTool(tool: ForYouToolName, args: any, user: any) {
    switch (tool) {
        case "get_recent_tasks":
            return getRecentTasks(args, user);
        case "get_recent_projects":
            return getRecentProjects(args, user);
        default:
            throw new Error("TOOL_NOT_FOUND");
    }
}

async function getRecentTasks(args: { limit?: number }, user: any) {
    const limit = Math.min(30, Math.max(1, Number(args.limit ?? 10)));
    const db = await getDB();

    // Recent issues relevant to the user
    // - assigned to user OR created by user
    const rows = await db.all(
        `
    SELECT
      i.id,
      i.title,
      i.priority,
      i.type,
      i.projectId,
      p.projectKey,
      p.name AS projectName,
      i.statusId,
      i.assigneeId,
      u.name AS assigneeName,
      i.startDate,
      i.dueDate,
      i.updatedAt,
      i.createdAt
    FROM issues i
    JOIN projects p ON p.id = i.projectId
    LEFT JOIN users u ON u.id = i.assigneeId
    WHERE (i.assigneeId = ? OR i.createdBy = ?)
    ORDER BY COALESCE(i.updatedAt, i.createdAt) DESC
    LIMIT ?
    `,
        user.id,
        user.id,
        limit
    );

    return { items: rows };
}

async function getRecentProjects(args: { limit?: number }, user: any) {
    const limit = Math.min(30, Math.max(1, Number(args.limit ?? 10)));
    const db = await getDB();

    // Visibility:
    // SYSTEM_ADMIN -> all
    // others -> only projects they are members of
    if (user.role === "system_admin") {
        const rows = await db.all(
            `
      SELECT
        p.id,
        p.projectKey,
        p.name,
        p.type,
        p.updatedAt,
        p.createdAt,
        u.name AS leadUserName
      FROM projects p
      LEFT JOIN users u ON u.id = p.leadUserId
      ORDER BY COALESCE(p.updatedAt, p.createdAt) DESC
      LIMIT ?
      `,
            limit
        );
        return { items: rows };
    }

    const rows = await db.all(
        `
    SELECT
      p.id,
      p.projectKey,
      p.name,
      p.type,
      p.updatedAt,
      p.createdAt,
      u.name AS leadUserName
    FROM project_member pm
    JOIN projects p ON p.id = pm.projectId
    LEFT JOIN users u ON u.id = p.leadUserId
    WHERE pm.userId = ?
    ORDER BY COALESCE(p.updatedAt, p.createdAt) DESC
    LIMIT ?
    `,
        user.id,
        limit
    );

    return { items: rows };
}
