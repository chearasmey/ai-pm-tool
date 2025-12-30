import { z } from "zod";
import { UserRole } from "../../constants/role.enum";

export const createUserSchema = z.object({
    body: z.object({
        email: z
            .string({ error: "Email is required" })
            .email("Invalid email format"),

        password: z
            .string({ error: "Password is required" })
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[0-9]/, "Password must contain at least one number"),

        role: z.nativeEnum(UserRole, {
            error: () => ({
                message: "Role is required and must be SYSTEM_ADMIN, PROJECT_ADMIN, or USER"
            })
        })
    })
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(8),
        newPassword: z
            .string()
            .min(8)
            .regex(/[A-Z]/, "Must contain uppercase")
            .regex(/[0-9]/, "Must contain number")
    })
});