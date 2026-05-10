import { ApiError } from "../api/middleware/error.js";
import type { AuthenticatedUser } from "../auth/middleware.js";
import { requireProjectAccess, requireProjectAdmin } from "../auth/permissions.js";
import { database } from "../models/database.js";
import type { DbMembership } from "../types/database.js";
import type { MembershipWithUser } from "./serializers.js";
import { hasDatabaseErrorCode } from "../types/database.js";
import type { MembershipCreateInput, MembershipUpdateInput } from "../validations/membership.schemas.js";
import { serializeMembership } from "./serializers.js";

async function listProjectMemberships(projectId: string) {
  return (await database.membership.findMany({ where: { projectId } })) as DbMembership[];
}

async function assertOwnerCanChange(projectId: string, userId: string, nextRole?: DbMembership["role"]) {
  const memberships = await listProjectMemberships(projectId);
  const targetMembership = memberships.find((membership) => membership.userId === userId);
  if (!targetMembership) {
    throw new ApiError(404, "NOT_FOUND", "Membership not found");
  }

  if (targetMembership.role !== "OWNER") {
    return targetMembership;
  }

  const ownerCount = memberships.filter((membership) => membership.role === "OWNER").length;
  if (ownerCount <= 1 && nextRole !== "OWNER") {
    throw new ApiError(400, "LAST_OWNER_BLOCKED", "Projects must keep at least one owner");
  }

  return targetMembership;
}

const memberInclude = {
  user: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
};

export async function listMemberships(user: AuthenticatedUser, projectId: string) {
  await requireProjectAccess(user, projectId);
  const memberships = (await database.membership.findMany({ where: { projectId }, include: memberInclude, orderBy: { createdAt: "asc" } })) as MembershipWithUser[];
  return memberships.map(serializeMembership);
}

export async function addMembership(user: AuthenticatedUser, projectId: string, input: MembershipCreateInput) {
  await requireProjectAdmin(user, projectId);

  const targetUser = await database.user.findUnique({ where: { id: input.userId }, select: { id: true } });
  if (!targetUser) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  try {
    const membership = (await database.membership.create({ data: { projectId, userId: input.userId, role: input.role }, include: memberInclude })) as MembershipWithUser;
    return serializeMembership(membership);
  } catch (error) {
    if (hasDatabaseErrorCode(error, "P2002")) {
      throw new ApiError(409, "MEMBERSHIP_EXISTS", "User is already a member of this project");
    }
    throw error;
  }
}

export async function updateMembershipRole(user: AuthenticatedUser, projectId: string, userId: string, input: MembershipUpdateInput) {
  await requireProjectAdmin(user, projectId);
  await assertOwnerCanChange(projectId, userId, input.role);

  const membership = (await database.membership.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role: input.role },
    include: memberInclude
  })) as MembershipWithUser;

  return serializeMembership(membership);
}

export async function removeMembership(user: AuthenticatedUser, projectId: string, userId: string) {
  await requireProjectAdmin(user, projectId);
  await assertOwnerCanChange(projectId, userId);
  const activeTaskCount = await database.task.count({
    where: { projectId, assigneeId: userId, status: { in: ["TODO", "IN_PROGRESS"] } }
  });
  if (activeTaskCount > 0) {
    throw new ApiError(400, "ACTIVE_TASKS_BLOCK_REMOVAL", "Reassign or complete active tasks before removing this member");
  }
  await database.membership.delete({ where: { projectId_userId: { projectId, userId } } });
}
