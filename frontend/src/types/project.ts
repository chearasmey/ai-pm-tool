import type { ProjectTypeEnum } from "./projectTypeEnum";

export interface ProjectType {
    id?: number;
    name: string;
    projectKey: string;
    type: ProjectTypeEnum;
    leadUserName?: string;
    description?: string;
    leadUserId?: number;
    createdAt?: string;
    updatedAt?: string;
}