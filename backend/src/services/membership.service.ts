import { ApiError } from "../api/middleware/error.js";
import type { AuthenticatedUser } from "../auth/middleware.js";
import { requireProjectAccess, requireProjectAdmin } from "../auth/permissions.js";
import { prisma } from "../models/prisma.js";
import type { MembershipWithUser } from "./serializers.js";
import { hasPrismaErrorCode } from "../types/prisma.js";
import type { MembershipCreateInput } from "../validations/membership.schemas.js";
import { serializeMembership } from "./serializers.js";

const memberInclude = {
  user: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
};

export async function listMemberships(user: AuthenticatedUser, projectId: string) {
  await requireProjectAccess(user, projectId);
  const memberships = (await prisma.membership.findMany({ where: { projectId }, include: memberInclude, orderBy: { createdAt: "asc" } })) as MembershipWithUser[];
  return memberships.map(serializeMembership);
}

export async function addMembership(user: AuthenticatedUser, projectId: string, input: MembershipCreateInput) {
  await requireProjectAdmin(user, projectId);

  const targetUser = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } });
  if (!targetUser) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  try {
    const membership = (await prisma.membership.create({ data: { projectId, userId: input.userId }, include: memberInclude })) as MembershipWithUser;
    return serializeMembership(membership);
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2002")) {
      throw new ApiError(409, "MEMBERSHIP_EXISTS", "User is already a member of this project");
    }
    throw error;
  }
}

export async function removeMembership(user: AuthenticatedUser, projectId: string, userId: string) {
  await requireProjectAdmin(user, projectId);
  const activeTaskCount = await prisma.task.count({
    where: { projectId, assigneeId: userId, status: { in: ["TODO", "IN_PROGRESS"] } }
  });
  if (activeTaskCount > 0) {
    throw new ApiError(400, "ACTIVE_TASKS_BLOCK_REMOVAL", "Reassign or complete active tasks before removing this member");
  }
  await prisma.membership.delete({ where: { projectId_userId: { projectId, userId } } });
}
