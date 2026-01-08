import type { UserRoleEnum } from "./role";

export interface UserInterface{
    id: number;
    uuid?: string;
    email: string;
    name: string;
    role: UserRoleEnum;
    mfaEnabled: boolean;
    createdAt?: string;
}