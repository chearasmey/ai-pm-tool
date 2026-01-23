import api from "./axios";

export class ForYouService {
    static async get() {
        return await api.get(`/for-you/data`);
    }
}