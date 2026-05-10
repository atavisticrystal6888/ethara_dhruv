import { z } from "zod";

export const projectIdParamsSchema = z.object({
  projectId: z.string().min(1)
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal(""))
});

export const projectUpdateSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal(""))
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
