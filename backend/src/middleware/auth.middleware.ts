import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { errorResponse } from "../utils/response";
import { UserService } from "../modules/users/user.service";


export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
    try {
        const payload: any = verifyToken(header.split(" ")[1]);
        const user = await UserService.me(payload.id);
        if (payload.tokenVersion === user?.tokenVersion) {
            req.user = { id: payload.id, role: payload.role };
            next();
        } else {
            const error = new Error();
            error.name = "TOKEN_REVOKED";
            error.message = "Token has been revoked";
            throw error;
        }
    } catch (error: any) {
        switch (error.name) {
            case "TokenExpiredError":
                return errorResponse(res, error.message, error.name, 401, error);
            case "TOKEN_REVOKED":
                return errorResponse(res, error.message, error.name, 401, error);
            default:
                return errorResponse(res, "Invalid token", "INVALID_TOKEN", 401, error);
        }
    }
};