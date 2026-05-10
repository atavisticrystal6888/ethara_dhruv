import type { AuthenticatedUser } from "./middleware.js";
import { ApiError } from "../api/middleware/error.js";
import { database } from "../models/database.js";
import type { DbMembership, DbProject } from "../types/database.js";
import type { ProjectRole } from "../types/domain.js";

const projectAdminRoles = new Set<ProjectRole>(["OWNER", "MANAGER"]);

export function requireAdmin(user: AuthenticatedUser) {
  if (user.role !== "ADMIN") {
    throw new ApiError(403, "FORBIDDEN", "Admin access is required");
  }
}

async function ensureProjectExists(projectId: string) {
  const project = (await database.project.findUnique({ where: { id: projectId }, select: { id: true } })) as Pick<DbProject, "id"> | null;
  if (!project) {
    throw new ApiError(404, "NOT_FOUND", "Project not found");
  }
  return project;
}

export function isProjectAdminRole(role: ProjectRole | null | undefined) {
  return role ? projectAdminRoles.has(role) : false;
}

export async function getProjectMembershipRole(userId: string, projectId: string) {
  const membership = (await database.membership.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true }
  })) as Pick<DbMembership, "role"> | null;

  return membership?.role ?? null;
}

export async function requireProjectAccess(user: AuthenticatedUser, projectId: string) {
  if (user.role === "ADMIN") {
    await ensureProjectExists(projectId);
    return;
  }

  const membership = (await database.membership.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
    select: { id: true }
  })) as Pick<DbMembership, "id"> | null;
  if (!membership) {
    await ensureProjectExists(projectId);
    throw new ApiError(403, "FORBIDDEN", "You do not have access to this project");
  }
}

export async function requireProjectAdmin(user: AuthenticatedUser, projectId?: string) {
  if (!projectId) {
    requireAdmin(user);
    return;
  }

  if (user.role === "ADMIN") {
    await ensureProjectExists(projectId);
    return;
  }

  const role = await getProjectMembershipRole(user.id, projectId);
  if (!role) {
    await ensureProjectExists(projectId);
    throw new ApiError(403, "FORBIDDEN", "Project manager access is required");
  }

  if (!isProjectAdminRole(role)) {
    throw new ApiError(403, "FORBIDDEN", "Project manager access is required");
  }
}

export function canUpdateTaskStatusOnly(user: AuthenticatedUser, assigneeId: string | null, assigneeRole?: ProjectRole | null, memberRole?: ProjectRole | null) {
  return user.role === "ADMIN" || user.id === assigneeId || (assigneeRole !== null && assigneeRole !== undefined && memberRole === assigneeRole);
}
