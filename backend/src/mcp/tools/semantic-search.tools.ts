import { ollamaEmbed } from "../../integrations/ollama-embed";
import { EmbeddingRepository, EntityType } from "../../modules/embedding/embedding-repository";
import { cosineSimilarity, sha256 } from "../../utils/semantic";

const repo = new EmbeddingRepository();

export async function tool_embed_text(text: string) {
    return ollamaEmbed(text);
}

export async function tool_get_or_create_embedding(params: {
    entityType: EntityType;
    entityId: number;
    model: string;
    textForEmbedding: string;
}) {
    const textHash = sha256(params.textForEmbedding);

    const cached = await repo.get(params.entityType, params.entityId, params.model);
    if (cached?.vectorJson && cached?.textHash === textHash) {
        return JSON.parse(cached.vectorJson) as number[];
    }

    const vec = await ollamaEmbed(params.textForEmbedding);
    await repo.upsert(params.entityType, params.entityId, params.model, vec, textHash);
    return vec;
}

export function tool_rerank_by_embedding<T extends { _embedText: string; _entityType: EntityType; _entityId: number }>(
    queryVec: number[],
    items: T[],
    itemVecs: number[][]
) {
    return items
        .map((it, idx) => ({ item: it, sim: cosineSimilarity(queryVec, itemVecs[idx] || []) }))
        .sort((a, b) => b.sim - a.sim);
}
