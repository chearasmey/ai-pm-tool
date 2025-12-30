import { UUID } from "node:crypto";
import { UserRole } from "../../constants/role.enum";

// export type UserRole = "system_admin" | "project_admin" | "normal";

export interface User {
    id: number;
    uuid?: UUID
    email: string;
    name: string;
    passwordHash?: string;
    role: UserRole;

    // Security
    mfaEnabled: boolean;
    mfaSecret?: string;      // base32
    tokenVersion?: number;
    refreshToken?: string;
    createdAt: string;
}
