import { ollamaChat } from "../../integrations/ollama";
import { runForYouTool } from "../../mcp/tools/for-you.tools";

export class ForYouService {
    async getForYouData(user: any) {
        const [recentTasks, recentProjects] = await Promise.all([
            runForYouTool("get_recent_tasks", { limit: 8 }, user),
            runForYouTool("get_recent_projects", { limit: 6 }, user)
        ]);

        return {
            recentTasks: recentTasks.items,
            recentProjects: recentProjects.items
        };
    }

    buildAiPrompt(user: any, data: any) {
        const system = `
        You are an assistant for a Jira-like project management tool.

        CRITICAL RULES (must follow):
        - Use ONLY the JSON context provided. Do NOT assume any missing data.
        - Do NOT invent dates, times, statuses, users, or counts.
        - All datetime/timestamp fields are already human-readable in the context. Use them exactly as provided.
        - dueDate represents the deadline. If dueDate is missing, do not mention a deadline.
        - Use task status from recentTasks.statusName and recentTasks.statusCategory only.
        - If there are zero tasks or projects, explicitly say so.
        - Output MUST be valid Markdown and MUST follow the exact template below.

        OUTPUT TEMPLATE (must follow exactly):

        ## Highlights
        - ...

        ## Suggested next actions
        - ...

        ## Deadlines
        - ...

        ## Risk
        - ...
        `.trim();

        const userMsg = `Context (JSON):\n${JSON.stringify(
            {
                user: { id: user.id, name: user.name, role: user.role },
                ...data
            },
            null,
            2
        )}`;

        return {
            system,
            userMsg
        };
    }
}
