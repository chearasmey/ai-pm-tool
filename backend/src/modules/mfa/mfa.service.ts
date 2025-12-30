import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { UserRepository } from "../users/user.repository";

export class MFAService {
    /**
     * Generate MFA secret + QR code
     */
    static async generateMFA(userId: number) {
        const secret = speakeasy.generateSecret({
            name: `PM-Tool (${userId})`, // app name shown in Google Authenticator
            length: 20
        });

        // Save base32 secret (do NOT enable MFA yet)
        await UserRepository.generateMFA(
            userId,
            secret.base32
        );

        const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

        return {
            qrCode,
            manualCode: secret.base32 // backup/manual entry
        };
    }

    /**
     * Verify OTP & enable MFA
     */
    static async verifyAndEnableMFA(
        userId: number,
        otp: string
    ): Promise<boolean> {
        const user = await UserRepository.findById(userId);
        if (!user?.mfaSecret) {
            throw new Error("MFA not initialized");
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: "base32",
            token: otp,
            window: 1
        });

        if (!verified) {
            return false;
        }

        return true;
    }

    /**
     * Verify OTP during login
     */
    static verifyOTP(
        secret: string,
        otp: string
    ): boolean {
        return speakeasy.totp.verify({
            secret,
            encoding: "base32",
            token: otp,
            window: 1
        });
    }

    static async enableMFA(userId: number) {
        await UserRepository.enableMFA(userId);
    }

    static async disable(userId: number) {
        await UserRepository.disableMFA(userId);
    }
}
