import api from "./axios";

export class UserService {
    static async getUsers() {
        return await api.get("/users");
    }
}