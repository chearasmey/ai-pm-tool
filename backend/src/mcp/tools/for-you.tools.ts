import { getDB } from "../../config/db";
import { computeDeadline, formatHuman } from "../../utils/date-format";

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
                bs.name AS statusName,
                bs.category AS statusCategory,

                i.assigneeId,
                u.name AS assigneeName,

                i.dueDate,
                i.updatedAt,
                i.createdAt
            FROM issues i
            JOIN projects p ON p.id = i.projectId
            LEFT JOIN users u ON u.id = i.assigneeId
            LEFT JOIN board_status bs ON bs.id = i.statusId
            WHERE (i.assigneeId = ? OR i.createdBy = ?)
            ORDER BY COALESCE(i.updatedAt, i.createdAt) DESC
            LIMIT ?
            `,
        user.id,
        user.id,
        limit
    );

    const items = rows.map((r: any) => {
        const deadline = computeDeadline(r.dueDate);

        return {
            id: r.id,
            title: r.title,
            type: r.type,
            priority: r.priority,

            projectId: r.projectId,
            projectKey: r.projectKey,
            projectName: r.projectName,

            statusId: r.statusId ?? null,
            statusName: r.statusName ?? "Unknown",
            statusCategory: r.statusCategory ?? "TODO", // fallback if null

            assigneeId: r.assigneeId ?? null,
            assigneeName: r.assigneeName ?? null,

            // raw timestamps (keep if you want)
            createdAt: r.createdAt ?? null,
            updatedAt: r.updatedAt ?? null,
            dueDate: r.dueDate ?? null,

            // human readable (for UI + LLM)
            createdAtHuman: formatHuman(r.createdAt),
            updatedAtHuman: formatHuman(r.updatedAt ?? r.createdAt),

            dueDateHuman: deadline.dueDateHuman,
            deadlineState: deadline.deadlineState,
            deadlineDays: deadline.deadlineDays
        };
    });

    return { items };
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
        p.description AS goal,
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
      p.description AS goal,
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

    const items = rows.map((p: any) => ({
        ...p,
        createdAtHuman: formatHuman(p.createdAt),
        updatedAtHuman: formatHuman(p.updatedAt ?? p.createdAt)
    }));

    return { items };
}
