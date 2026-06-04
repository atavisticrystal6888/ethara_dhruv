import { z } from "zod";
import { projectRoles, recurrencePatterns, taskAssignmentTypes, taskIssueTypes, taskPriorities, taskStatuses } from "../types/domain.js";

const dueDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Due date must be a valid date");
const estimatedMinutesSchema = z.number().int().min(0).max(100_000);
const storyPointsSchema = z.number().int().min(0).max(100);
const trackedMinutesDeltaSchema = z.number().int().min(1).max(10_080);
const timerActionSchema = z.enum(["START", "STOP"]);
const labelsSchema = z.array(z.string().trim().min(1).max(24)).max(8);

export const taskIdParamsSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1)
});

export const taskListQuerySchema = z.object({
  status: z.enum(taskStatuses).optional(),
  assigneeId: z.string().min(1).optional(),
  issueType: z.enum(taskIssueTypes).optional(),
  priority: z.enum(taskPriorities).optional(),
  sprintId: z.string().min(1).optional(),
  backlogOnly: z.coerce.boolean().optional(),
  q: z.string().trim().max(120).optional(),
  orderBy: z.enum(["sortOrder", "dueDate", "priority", "createdAt", "updatedAt"]).optional(),
  orderDirection: z.enum(["asc", "desc"]).optional()
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(taskStatuses).default("TODO"),
  issueType: z.enum(taskIssueTypes).default("TASK"),
  priority: z.enum(taskPriorities).default("MEDIUM"),
  assignmentType: z.enum(taskAssignmentTypes).default("USER"),
  assigneeId: z.string().min(1).optional(),
  assigneeRole: z.enum(projectRoles).optional(),
  dueDate: dueDateSchema,
  sprintId: z.string().min(1).optional().nullable(),
  storyPoints: storyPointsSchema.default(0),
  labels: labelsSchema.default([]),
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
  issueType: z.enum(taskIssueTypes).optional(),
  priority: z.enum(taskPriorities).optional(),
  assignmentType: z.enum(taskAssignmentTypes).optional(),
  assigneeId: z.string().min(1).optional(),
  assigneeRole: z.enum(projectRoles).optional(),
  dueDate: dueDateSchema.optional(),
  sprintId: z.string().min(1).optional().nullable(),
  storyPoints: storyPointsSchema.optional(),
  labels: labelsSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
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

export const taskCommentCreateSchema = z.object({
  body: z.string().trim().min(1).max(1200)
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskListQueryInput = z.infer<typeof taskListQuerySchema>;
export type TaskCommentCreateInput = z.infer<typeof taskCommentCreateSchema>;
