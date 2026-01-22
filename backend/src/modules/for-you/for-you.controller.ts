import { Request, Response } from "express";
import { ForYouService } from "./for-you.service";
import { successResponse } from "../../utils/response";

const service = new ForYouService();

export class ForYouController {
    async get(req: Request, res: Response) {        
        const data = await service.getForYou(req.user);
        return successResponse(res, data, "FOR_YOU");
    }
}
