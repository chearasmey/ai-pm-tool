import { SearchRepository } from "./search.repository";
import { tool_embed_text, tool_get_or_create_embedding, tool_rerank_by_embedding } from "../../mcp/tools/semantic-search.tools";
import { cosineSimilarity } from "../../utils/semantic";

export class SearchService {
  private readonly repo = new SearchRepository();

  async suggest(user: any, q: string, limit?: number) {
    return this.repo.suggest(user, q, limit ?? 10);
  }

  async global(user: any, q: string, types?: string, limit?: number, mode: "keyword" | "hybrid" = "keyword") {
    const parsedTypes = SearchRepository.parseTypes(types);
    // if keyword candidates are too few, do semantic-only recall
    const MIN_CANDIDATES = 10;

    // 1) keyword candidates (larger pool if hybrid)
    const candidateLimit = mode === "hybrid" ? 50 : (limit ?? 20);
    const { results } = await this.repo.globalSearch(user, q, parsedTypes, candidateLimit);

    if (mode !== "hybrid") {
      return { results: results.slice(0, limit ?? 20), mode: "keyword" };
    }

    if (results.length < MIN_CANDIDATES) {
      const model = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

      // embed query once
      const queryVec = await tool_embed_text(q);

      // scan embeddings table (fast enough for small DB)
      // const embRows = await this.repo.getEmbeddingRowsForModel(model, ["PROJECT", "ISSUE"]);
      const embRows = await this.repo.getVisibleEmbeddingRowsForUser(user, model, ["PROJECT", "ISSUE"]);


      const scored = embRows.map((r: any) => {
        const vec = JSON.parse(r.vectorJson) as number[];
        return {
          entityType: r.entityType,
          entityId: r.entityId,
          sim: cosineSimilarity(queryVec, vec)
        };
      });

      scored.sort((a, b) => b.sim - a.sim);

      // take top IDs, then fetch actual entities (with visibility)
      const top = scored.slice(0, 30).map(x => ({ entityType: x.entityType, entityId: x.entityId, sim: x.sim }));

      // const fetched = await this.repo.getEntitiesByIds(user, top.map(t => ({ entityType: t.entityType, entityId: t.entityId })));
      const fetched = await this.repo.getVisibleEntitiesByIds(user, top.map(t => ({ entityType: t.entityType, entityId: t.entityId })));


      // attach semanticScore and return
      const final = fetched.results.map((e: any) => {
        const s = top.find(t => t.entityType === e.entityType && (t.entityId === (e.projectId ?? e.issueId)));
        return { ...e, semanticScore: Number((s?.sim ?? 0).toFixed(4)) };
      }).sort((a, b) => (b.semanticScore ?? 0) - (a.semanticScore ?? 0));

      return { results: final.slice(0, limit ?? 20), mode: "hybrid" };
    }
    // 2) build embedding texts (deterministic)
    const model = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

    const candidates = results.map((r: any) => {
      if (r.entityType === "PROJECT") {
        const text = `Project ${r.projectKey} ${r.name}\n${r.description || ""}`.trim();
        return { ...r, _entityType: "PROJECT" as const, _entityId: r.projectId, _embedText: text };
      } else {
        // uses your issues.status field already included in result
        const text = `Issue ${r.issueType}: ${r.title}\nStatus: ${r.status || ""}\nProject: ${r.projectKey}\n${r.description || ""}`.trim();
        return { ...r, _entityType: "ISSUE" as const, _entityId: r.issueId, _embedText: text };
      }
    });

    // 3) embed query
    const queryVec = await tool_embed_text(q);

    // 4) get cached embeddings for candidates (create if missing/outdated)
    const itemVecs: number[][] = [];
    for (const c of candidates) {
      const vec = await tool_get_or_create_embedding({
        entityType: c._entityType,
        entityId: c._entityId,
        model,
        textForEmbedding: c._embedText
      });
      itemVecs.push(vec);
    }

    // 5) rerank by cosine similarity
    const reranked = tool_rerank_by_embedding(queryVec, candidates, itemVecs);

    // 6) return top N with semantic score
    const top = reranked.slice(0, limit ?? 20).map(x => {
      const { _embedText, _entityType, _entityId, ...clean } = x.item as any;
      return { ...clean, semanticScore: Number(x.sim.toFixed(4)) };
    });

    return { results: top, mode: "hybrid" };
  }
}
