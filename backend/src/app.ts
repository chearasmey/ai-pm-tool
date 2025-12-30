import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import mfaRoutes from "./modules/mfa/mfa.routes";
import { UserService } from "./modules/users/user.service";
import { errorResponse } from "./utils/response";
import { UserRole } from "./constants/role.enum";
import cors from "cors";


const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // REQUIRED for cookies / refresh token
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());
app.use(errorMiddleware);

app.get("/", async (req, res) => {
    const defaultUser = {
        name: "John Doe",
        email: "johndoe@email.com",
        password: "password123",
        role: UserRole.SYSTEM_ADMIN
    }

    try {
        await UserService.create(defaultUser);
        res.send("Welcome to the API");
    } catch (error: any) {
        res.send(errorResponse(res, error.message || "Failed to create user", error.code || "USER_CREATION_FAILED", error.statusCode || 400));
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mfa", mfaRoutes);


export default app;