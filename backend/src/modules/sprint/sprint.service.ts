import { SprintRepository } from "./sprint.repository";

export class SprintService {
    static async create(projectId: number, payload: { name: string; startDate?: string; endDate?: string; goal?: string | null }, user: any) {
        return await SprintRepository.create(projectId, {...payload, createdBy: user.id});
    };
}