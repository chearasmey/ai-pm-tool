import { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { IssueService } from "./issue.service";
const issueService = new IssueService();
export class IssueController {
    async countByStatus(req: Request, res: Response) {
        const { statusId } = req.params;
        const count = await issueService.countByStatus(Number(statusId));
        return successResponse(res, count, "Count by status successfully", 200);
    }
}