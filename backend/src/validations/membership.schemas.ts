import { z } from "zod";

export const membershipCreateSchema = z.object({
  userId: z.string().min(1)
});

export const membershipParamsSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1)
});

export type MembershipCreateInput = z.infer<typeof membershipCreateSchema>;
