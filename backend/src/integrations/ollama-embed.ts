export async function ollamaEmbed(input: string): Promise<number[]> {
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const model = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text:latest";

    const res = await fetch(`${baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: input })
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`OLLAMA_EMBED_ERROR: ${res.status} ${txt}`);
    }

    const json: any = await res.json();
    const vec = json?.embedding;
    if (!Array.isArray(vec) || vec.length === 0) throw new Error("OLLAMA_EMBED_INVALID");
    return vec as number[];
}
