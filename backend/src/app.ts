import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import projectRoutes from "./modules/projects/project.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import mfaRoutes from "./modules/mfa/mfa.routes";
import { UserService } from "./modules/users/user.service";
import { errorResponse } from "./utils/response";
import { UserRole } from "./constants/role.enum";
import cors from "cors";
import boardStatusRoutes from "./modules/board-status/board-status.routes";
import issueRoutes from "./modules/issue/issue.routes";
import sprintRoutes from "./modules/sprint/sprint.routes";


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

app.get("/", async (req, res) => {
  const defaultUser = [{
    name: "John Doe",
    email: "johndoe@gmail.com",
    password: "My@12345",
    role: UserRole.SYSTEM_ADMIN
  },
  {
    name: "Project Admin",
    email: "mr.a@gmail.com",
    password: "My@12345",
    role: UserRole.PROJECT_ADMIN
  },
  {
    name: "Janie Ross",
    email: "janie@gmail.com",
    password: "My@12345",
    role: UserRole.NORMAL
  }
  ]

  try {
    await UserService.create(defaultUser[0]);
    await UserService.create(defaultUser[1]);
    await UserService.create(defaultUser[2]);
    res.send("Welcome to the API");
  } catch (error: any) {
    res.send(errorResponse(res, error.message || "Failed to create user", error.code || "USER_CREATION_FAILED", error.statusCode || 400));
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/boards", boardStatusRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/sprints", sprintRoutes)

app.use(errorMiddleware);

export default app;