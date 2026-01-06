export interface UserInterface{
    id: number;
    uuid?: string;
    email: string;
    name: string;
    role: string;
    mfaEnalbed: number;
    createdAt?: string;
}