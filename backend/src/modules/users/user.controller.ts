import e, { Request, Response } from "express";
import { UserService } from "./user.service";
import { UserMapper } from "./user.mapper";
import { errorResponse, successResponse } from "../../utils/response";
import { decodeToken } from "../../utils/jwt";


export const UserController = {
    list: async (_: Request, res: Response) => {
        const users = await UserService.list();
        const userList = users.map(user=>UserMapper.toResponse(user));
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
        console.log(req.user);
        try {
            const { currentPassword, newPassword } = req.body;
            await UserService.updatePassword(
                req.user.id,
                currentPassword,
                newPassword
            );
            return successResponse(res, null, "PASSWORD_UPDATED");
        } catch (error: any) {
            console.log({error})
            return errorResponse(res, error.message, error.name, 400, error);
        }


    }
};