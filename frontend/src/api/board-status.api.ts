import api from "./axios";

export class BoardStatusService {
    static async getBoards(projectKey: string) {
        return await api.get(`/boards/${projectKey}`);
    }

    static async createBoardStatus(projectKey: string, payload: { name: string; category: string }) {
        return await api.post(`/boards/${projectKey}`, payload);
    }

    static async updateBoardStatus(projectKey: string, payload: { statusId: number; name: string }) {
        return await api.put(`/boards/${projectKey}`, payload);
    }

    static async deleteBoardStatus(statusId: number) {
        return await api.delete(`/boards/statuses/${statusId}`);
    }
}