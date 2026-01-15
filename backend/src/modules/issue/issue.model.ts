export enum IssueType {
    EPIC = "EPIC",
    STORY = "STORY",
    TASK = "TASK",
    SUBTASK = "SUBTASK",
    BUG = "BUG"
}

export interface Issue {
    id: number;
    projectId: number;
    springId?: number;
    parentId?: number;
    type: IssueType;
    title: string;
    description?: string;
    statusId: number;
    assigneeId?: number;
    createdAt: string;
    updatedAt: string;
}
