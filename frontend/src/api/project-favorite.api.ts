import type { ProjectTypeEnum, StarredProject } from "@/types/project";
import api from "./axios";
import type { Paginated } from "@/types/general";

export class ProjectFavoriteService {
    static async star(projectKey: string) {
        return await api.post(`/project-favorites/${projectKey}/star`);
    }

    static async unStar(projectKey: string) {
        return await api.delete(`/project-favorites/${projectKey}/star`);
    }

    static async getProjects(params: {
        type?: ProjectTypeEnum,
        page: number,
        limit: number,
        search?: string
    }): Promise<Paginated<StarredProject>> {
        const q = new URLSearchParams();
        q.set("page", String(params.page));
        q.set("limit", String(params.limit));
        if(params.type) q.set("type", params.type);
        if(params.search) q.set("search", params.search);

        try {
            const { data: response } = await api.get(`/project-favorites/starred?${q.toString()}`);
            return response.data as Paginated<StarredProject>;
        } catch(e: any) {
            throw new Error(e?.message || "Failed to load starred projects");
        }

    }

}
