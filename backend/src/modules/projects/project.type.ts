export enum ProjectType {
  SCRUM = "scrum",
  KANBAN = "kanban"
}

export interface ProjectInterface {
  name: string;
  projectKey?: string;
  type: string;
  description?: string;
  leadUserId?: number;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export enum ProjectRole {
  MEMBER = "member",
  ADMIN = "admin"
}