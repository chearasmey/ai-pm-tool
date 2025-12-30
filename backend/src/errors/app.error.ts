export class AppError extends Error {
    statusCode: number;
    code: string;
    details?: any;

    constructor(
        message: string,
        code: string,
        statusCode = 400,
        details?: any
    ) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}
