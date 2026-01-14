import { Request, Response } from "express";
import { BoardStatusService } from "./board-status.service";
import { successResponse } from "../../utils/response";
const boardStatusService = new BoardStatusService();
export class BoardStatusController {

    async getBoard(req: Request, res: Response) {
        const { projectKey } = req.params;
        const user = req.user;
        const boards = await boardStatusService.getBoard(projectKey, user);
        return successResponse(res, boards, "Get boards successfully", 200);
    }

    async createBoardStatus(req: Request, res: Response) {
        const { projectKey } = req.params;
        const payload = req.body;
        const user = req.user;

        const boardStatus = await boardStatusService.createBoardStatus(projectKey, payload, user);
        return successResponse(res, boardStatus, "Create board status successfully", 201);
    }

    async updateBoardStatus(req: Request, res: Response) {
        const { projectKey } = req.params;
        const payload = req.body;
        const user = req.user;
        const boardStatus = await boardStatusService.updateBoardStatus(projectKey, payload, user);
        return successResponse(res, boardStatus, "Update board status successfully", 200);
    }

    async removeBoardStatus(req: Request, res: Response) {
        const { statusId } = req.params;
        const user = req.user;
        const response = await boardStatusService.removeBoardStatus(Number(statusId), user);
        return successResponse(res, response, "Remove board status successfully", 200);
    }
}