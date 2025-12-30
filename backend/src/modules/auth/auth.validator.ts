import { z } from "zod";

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        otp: z.string().optional()
    })
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(10)
    })
});
