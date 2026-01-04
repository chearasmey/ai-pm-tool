import axios from "axios";
import { useAuthStore } from "../stores/auth.store";
import { toastStore } from "@/components/ui/toast/toast.store";

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
        toastStore.show(
            error.response?.data?.message || "Error occurred",
            "error"
        );
        const originalRequest = error.config;
        const apiError = {
            status: error.response?.status,
            code: error.response?.data?.code,
            message: error.response?.data?.message,
            errors: error.response?.data?.error
        };
        if (originalRequest.url?.includes("/auth/refresh-token")) {
            throw apiError;
        }

        if (error.response?.status === 401) {
            throw apiError;
        }

        if (originalRequest._retry) {
            throw apiError;
        }
        originalRequest._retry = true;

        try {
            const auth = useAuthStore();
            await auth.refresh();
            originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;
            return api(originalRequest);
        } catch {
            globalThis.location.href = "/login";
            throw apiError;
        }


    }
);


export default api;
