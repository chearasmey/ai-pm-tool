import api from "./axios";

export class SprintService {
    static async create(projectId: number, payload: { name: string; startDate?: string; endDate?: string; goal?: string | null }) {
        return await api.post(`/sprints/project/${projectId}`, payload);
    }
}