import type { ProjectTypeEnum } from "../types/projectTypeEnum";
import api from "./axios";

export const createProject = (data: {
  name: string;
  projectKey: string;
  type: ProjectTypeEnum;
  description?: string;
}) => {
  return api.post("/projects", data);
};
