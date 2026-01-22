export interface IssueType {
    id: number;
    projectKey?: string;
    projectId: number;
    sprintId?: number;
    parentId?: number;
    type: string;
    title: string;
    description?: string;
    startDate?: string;
    dueDate?: string;
    originalEstimate?: string;
    remainingEstimate?: string;
    timeSpent?: string;
    priority: string;
    statusId: number;
    assigneeId?: number;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
}