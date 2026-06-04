import { z } from "zod";
import { sprintStatuses } from "../types/domain.js";

const sprintDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Sprint date must be a valid date");

export const sprintCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  goal: z.string().trim().max(300).optional().or(z.literal("")),
  status: z.enum(sprintStatuses).default("PLANNED"),
  startDate: sprintDateSchema.optional().nullable(),
  endDate: sprintDateSchema.optional().nullable()
});

export const sprintUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  goal: z.string().trim().max(300).optional().or(z.literal("")),
  status: z.enum(sprintStatuses).optional(),
  startDate: sprintDateSchema.optional().nullable(),
  endDate: sprintDateSchema.optional().nullable()
});

export const sprintIdParamsSchema = z.object({
  projectId: z.string().min(1),
  sprintId: z.string().min(1)
});

export type SprintCreateInput = z.infer<typeof sprintCreateSchema>;
export type SprintUpdateInput = z.infer<typeof sprintUpdateSchema>;