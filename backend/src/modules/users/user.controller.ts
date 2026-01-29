import e, { Request, Response } from "express";
import { UserService } from "./user.service";
import { UserMapper } from "./user.mapper";
import { errorResponse, successResponse } from "../../utils/response";
import { decodeToken } from "../../utils/jwt";


export const UserController = {
    list: async (_: Request, res: Response) => {
        const users = await UserService.list();
        const userList = users.map(user => UserMapper.toResponse(user));
        return successResponse(res, userList, "Get user list successfully", 200);

    },
    create: async (req: Request, res: Response) => {
        try {
            const newUser = await UserService.create(req.body);
            return successResponse(res, UserMapper.toResponse(newUser), "User created successfully", 201);
        } catch (error: any) {
            return errorResponse(res, error.message || "Failed to create user", error.code || "USER_CREATION_FAILED", error.statusCode || 400);
        }
    },
    update: async (req: Request, res: Response) => {
        const updatedUser = await UserService.update(req.params.uuid, req.body);
        res.json(UserMapper.toResponse(updatedUser));
    },
    me: async (req: Request, res: Response) => {
        const token = req.headers.authorization?.split(" ")[1] || "";
        const decoded = decodeToken(token);
        const user = await UserService.me((decoded as any).id);
        if (!user) {
            return errorResponse(res, "User not found", "USER_NOT_FOUND", 404);
        }
        res.json(UserMapper.toResponse(user));
    },
    updatePassword: async (req: Request, res: Response) => {
        try {
            const { currentPassword, newPassword } = req.body;
            await UserService.updatePassword(
                req.user.id,
                currentPassword,
                newPassword
            );
            return successResponse(res, null, "PASSWORD_UPDATED");
        } catch (error: any) {
            console.log({ error })
            return errorResponse(res, error.message, error.name, 400, error);
        }


    },

    getSystemUsers: async (req: Request, res: Response) => {
        try {
            const search = (req.query.search as string | undefined) ?? undefined;
            const page = Number(req.query.page ?? 1);
            const limit = Number(req.query.limit ?? 10);

            const { rows, total } = await UserService.getUsers(search, page, limit);

            return successResponse(
                res,
                {
                    items: rows,
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                "ADMIN_USER_LIST"
            );
        } catch (err: any) {
            return errorResponse(res, err?.message || "LIST_FAILED", "ADMIN_USER_LIST_FAILED", 500);
        }
    },

    createSystemUser: async (req: Request, res: Response) => {
        try {
            const { email, name, role } = req.body;

            const { user, defaultPassword } = await UserService.createSystemUser({ email, name, role });

            return successResponse(
                res,
                {
                    user,
                    defaultPassword // show once to admin UI
                },
                "ADMIN_USER_CREATED",
                201
            );
        } catch (err: any) {
            const status = err?.statusCode || 500;
            return errorResponse(res, err?.message || "CREATE_FAILED", "ADMIN_USER_CREATE_FAILED", status);
        }
    },

    updateSystemUser: async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            const updated = await UserService.updateSystemUser(id, req.body);

            return successResponse(res, updated, "ADMIN_USER_UPDATED");
        } catch (err: any) {
            const status = err?.statusCode || 500;
            return errorResponse(res, err?.message || "UPDATE_FAILED", "ADMIN_USER_UPDATE_FAILED", status);
        }
    },

    resetPassword: async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            const disableMfa = req.body?.disableMfa ?? true;

            const { user, newPassword } = await UserService.resetPasswordByAdmin(id, { disableMfa });

            return successResponse(
                res,
                {
                    user,
                    newPassword // show once to admin UI
                },
                "ADMIN_PASSWORD_RESET"
            );
        } catch (err: any) {
            const status = err?.statusCode || 500;
            return errorResponse(res, err?.message || "RESET_FAILED", "ADMIN_PASSWORD_RESET_FAILED", status);
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            const data = await UserService.deleteUser(id, req.user.id);

            return successResponse(
                res,
                { deleted: data.changes > 0 },
                "ADMIN_USER_DELETED"
            );
        } catch (err: any) {
            const status = err?.statusCode || 500;
            return errorResponse(
                res,
                err?.message || "DELETE_FAILED",
                "ADMIN_USER_DELETE_FAILED",
                status
            );
        }
    }


};