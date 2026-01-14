import { IssueRepository } from "./issue.repository";

export class IssueService {
    async countByStatus(statusId: number): Promise<{ count: number }> {
        return await IssueRepository.countByStatus(statusId);
    }
}