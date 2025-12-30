import { z } from "zod";

export const verifyMFASchema = z.object({
    body: z.object({
        otp: z.string().length(6)
    })
});
