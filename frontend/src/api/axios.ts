import axios from "axios";
import { useAuthStore } from "../stores/auth.store";

const api = axios.create({
    baseURL: "http://localhost:4000/api",
    withCredentials: true
});

api.interceptors.request.use(config => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
        config.headers.Authorization =
            `Bearer ${authStore.accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    res => res,
    async error => {
        const originalRequest = error.config;
        if (originalRequest.url?.includes("/auth/refresh-token")) {
            throw error;
        }

        if (error.response?.status === 401) {
            throw error;
        }

        if (originalRequest._retry) {
            throw error;
        }
        originalRequest._retry = true;

        try {
            const auth = useAuthStore();
            await auth.refresh();
            originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;            
            return api(originalRequest);
        } catch (error) {
            globalThis.location.href = "/login";
            throw error;
        }


    }
);


export default api;
