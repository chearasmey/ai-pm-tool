import { ollamaChat } from "../../integrations/ollama";
import { runForYouTool } from "../../mcp/tools/for-you.tools";

export class ForYouService {
    async getForYou(user: any) {
        // 1) MCP tool calls (structured context)
        const [recentTasks, recentProjects] = await Promise.all([
            runForYouTool("get_recent_tasks", { limit: 10 }, user),
            runForYouTool("get_recent_projects", { limit: 5 }, user)
        ]);

        // 2) Build context for LLM (keep it short & structured)
        const context = {
            user: { id: user.id, name: user.name, role: user.role },
            recentTasks,
            recentProjects
        };

        // 3) LLM summary (small, actionable)
        const system = `
You are an assistant for a Jira-like project management tool.
Return a short "For You" summary with 3 sections:
1) Highlights (2-3 bullets)
2) Suggested Next Actions (3 bullets)
3) Risks/Reminders (1-2 bullets)
Be concise, practical, and based ONLY on the provided context.
`;

        const userMsg = `Context (JSON):\n${JSON.stringify(context, null, 2)}`;

        let aiText = "";
        try {
            aiText = await ollamaChat({
                model: process.env.OLLAMA_MODEL || "llama3",
                messages: [
                    { role: "system", content: system.trim() },
                    { role: "user", content: userMsg }
                ]
            });
        } catch (e) {
            // If ollama down, still return data
            aiText = "";
        }

        return {
            recentTasks: recentTasks.items,
            recentProjects: recentProjects.items,
            ai: {
                enabled: !!aiText,
                text: aiText
            }
        };
    }
}
