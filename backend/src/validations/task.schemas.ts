import { z } from "zod";
import { projectRoles, recurrencePatterns, taskAssignmentTypes, taskStatuses } from "../types/domain.js";

const dueDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Due date must be a valid date");
const estimatedMinutesSchema = z.number().int().min(0).max(100_000);
const trackedMinutesDeltaSchema = z.number().int().min(1).max(10_080);
const timerActionSchema = z.enum(["START", "STOP"]);

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
  status: z.enum(taskStatuses).default("TODO"),
  assignmentType: z.enum(taskAssignmentTypes).default("USER"),
  assigneeId: z.string().min(1).optional(),
  assigneeRole: z.enum(projectRoles).optional(),
  dueDate: dueDateSchema,
  estimatedMinutes: estimatedMinutesSchema.default(0),
  recurrencePattern: z.enum(recurrencePatterns).default("NONE")
}).superRefine((value, context) => {
  if (value.assignmentType === "USER" && !value.assigneeId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["assigneeId"], message: "An assignee is required for user assignment" });
  }
  if (value.assignmentType === "ROLE" && !value.assigneeRole) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["assigneeRole"], message: "A project role is required for role assignment" });
  }
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(taskStatuses).optional(),
  assignmentType: z.enum(taskAssignmentTypes).optional(),
  assigneeId: z.string().min(1).optional(),
  assigneeRole: z.enum(projectRoles).optional(),
  dueDate: dueDateSchema.optional()
  ,
  estimatedMinutes: estimatedMinutesSchema.optional(),
  trackedMinutesDelta: trackedMinutesDeltaSchema.optional(),
  timerAction: timerActionSchema.optional(),
  recurrencePattern: z.enum(recurrencePatterns).optional()
}).superRefine((value, context) => {
  if (value.assignmentType === "USER" && !value.assigneeId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["assigneeId"], message: "An assignee is required for user assignment" });
  }
  if (value.assignmentType === "ROLE" && !value.assigneeRole) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["assigneeRole"], message: "A project role is required for role assignment" });
  }
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
