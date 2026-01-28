import api from "./axios";

export type SuggestItem = { value: string; label: string; source: "PROJECT" | "ISSUE" };

export type SearchResult =
  | {
      entityType: "PROJECT";
      projectId: number;
      projectKey: string;
      projectType: string; // ✅ add
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
      projectType: string; // ✅ add
      status: string | null;
      updatedAt: string | null;
      score: number;
    };


export class SearchService {
    static async suggest(q: string, limit = 10) {
        const params = new URLSearchParams({ q, limit: String(limit) });

        const { data: response, status } = await api.get(`/search/suggest?${params.toString()}`);
        if (status === 200) {
            return response.data as { suggestions: SuggestItem[] }
        }
    }

    static async globalSearch(q: string, opts?: { limit?: number; types?: string; mode?: "keyword" | "hybrid"  }) {
        const params = new URLSearchParams({ q });
        if (opts?.limit) params.set("limit", String(opts.limit));
        if (opts?.types) params.set("types", opts.types);
        if (opts?.mode) params.set("mode", opts.mode);

        const { data: response, status } = await api.get(`/search?${params.toString()}`);

        if (status === 200) {
            return response.data as { results: SearchResult[]; mode: "keyword" | "hybrid" };
        }
    }
}
