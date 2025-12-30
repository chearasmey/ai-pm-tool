import { Response } from "express";

export const successResponse = <T>(
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

export const errorResponse = (
    res: Response,
    message: string,
    code = "GENERIC_ERROR",
    statusCode = 400,
    details?: any
) => {
    return res.status(statusCode).json({
        success: false,
        code,
        message,
        error: details
    });
};
