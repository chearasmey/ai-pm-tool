import { z } from "zod";

export const suggestSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1).max(50),
        limit: z.coerce.number().min(1).max(20).optional()
    })
});

export const globalSearchSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1).max(100),
        limit: z.coerce.number().min(1).max(50).optional(),
        // types=PROJECT,ISSUE or ISSUE only etc.
        types: z.string().optional()
    })
});
