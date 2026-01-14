import { UserRole } from "../constants/role.enum";
const ALLOWGLOBAL_ROLES: Set<UserRole> = new Set([UserRole.SYSTEM_ADMIN, UserRole.PROJECT_ADMIN]);

export const isAllowedGlobal = (userRole: UserRole) => {
    return ALLOWGLOBAL_ROLES.has(userRole);
}