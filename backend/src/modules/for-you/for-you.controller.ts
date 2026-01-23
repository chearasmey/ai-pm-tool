import { Request, Response } from "express";
import { ForYouService } from "./for-you.service";
import { successResponse } from "../../utils/response";
import { ollamaChatStream } from "../../integrations/ollama";

const service = new ForYouService();

export class ForYouController {
    async get(req: Request, res: Response) {
        const data = await service.getForYouData(req.user);
        return successResponse(res, data, "FOR_YOU");
    }

    async aiStream(req: Request, res: Response) {
        // SSE headers
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        // keep-alive ping (some proxies close idle connections)
        const ping = setInterval(() => {
            res.write(`event: ping\ndata: {}\n\n`);
        }, 15000);
        try {
            const data = await service.getForYouData(req.user); // tool outputs (MCP context)
            const { system, userMsg } = service.buildAiPrompt(req.user, data);

            // tell frontend stream started
            res.write(`event: start\ndata: {}\n\n`);

            await ollamaChatStream({
                model: process.env.OLLAMA_MODEL || "llama3.2:1b",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: userMsg }
                ],
                onDelta: (delta) => {
                    // send chunk
                    res.write(`event: delta\ndata: ${JSON.stringify({ delta })}\n\n`);
                },
                onDone: () => {
                    res.write(`event: done\ndata: {}\n\n`);
                }
            });
        } catch (e: any) {
            res.write(
                `event: error\ndata: ${JSON.stringify({
                    message: e?.message || "AI stream failed"
                })}\n\n`
            );
        } finally {
            clearInterval(ping);
            res.end();
        }
    }
}
