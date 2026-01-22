import { ProjectRepository } from "../projects/project.repository";
import { ProjectFavoriteRepository } from "./project-favorite.repository";


export class ProjectFavoriteService {

    // Reuse your existing visibility rules
    private async canAccessProject(user: any, projectId: number, createdBy: number) {
        if (user.role.toLowerCase() === "system_admin") return true;

        const isMember = await ProjectRepository.isUserInProject(projectId, user.id);
        if (user.role.toLowerCase() === "project_admin") {
            return isMember || createdBy === user.id;
        }

        // NORMAL
        return isMember;
    }

    async starProject(user: any, projectKey: string) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new Error("PROJECT_NOT_FOUND");

        const ok = await this.canAccessProject(user, project.id, project.createdBy!);
        if (!ok) throw new Error("FORBIDDEN");

        await ProjectFavoriteRepository.star(project.id, user.id);
        return { starred: true };
    }

    async unstarProject(user: any, projectKey: string) {
        const project = await ProjectRepository.findByKey(projectKey);
        if (!project) throw new Error("PROJECT_NOT_FOUND");

        // If user can’t access anymore, still allow unstar (safe)
        await ProjectFavoriteRepository.unstar(project.id, user.id);
        return { starred: false };
    }

    async listStarred(user: any, query: any) {
        const page = Math.max(1, Number(query.page ?? 1));
        const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10)));
        const type = query.type ? String(query.type).toLowerCase() : undefined;
        const search = query.search ? String(query.search) : undefined;

        return ProjectFavoriteRepository.listStarredProjects({
            userId: user.id,
            globalRole: user.role,
            type: type === "scrum" || type === "kanban" ? type : undefined,
            search,
            page,
            limit
        });
    }
}
