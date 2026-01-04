import { z } from "zod";
import { ProjectType } from "./project.type";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    projectKey: z
      .string()
      .min(2)
      .max(10)
      .regex(/^[A-Z]+$/, "Project key must be uppercase letters"),
    type: z.nativeEnum(ProjectType),
    description: z.string().optional()
  })
});
