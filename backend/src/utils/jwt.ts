// src/utils/jwt.ts
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret";

export const signAccessToken = (payload: any) =>
    jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });

export const signRefreshToken = (payload: any) =>
    jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

export const verifyRefreshToken = (token: string) =>
    jwt.verify(token, REFRESH_SECRET);

export const verifyToken = (token: string) =>
    jwt.verify(token, ACCESS_SECRET);

export const decodeToken = (token: string) =>
    jwt.decode(token);

