import { User } from "./user.model";
import { UserResponseDTO } from "./user.response.dto";

export const UserMapper = {
    toResponse(user: User): UserResponseDTO {
        return {
            id: user.id,
            uuid: user.uuid,
            email: user.email,
            name: user.name,
            role: user.role,
            mfaEnabled: user.mfaEnabled,
            createdAt: user.createdAt
        };
    },

    toResponseList(users: User[]): UserResponseDTO[] {
        return users.map(this.toResponse);
    }
};