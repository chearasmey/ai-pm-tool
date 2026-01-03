import type { UserRole } from "../types/role";

export const hasRole = (userRole: UserRole, allowed: UserRole[]): boolean => {
    return allowed.includes(userRole);
}