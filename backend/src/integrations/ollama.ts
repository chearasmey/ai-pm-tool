export async function ollamaChat(payload: {
    model: string;
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
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
