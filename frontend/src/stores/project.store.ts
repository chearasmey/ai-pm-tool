import { defineStore } from "pinia";
import api from "@/api/axios";
import type { ProjectTypeEnum } from "@/types/project";

export const useProjectStore = defineStore("project", {
    state: () => ({
        projects: [],
        pagination: {},
        loading: false
    }),

    actions: {
        async fetchProjects(type: ProjectTypeEnum, page: number, limit: number, search: string) {
            this.loading = true;
            try {
                const res = await api.get("/projects", {
                    params: { type, page, limit, search }
                });
                this.projects = res.data.data.items;
                this.pagination = res.data.data.pagination;
            } finally {
                this.loading = false;
            }
        }
    }
});
