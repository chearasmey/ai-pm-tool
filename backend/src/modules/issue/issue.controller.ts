import { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { IssueService } from "./issue.service";
import { CreateIssueRequest } from "./issue.request";
const issueService = new IssueService();
export class IssueController {
    async countByStatus(req: Request, res: Response) {
        const { statusId } = req.params;
        const count = await issueService.countByStatus(Number(statusId));
        return successResponse(res, count, "Count by status successfully", 200);
    }

    async createIssue(req: Request, res: Response) {
        const createIssueRequest: CreateIssueRequest = req.body;
        const user = req.user;
        const newIssue = await issueService.createIssue(user, req.params.projectKey, createIssueRequest);
        return successResponse(res, newIssue, "Issue created successfully", 201);
    }

    async getIssueMetaData(req: Request, res: Response) {
        const user = req.user;
        const metaData = await issueService.getIssueMetaData(user, req.params.projectKey);
        return successResponse(res, metaData, "Issue meta-data fetched successfully", 200);
    }

    async moveIssue(req: Request, res: Response) {
        const { issueId } = req.params;
        const { statusId } = req.body;
        const updatedIssue = await issueService.moveIssue(Number(issueId), statusId);
        return successResponse(res, updatedIssue, "Issue moved successfully", 200);
    }

    async getIssueById(req: Request, res: Response) {
        const { id } = req.params;
        const user = req.user;
        const issue = await issueService.getIssueById(Number(id), user);
        return successResponse(res, issue, "Issue fetched successfully", 200);
    }

    async updateIssueById(req: Request, res: Response) {
        const { id } = req.params;
        const updateData = req.body;
        const user = req.user;
        const updatedIssue = await issueService.updateIssueById(Number(id), updateData, user);
        return successResponse(res, updatedIssue, "Issue updated successfully", 200);
    }

    async deleteIssueById(req: Request, res: Response) {
        const { id } = req.params;
        const user = req.user;
        const cascade = req.query.cascade === 'true';
        const result = await issueService.deleteIssueById(Number(id), user, cascade);
        return successResponse(res, result, "Issue deleted successfully", 200);
    }
}