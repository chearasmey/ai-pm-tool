type StreamHandlers = {
    onStart?: () => void;
    onDelta: (delta: string) => void;
    onDone?: () => void;
    onError?: (message: string) => void;
};

export async function streamSseWithBearer(url: string, accessToken: string, handlers: StreamHandlers) {
    const controller = new AbortController();

    (async () => {
        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                signal: controller.signal
            });

            if (!res.ok || !res.body) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Stream failed (${res.status})`);
            }

            handlers.onStart?.();

            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // SSE events are separated by a blank line
                let idx: number;
                while ((idx = buffer.indexOf("\n\n")) >= 0) {
                    const rawEvent = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);

                    const lines = rawEvent.split("\n");
                    let eventName = "message";
                    let dataStr = "";

                    for (const line of lines) {
                        if (line.startsWith("event:")) eventName = line.slice(6).trim();
                        if (line.startsWith("data:")) dataStr += line.slice(5).trim();
                    }

                    if (eventName === "delta") {
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed?.delta) handlers.onDelta(parsed.delta);
                        } catch {
                            // ignore parse errors
                        }
                    }

                    if (eventName === "done") {
                        handlers.onDone?.();
                        return;
                    }

                    if (eventName === "error") {
                        try {
                            const parsed = JSON.parse(dataStr);
                            handlers.onError?.(parsed?.message || "AI error");
                        } catch {
                            handlers.onError?.("AI error");
                        }
                        return;
                    }

                    // optionally handle "start"
                    if (eventName === "start") {
                        // no-op
                    }
                }
            }

            handlers.onDone?.();
        } catch (e: any) {
            if (e?.name === "AbortError") return;
            handlers.onError?.(e?.message || "Stream error");
        }
    })();

    return {
        stop: () => controller.abort()
    };
}
