import { getDB } from "../../config/db";

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

    async existsKey(projectKey: string):Promise<boolean|undefined> {
        const db = await getDB();
        return db.get("SELECT * FROM projects WHERE projectKey = ?", projectKey)
    }
}
