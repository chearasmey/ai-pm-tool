import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app.error";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      error: err.details ?? null
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    error: null
  });
};
