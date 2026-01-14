import api from "./axios";

export class IssueService {

    static async countByStatus(statusId: number) {
        return await api.get<{ count: number }>(`/issues/count-by-status/${statusId}`);
    }
}