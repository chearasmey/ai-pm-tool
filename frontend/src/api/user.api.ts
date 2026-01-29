import api from "./axios";

export class UserService {
    static async getUsers() {
        return await api.get("/users");
    }
    static async getSystemUsers(search: string, page: number, limit: number) {
        return await api.get(`/users/admin/list?search=${search}&page=${page}&limit=${limit}`);
    }

    static async createSystemUser(payload: any) {
        return await api.post(`/users/create`, payload);
    }

    static async updateSystemUser(userId: number, payload: any) {
        return await api.put(`/users/${userId}/update`, payload);
    }

    static async resetPassword(userId: number, payload: any) {
        return await api.post(`/users/${userId}/reset-password`);
    }

    static async deleteUser(userId: number) {
        return await api.delete(`/users/${userId}/delete`);
    }
}