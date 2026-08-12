import { z } from "zod";

export const createProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, { error: "Project name is required" })
    .max(100, { error: "Project name must be at most 100 characters" }),
  description: z
    .string()
    .trim()
    .min(1, { error: "Description is required" })
    .max(500, { error: "Description must be at most 500 characters" }),
  memberIds: z.array(z.string().uuid()).optional(),
  requirementsDocument: z.object({
    key: z.string(),
    filename: z.string()
  }).optional()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
