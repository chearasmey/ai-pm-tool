import { Request, Response, NextFunction } from "express";
import { UserRole } from "../constants/role.enum";


export const requireRole = (roles: UserRole[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role))
            return res.status(403).json({ error: "Forbidden" });
        next();
    };