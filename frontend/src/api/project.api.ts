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
}
