import type { AuthenticatedUser } from "./middleware.js";
import { ApiError } from "../api/middleware/error.js";
import { prisma } from "../models/prisma.js";
import type { DbMembership, DbProject } from "../types/prisma.js";

export function requireAdmin(user: AuthenticatedUser) {
  if (user.role !== "ADMIN") {
    throw new ApiError(403, "FORBIDDEN", "Admin access is required");
  }
}

export async function requireProjectAccess(user: AuthenticatedUser, projectId: string) {
  if (user.role === "ADMIN") {
    const project = (await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })) as Pick<DbProject, "id"> | null;
    if (!project) throw new ApiError(404, "NOT_FOUND", "Project not found");
    return;
  }

  const membership = (await prisma.membership.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
    select: { id: true }
  })) as Pick<DbMembership, "id"> | null;
  if (!membership) {
    throw new ApiError(403, "FORBIDDEN", "You do not have access to this project");
  }
}

export async function requireProjectAdmin(user: AuthenticatedUser, projectId?: string) {
  requireAdmin(user);
  if (!projectId) return;
  const project = (await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })) as Pick<DbProject, "id"> | null;
  if (!project) throw new ApiError(404, "NOT_FOUND", "Project not found");
}

export function canUpdateTaskStatusOnly(user: AuthenticatedUser, assigneeId: string) {
  return user.role === "ADMIN" || user.id === assigneeId;
}
