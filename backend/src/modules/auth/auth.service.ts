// src/services/auth.service.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { UserRepository } from "../users/user.repository";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { MFAService } from "../mfa/mfa.service";
import { errorResponse, successResponse } from "../../utils/response";
import { UserMapper } from "../users/user.mapper";

export const AuthService = {
  async login(req: Request, res: Response) {
    const { email, password, otp } = req.body;

    const user = await UserRepository.findByEmail(email);
    const error = new Error("Invalid credentials");
    if (!user) {
      throw error;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw error;
    }

    // MFA check
    if (user.mfaEnabled) {
      if (!otp) {
        error.name = "OTP_REQUIRED";
        error.message = "Required OTP for MFA-enabled account";
        throw error;
      }

      const valid = MFAService.verifyOTP(
        user.mfaSecret!,
        otp
      );

      if (!valid) {
        error.name = "INVALID_OTP";
        error.message = "Invalid OTP";
        throw error;
      }
    }


    const accessToken = signAccessToken({
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    const refreshToken = signRefreshToken({ id: user.id });

    await UserRepository.saveRefreshToken(user.id, refreshToken);
    await UserRepository.resetTokenVersion(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return { user, accessToken };
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.headers.cookie?.split("refreshToken=")[1]?.split(";")[0];
    if (refreshToken) {
      await UserRepository.clearRefreshToken(refreshToken);
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true in prod
      // path: "/api/auth"
    });

    return "Logout successful";
  },

  async refreshTokens(req: Request, res: Response) {
    const token = req.headers.cookie?.split("refreshToken=")[1]?.split(";")[0];

    if (!token) {
      return res.sendStatus(204);
    }
    const payload: any = verifyRefreshToken(token);

    const user = await UserRepository.findById(payload.id);
    if (!user) {
      return errorResponse(res, "No refresh token provided", "UNAUTHORIZED", 401);

    }

    const newAccessToken = signAccessToken({
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    const refreshToken = signRefreshToken({ id: user.id });

    await UserRepository.saveRefreshToken(user.id, refreshToken);

    return successResponse(res, {
      accessToken: newAccessToken,
      user: UserMapper.toResponse(user)
    }, "Tokens refreshed successfully", 200);

  }
};
