import type { ProjectInterface, ProjectTypeEnum } from "@/types/project";
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

  static async updateProject(projectKey: string, payload: ProjectInterface) {
    return await api.put(`/projects/${projectKey}`, payload);
  }

  static async deleteProject(projectKey: string) {
    return await api.delete(`/projects/${projectKey}`);
  }

  static async addProjectMembers(projectKey: string, payload: { userIds: number[], role: 'member' | 'admin' }) {
    return await api.post(`/projects/${projectKey}/members`, payload);
  }

  static async getProjectMembers(projectKey: string, search?: string) {
    return search ? await api.get(`/projects/${projectKey}/members?search=${search}`) : await api.get(`/projects/${projectKey}/members`);
  }

  static async removeMember(projectKey: string, userId: number) {
    return await api.delete(`/projects/${projectKey}/members/${userId}`);
  }

  static async getBoards(projectKey: string) {
    return await api.get(`/projects/${projectKey}/boards`);
  }
}
