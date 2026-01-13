import { UserRepository } from "./user.repository";
import { hashPassword } from "../../utils/password";
import { CreateUserRequestDTO, UpdateUserRequestDTO } from "./user.request.dto";
import bcrypt from "bcrypt";
import { AppError } from "../../errors/app.error";

export const UserService = {
    async create(payload: CreateUserRequestDTO) {
        const existingUser = await UserRepository.findByEmail(payload.email);
        if (existingUser) {
            throw new AppError("User's already exist", "USER_IN_USE", 400);
        }
        payload.password = await hashPassword(payload.password);
        return UserRepository.create({ ...payload});
    },
    list: async () => await UserRepository.findAll(),
    update: async (uuid: string, payload: UpdateUserRequestDTO) => await UserRepository.update(uuid, payload),
    me: async (id: number) => await UserRepository.findById(id),
    updatePassword: async (userId: number, currentPassword: string, newPassword: string) => {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError("Invalid user!", "USER_NOT_FOUND", 400);
        }

        const match = await bcrypt.compare(
            currentPassword,
            user.passwordHash!
        );

        if (!match) {
            throw new AppError("Current password is incorrect!", "INVALID_PASSWORD", 400);

        }

        const hash = await hashPassword(newPassword);
        await UserRepository.updatePassword(userId, hash);
    }
};