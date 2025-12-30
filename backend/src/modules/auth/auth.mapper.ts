import { User } from "../users/user.model";
import { LoginResponseDTO } from "./auth.response.dto";

export const AuthMapper = {
    toLoginResponse(
        user: User,
        accessToken: string,
        refreshToken: string
    ): LoginResponseDTO {
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                mfaEnabled: Boolean(user.mfaEnabled)
            },
            tokens: {
                accessToken,
                refreshToken
            }
        };
    }
};
