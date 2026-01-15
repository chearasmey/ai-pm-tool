import { z } from "zod";

export const IssueTypeEnum = z.enum(["EPIC", "STORY", "TASK", "BUG", "SUBTASK"]);
export const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createIssueSchema = z.object({
    params: z.object({
        projectKey: z.string().min(2)
    }),
    body: z.object({
        title: z.string().min(2, "Title is required"),
        type: IssueTypeEnum,
        description: z.string().optional(),

        startDate: z.string().datetime().optional(),
        dueDate: z.string().datetime().optional(),

        originalEstimate: z.number().int().min(0).optional(),     // minutes
        remainingEstimate: z.number().int().min(0).optional(),    // minutes
        timeSpent: z.number().int().min(0).optional(),            // minutes

        priority: PriorityEnum.optional(),

        statusId: z.number().nullable().optional(),
        assigneeId: z.number().nullable().optional()
    }).superRefine((data, ctx) => {
        if (data.startDate && data.dueDate) {
            if (new Date(data.dueDate).getTime() < new Date(data.startDate).getTime()) {
                ctx.addIssue({
                    code: "custom",
                    message: "Due date cannot be earlier than start date",
                    path: ["dueDate"]
                });
            }
        }
    })
});
