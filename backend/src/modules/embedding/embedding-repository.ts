import { getDB } from "../../config/db";

export type EntityType = "PROJECT" | "ISSUE";

export class EmbeddingRepository {
    async get(entityType: EntityType, entityId: number, model: string) {
        const db = await getDB();
        return db.get(
            `SELECT vectorJson, textHash FROM embeddings WHERE entityType = ? AND entityId = ? AND model = ?`,
            entityType,
            entityId,
            model
        );
    }

    async upsert(entityType: EntityType, entityId: number, model: string, vector: number[], textHash: string) {
        const db = await getDB();
        const vectorJson = JSON.stringify(vector);

        await db.run(
            `
      INSERT INTO embeddings(entityType, entityId, model, vectorJson, textHash, updatedAt)
      VALUES(?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(entityType, entityId, model)
      DO UPDATE SET vectorJson = excluded.vectorJson, textHash = excluded.textHash, updatedAt = CURRENT_TIMESTAMP
      `,
            entityType,
            entityId,
            model,
            vectorJson,
            textHash
        );
    }
}
