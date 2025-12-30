import { UserRole } from "../../constants/role.enum";

export interface CreateUserRequestDTO {
    email: string;
    name: string;
    password: string;
    role: UserRole;
}

export interface UpdateUserRequestDTO {
    name?: string;
    role?: UserRole;
    mfaEnabled?: boolean;
}

export interface ChangePasswordRequestDTO {
    currentPassword: string;
    newPassword: string;
}