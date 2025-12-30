import { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { MFAService } from "./mfa.service";

export const generateMFA = async (req: Request, res: Response) => {
    const userId = req.user.id; // from JWT middleware

    const result = await MFAService.generateMFA(userId);

    return successResponse(
        res,
        result,
        "MFA secret generated. Scan QR code."
    );
};

export const verifyMFA = async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { otp } = req.body;

    const success = await MFAService.verifyAndEnableMFA(
        userId,
        otp
    );

    if (!success) {
        return res.status(400).json({
            statusCode: 400,
            message: "Invalid OTP"
        });
    }

    return successResponse(
        res,
        null,
        "MFA enabled successfully"
    );
};

export const disable = async (req: Request, res: Response) => {
    const userId = req.user.id;
    if(!userId) return;
    await MFAService.disable(userId);
    return successResponse(res, null, "MFA_DISABLED");
}

export const enable = async (req: Request, res: Response) => {
    const userId = req.user.id;
    if(!userId) return;
    await MFAService.enableMFA(userId);
    return successResponse(res, null, "MFA_ENABLED");
}
