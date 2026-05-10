import { z } from "zod";
import { projectRoles } from "../types/domain.js";

export const membershipCreateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(projectRoles).default("MEMBER")
});

export const membershipUpdateSchema = z.object({
  role: z.enum(projectRoles)
});

export const membershipParamsSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1)
});

export type MembershipCreateInput = z.infer<typeof membershipCreateSchema>;
export type MembershipUpdateInput = z.infer<typeof membershipUpdateSchema>;
