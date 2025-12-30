import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { errorResponse, successResponse } from "../../utils/response";
import { UserMapper } from "../users/user.mapper";

export const AuthController = {
    login: async (req: Request, res: Response) => {
        try {
            const { user, accessToken } = await AuthService.login(req, res);
            return successResponse(res,{
                accessToken,
                user: UserMapper.toResponse(user)
            } , "Login successful", 200);
        } catch (e: any) {
            return errorResponse(res, e.message || "Login failed", e.name || "LOGIN_FAILED", e.statusCode || 401);
        }
    },
    logout: async (req: Request, res: Response) => {
        const result = await AuthService.logout(req, res);
        return successResponse(res, result, "Logout successful", 200);
    },
    refreshToken: async (req: Request, res: Response) => {
        return await AuthService.refreshTokens(req, res);
    },
};