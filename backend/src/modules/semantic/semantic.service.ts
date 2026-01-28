import { SemanticRepository } from "./semantic.repository";
import { EmbeddingRepository } from "../embedding/embedding-repository";
import { sha256 } from "../../utils/semantic";
import { ollamaEmbed } from "../../integrations/ollama-embed";

type ReindexResult = {
    model: string;
    startedAt: string;
    finishedAt: string;
    projects: { total: number; updated: number; skipped: number };
    issues: { total: number; updated: number; skipped: number };
    logs: string[];
};

function chunk<T>(arr: T[], size: number) {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

export class SemanticService {
    private readonly semanticRepo = new SemanticRepository();
    private readonly embedRepo = new EmbeddingRepository();

    private model() {
        return process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
    }

    private makeProjectText(p: any) {
        // Include synonyms explicitly to help semantic matching for UI/UX etc.
        // (This improves retrieval when title uses abbreviations.)
        return [
            `Project ${p.projectKey} (${p.type})`,
            p.name,
            p.description || "",
            "",
            "Synonyms:",
            "UI UX user interface user experience",
            "authentication auth login jwt refresh token mfa",
        ].join("\n").trim();
    }

    private makeIssueText(i: any, projectKey?: string) {
        return [
            `Issue ${i.type}: ${i.title}`,
            `Project: ${projectKey ?? ""}`.trim(),
            `Status: ${i.status ?? ""}`.trim(),
            i.description || "",
            "",
            "Synonyms:",
            "UI UX user interface user experience",
            "authentication auth login jwt refresh token mfa",
        ].join("\n").trim();
    }

    async reindexAll(): Promise<ReindexResult> {
        const model = this.model();
        const logs: string[] = [];
        const startedAt = new Date().toISOString();

        const log = (m: string) => {
            logs.push(m);
            console.log(`[semantic:reindex] ${m}`);
        };

        log(`Start reindex. model=${model}`);

        const projects = await this.semanticRepo.listAllProjects();
        const issues = await this.semanticRepo.listAllIssues();

        // Build projectKey lookup for issues (optional but helpful in embedding text)
        const projectKeyById = new Map<number, string>();
        for (const p of projects) projectKeyById.set(p.id, p.projectKey);

        const summary: ReindexResult = {
            model,
            startedAt,
            finishedAt: startedAt,
            projects: { total: projects.length, updated: 0, skipped: 0 },
            issues: { total: issues.length, updated: 0, skipped: 0 },
            logs
        };

        // --- PROJECTS ---
        log(`Indexing projects: total=${projects.length}`);
        for (const [idx, p] of projects.entries()) {
            const text = this.makeProjectText(p);
            const textHash = sha256(text);

            const cached = await this.embedRepo.get("PROJECT", p.id, model);
            if (cached?.textHash === textHash) {
                summary.projects.skipped++;
            } else {
                const vec = await ollamaEmbed(text);
                await this.embedRepo.upsert("PROJECT", p.id, model, vec, textHash);
                summary.projects.updated++;
            }

            if ((idx + 1) % 10 === 0 || idx === projects.length - 1) {
                log(`Projects progress: ${idx + 1}/${projects.length} (updated=${summary.projects.updated}, skipped=${summary.projects.skipped})`);
            }
        }

        // --- ISSUES (batch logs for large sets) ---
        log(`Indexing issues: total=${issues.length}`);
        const issueChunks = chunk(issues, 25); // keep it safe for your 5-week project
        let processed = 0;

        for (const [ci, group] of issueChunks.entries()) {
            for (const i of group) {
                const pKey = projectKeyById.get(i.projectId) || "";
                const text = this.makeIssueText(i, pKey);
                const textHash = sha256(text);

                const cached = await this.embedRepo.get("ISSUE", i.id, model);
                if (cached?.textHash === textHash) {
                    summary.issues.skipped++;
                } else {
                    const vec = await ollamaEmbed(text);
                    await this.embedRepo.upsert("ISSUE", i.id, model, vec, textHash);
                    summary.issues.updated++;
                }
                processed++;
            }

            log(`Issues progress: ${processed}/${issues.length} (updated=${summary.issues.updated}, skipped=${summary.issues.skipped}) [batch ${ci + 1}/${issueChunks.length}]`);
        }

        summary.finishedAt = new Date().toISOString();
        log(`Done. projects(updated=${summary.projects.updated}, skipped=${summary.projects.skipped}), issues(updated=${summary.issues.updated}, skipped=${summary.issues.skipped})`);

        return summary;
    }
}
