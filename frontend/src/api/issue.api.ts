import api from "./axios";

export class IssueService {

    static async countByStatus(statusId: number) {
        return await api.get<{ count: number }>(`/issues/count-by-status/${statusId}`);
    }

    static async getIssueMetaData(projectKey: string) {
        return await api.get(`/issues/${projectKey}/meta-data`);
    }

    static async createIssue(projectKey: string, payload: any) {
        return await api.post(`/issues/${projectKey}`, payload);
    }

    static async moveIssue(issueId: number, statusId: number) {
        return await api.put(`/issues/${issueId}/move`, { statusId });
    }

    static async getIssueById(issueId: number) {
        return await api.get(`/issues/detail/${issueId}`);
    }

    static async updateIssue(issueId: number, updateData: any) {
        return await api.put(`/issues/detail/${issueId}`, updateData);
    }

    static async deleteIssue(issueId: number, cascade: boolean = false) {
        return await api.delete(`/issues/detail/${issueId}?cascade=${cascade}`);
    }
}