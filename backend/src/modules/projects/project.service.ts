import { AppError } from "../../errors/app.error";
import { ProjectRepository } from "./project.repository";

export class ProjectService {
    private readonly repo = new ProjectRepository();

    async createProject(
        user: { id: number; role: string },
        data: any
    ) {
        if (!user) {
            throw new AppError("User is unauthorized", "UNAUTHORIZED", 401);
        }
        if (!["system_admin", "project_admin"].includes(user.role)) {
            throw new AppError("No permission", "FORBIDDEN", 403);
        }

        if (await this.repo.existsKey(data.projectKey)) {
            throw new AppError("Project key has aleady in use", "PROJECT_KEY_EXISTS", 409);
        }

        return this.repo.create({
            ...data,
            createdBy: user.id
        });
    }
}
