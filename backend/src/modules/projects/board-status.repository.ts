import { getDB } from "../../config/db";
import { ProjectType } from "./project.type";

export class BoardStatusRepository {
    static async seedDefaults(projectId: number, type: ProjectType) {
        const db = await getDB();

        const statuses =
            type === "scrum"
                ? [
                    { name: "To Do", category: "TODO", position: 1 },
                    { name: "In Progress", category: "IN_PROGRESS", position: 2 },
                    { name: "QA", category: "IN_PROGRESS", position: 3 },
                    { name: "Done", category: "DONE", position: 4 }
                ]
                : [
                    { name: "To Do", category: "TODO", position: 1 },
                    { name: "Done", category: "DONE", position: 2 }
                ];

        const stmt = await db.prepare(`
                            INSERT INTO board_status (projectId, name, category, position)
                            VALUES (?, ?, ?, ?)
                            `);

        try {
            await db.exec("BEGIN");
            for (const s of statuses) {
                await stmt.run(projectId, s.name, s.category, s.position);
            }
            await db.exec("COMMIT");
        } catch (e) {
            await db.exec("ROLLBACK");
            throw e;
        } finally {
            await stmt.finalize();
        }
    }
}
