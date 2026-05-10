import { z } from "zod";
import { taskStatuses } from "../types/domain.js";

const dueDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Due date must be a valid date");

export const taskIdParamsSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1)
});

export const taskListQuerySchema = z.object({
  status: z.enum(taskStatuses).optional(),
  assigneeId: z.string().min(1).optional()
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(taskStatuses),
  assigneeId: z.string().min(1),
  dueDate: dueDateSchema
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(taskStatuses).optional(),
  assigneeId: z.string().min(1).optional(),
  dueDate: dueDateSchema.optional()
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
