export interface CreateIssueRequest {
    projectId: number;
    title: string;
    type: string;
    description: string | null;
    startDate: string | null;
    dueDate: string | null;
    originalEstimate: number | null;
    remainingEstimate: number | null;
    timeSpent: number | null;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    statusId: number;
    assigneeId: number | null;
    createdBy: number;
}