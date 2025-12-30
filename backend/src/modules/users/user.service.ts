import { UserRepository } from "./user.repository";
import { hashPassword } from "../../utils/password";
import { CreateUserRequestDTO, UpdateUserRequestDTO } from "./user.request.dto";
import bcrypt from "bcrypt";

export const UserService = {
    async create(payload: CreateUserRequestDTO) {
        const existingUser = await UserRepository.findByEmail(payload.email);
        if (existingUser) {
            const error = new Error("Email already in use");
            error.statusCode = 400;
            error.name = "EMAIL_IN_USE";
            throw error;
        }
        payload.password = await hashPassword(payload.password);
        return UserRepository.create({ ...payload});
    },
    list: async () => await UserRepository.findAll(),
    update: async (uuid: string, payload: UpdateUserRequestDTO) => await UserRepository.update(uuid, payload),
    me: async (id: number) => await UserRepository.findById(id),
    updatePassword: async (userId: number, currentPassword: string, newPassword: string) => {
        const user = await UserRepository.findById(userId);
        let error = new Error("Error");
        if (!user) {
            error.name = "USER_NOT_FOUND";
            error.message = "Invalid user!";
            throw error;
        }

        const match = await bcrypt.compare(
            currentPassword,
            user.passwordHash!
        );

        if (!match) {
            error.name = "INVALID_PASSWORD";
            error.message = "Current password is incorrect!"
            throw error;
        }

        const hash = await hashPassword(newPassword);
        await UserRepository.updatePassword(userId, hash);
    }
};