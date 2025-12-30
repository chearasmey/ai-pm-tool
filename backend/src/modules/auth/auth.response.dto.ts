export interface AuthTokenResponseDTO {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponseDTO {
    user: {
        id: number;
        email: string;
        role: string;
        mfaEnabled: boolean;
    };
    tokens: AuthTokenResponseDTO;
}
