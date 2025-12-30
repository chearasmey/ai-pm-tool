export interface UserResponseDTO {
    id: number;
    uuid?: string;
    email: string;
    name: string;
    role: string;
    mfaEnabled: boolean;
    createdAt: string;
}