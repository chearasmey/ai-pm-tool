export interface ProjectInterface {
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

export interface ProjectMemberInterface {
    userId: number;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
}

export enum ProjectRoleEnum {
    'MEMBER' = 'member',
    'ADMIN' = 'admin'
}

export enum ProjectTypeEnum {
    SCRUM = 'scrum',
    KANBAN = 'kanban'
}

export type StarredProject = ProjectInterface & {
    starredAt: string;
} 