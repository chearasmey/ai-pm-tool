import { ProjectType } from "./project.type";

export interface Project {
     id: number;
      name: string;
      projectKey?: string;
      type: ProjectType;
      description?: string;
      leadUserId?: number;
      createdBy?: number;
      createdAt?: string;
      updatedAt?: string;
}