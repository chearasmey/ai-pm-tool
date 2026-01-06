import type { ProjectType } from "@/types/project";
import type { ProjectTypeEnum } from "../types/projectTypeEnum";
import api from "./axios";

export class ProjectService {
  static async createProject(data: {
    name: string;
    projectKey: string;
    type: ProjectTypeEnum;
    description?: string;
  }) {
    await api.post("/projects", data);
  }

  static async getProjectByKey(projectKey: string) {
    return await api.get(`/projects/${projectKey}`);
  }

  static async updateProject(projectKey: string, payload: ProjectType) {
    return await api.put(`/projects/${projectKey}`, payload);
  }

  static async deleteProject(projectKey: string) {
    return await api.delete(`/projects/${projectKey}`);
  }
}
