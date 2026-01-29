import { UserRepository } from "./user.repository";
import { generateDefaultPassword, hashPassword } from "../../utils/password";
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
        return UserRepository.create({ ...payload });
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
    },

    getUsers: async (search?: string, page = 1, limit = 10) => {
        return await UserRepository.list(search, page, limit);
    },

    createSystemUser: async (payload: { email: string; name?: string; role: string }) => {
        const existing = await UserRepository.findByEmail(payload.email);
        if (existing) {
            const err: any = new Error("EMAIL_ALREADY_EXISTS");
            err.statusCode = 409;
            throw err;
        }

        const defaultPassword = generateDefaultPassword(12);
        const passwordHash = await hashPassword(defaultPassword);

        const created = await UserRepository.createSystemUser({
            email: payload.email,
            name: payload.name,
            role: payload.role,
            passwordHash
        });

        return { user: created, defaultPassword }; // return once
    },

    updateSystemUser: async (id: number, payload: { email?: string; name?: string | null; role?: string }) => {
        if (payload.email) {
            const existing = await UserRepository.findByEmail(payload.email);
            if (existing && Number(existing.id) !== id) {
                const err: any = new Error("EMAIL_ALREADY_EXISTS");
                err.statusCode = 409;
                throw err;
            }
        }

        const updated = await UserRepository.updateSystemUser(id, payload);
        if (!updated) {
            const err: any = new Error("USER_NOT_FOUND");
            err.statusCode = 404;
            throw err;
        }
        return updated;
    },

    resetPasswordByAdmin: async (id: number, opts?: { disableMfa?: boolean }) => {
        const user = await UserRepository.findById(id);
        if (!user) {
            const err: any = new Error("USER_NOT_FOUND");
            err.statusCode = 404;
            throw err;
        }

        const newPassword = generateDefaultPassword(12);
        const passwordHash = await hashPassword(newPassword);

        const updated = await UserRepository.setPassword(id, passwordHash, { disableMfa: opts?.disableMfa ?? true });

        return { user: updated, newPassword };
    },

    deleteUser: async (userId: number, actorUserId: number) => {
        if (userId === actorUserId) {
            const err: any = new Error("CANNOT_DELETE_YOURSELF");
            err.statusCode = 400;
            throw err;
        }

        const user = await UserRepository.findById(userId);
        if (!user) {
            const err: any = new Error("USER_NOT_FOUND");
            err.statusCode = 404;
            throw err;
        }

        // Optional safety: avoid deleting last SYSTEM_ADMIN
        if (String(user.role).toUpperCase() === "SYSTEM_ADMIN") {
            const err: any = new Error("CANNOT_DELETE_SYSTEM_ADMIN");
            err.statusCode = 400;
            throw err;
        }

        const res = await UserRepository.deleteUserAndCleanup(userId);
        return res;
    }

};