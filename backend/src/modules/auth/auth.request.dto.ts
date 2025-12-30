export interface LoginRequestDTO {
    email: string;
    password: string;
    otp?: string;
}

export interface RefreshTokenRequestDTO {
    refreshToken: string;
}
