import e, { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { errorResponse } from "../utils/response";
import { formatZodErrors } from "../utils/zod-error.formatter";

export const validate =
    (schema: ZodSchema) =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                schema.parse({
                    body: req.body,
                    params: req.params,
                    query: req.query
                });
                next();
            } catch (err: any) {
                const formattedErrors = formatZodErrors(err);

                return errorResponse(
                    res,
                    "Request validation failed",
                    err.code || "VALIDATION_FAILED",
                    err.statusCode || 400,
                    formattedErrors
                );
            }
        };
