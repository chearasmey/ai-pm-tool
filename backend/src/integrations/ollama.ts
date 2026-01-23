type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function ollamaChat(payload: {
    model: string;
    messages: ChatMessage[];
}) {
    const res = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: payload.model,
            messages: payload.messages,
            stream: false
        })
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`OLLAMA_ERROR: ${res.status} ${text}`);
    }

    const json = await res.json();
    // Ollama returns: { message: { role, content }, ... }
    return json?.message?.content ?? "";
}


export async function ollamaChatStream(params: {
    model: string;
    messages: ChatMessage[];
    onDelta: (delta: string) => void;
    onDone: () => void;
}) {
    const res = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: params.model,
            messages: params.messages,
            stream: true
        })
    });

    if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(`OLLAMA_STREAM_ERROR: ${res.status} ${txt}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Ollama stream is NDJSON: one JSON per line
        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);

            if (!line) continue;

            let json: any;
            try {
                json = JSON.parse(line);
            } catch {
                continue;
            }

            // Each chunk: { message: { content }, done: boolean, ... }
            const delta = json?.message?.content ?? "";
            if (delta) params.onDelta(delta);

            if (json?.done) {
                params.onDone();
                return;
            }
        }
    }

    params.onDone();
}

