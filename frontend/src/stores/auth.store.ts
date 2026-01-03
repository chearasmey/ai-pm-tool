import { defineStore } from "pinia";
import api from "../api/axios";
import { UserRole } from "../types/role";

interface User {
    id: number;
    email: string;
    role: UserRole;
    mfaEnabled: boolean;
}

export const useAuthStore = defineStore("auth", {

    state: () => ({
        accessToken: null as string | null,
        user: null as User | null,
        isInitialized: false
    }),

    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        role: (state) => state.user?.role
    },

    actions: {
        async login(email: string, password: string, otp?: string) {
            const { data } = await api.post("/auth/login", {
                email,
                password,
                otp
            });
            if (data.success) {
                this.accessToken = data.data.accessToken;
                this.user = data.data.user;
            }
        },

        async refresh() {
            try {
                const { data, status } = await api.post("/auth/refresh-token");
                if (status === 200) {
                    this.accessToken = data.data.accessToken;
                    this.user = data.data.user;
                }
            } catch (error: any) {
                this.accessToken = null;
                this.user = null;
                console.error("Refresh token failed:", error);
            } finally {
                this.isInitialized = true;
            }
        },

        async logout() {
            try {
                await api.post("/auth/logout");
            } finally {
                this.accessToken = null;
                this.user = null;
                this.isInitialized = true;
            }
        },

        async generateMfa() {
            return await api.post("/mfa/setup");
        },

        async enableMfa() {
            const result = await api.post("/mfa/enable");
            this.user!.mfaEnabled = true;
            return result;
        },

        async verifyMfa(otp: string) {
            return await api.post("/mfa/verify", {otp});
        },

        async disableMfa() {
            this.user!.mfaEnabled = false;
            return await api.post("/mfa/disable")
        },
        
        async updatePassword(currentPassword: string, newPassword: string) {
            return await api.put("/users/change-password", {currentPassword, newPassword});
        }
    }
});
