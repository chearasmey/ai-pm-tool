import crypto from "crypto";

export function sha256(text: string) {
    return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

export function cosineSimilarity(a: number[], b: number[]) {
    const n = Math.min(a.length, b.length);
    if (n === 0) return 0;

    let dot = 0;
    let na = 0;
    let nb = 0;

    for (let i = 0; i < n; i++) {
        const x = a[i];
        const y = b[i];
        dot += x * y;
        na += x * x;
        nb += y * y;
    }

    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
}
