import api from "./axios";

export class SprintService {
    static async create(projectId: number, payload: { name: string; startDate?: string; endDate?: string; goal?: string | null }) {
        return await api.post(`/sprints/project/${projectId}`, payload);
    }

    static async getAcitve(projectId: number) {
        return await api.get(`/sprints/project/${projectId}/active`);
    }

    static async start(sprintId: number) {
        return await api.put(`/sprints/${sprintId}/start`);
    }

    static async stop(sprintId: number) {
        return await api.put(`/sprints/${sprintId}/stop`);
    }
}