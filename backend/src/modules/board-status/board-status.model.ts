export enum BoardStatusCategory {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
}

export interface BoardStatus {
    id: number;
    projectId: number;
    name: string;
    category: BoardStatusCategory;
    position: number;
    createdAt: string;
    updatedAt: string;
}