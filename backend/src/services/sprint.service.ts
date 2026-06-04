import { ApiError } from "../api/middleware/error.js";
import type { AuthenticatedUser } from "../auth/middleware.js";
import { requireProjectAccess, requireProjectAdmin } from "../auth/permissions.js";
import { database } from "../models/database.js";
import type { DbSprint } from "../types/database.js";
import type { SprintCreateInput, SprintUpdateInput } from "../validations/sprint.schemas.js";
import { serializeSprint } from "./serializers.js";

async function assertActiveSprintAvailability(projectId: string, excludeSprintId?: string) {
  const activeSprint = (await database.sprint.findFirst({ where: { projectId, status: "ACTIVE" } })) as DbSprint | null;
  if (activeSprint && activeSprint.id !== excludeSprintId) {
    throw new ApiError(409, "ACTIVE_SPRINT_EXISTS", "Only one sprint can be active in a project at a time");
  }
}

export async function listSprints(user: AuthenticatedUser, projectId: string) {
  await requireProjectAccess(user, projectId);
  const sprints = (await database.sprint.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } })) as DbSprint[];
  return sprints.map((sprint) => serializeSprint(sprint));
}

export async function createSprint(user: AuthenticatedUser, projectId: string, input: SprintCreateInput) {
  await requireProjectAdmin(user, projectId);
  if (input.status === "ACTIVE") {
    await assertActiveSprintAvailability(projectId);
  }

  const sprint = (await database.sprint.create({
    data: {
      projectId,
      name: input.name,
      goal: input.goal || null,
      status: input.status,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null
    }
  })) as DbSprint;

  return serializeSprint(sprint);
}

export async function updateSprint(user: AuthenticatedUser, projectId: string, sprintId: string, input: SprintUpdateInput) {
  await requireProjectAdmin(user, projectId);
  const existingSprint = (await database.sprint.findFirst({ where: { id: sprintId, projectId } })) as DbSprint | null;
  if (!existingSprint) {
    throw new ApiError(404, "NOT_FOUND", "Sprint not found");
  }

  if (input.status === "ACTIVE") {
    await assertActiveSprintAvailability(projectId, sprintId);
  }

  const sprint = (await database.sprint.update({
    where: { id: sprintId },
    data: {
      name: input.name,
      goal: input.goal === undefined ? undefined : input.goal || null,
      status: input.status,
      startDate: input.startDate === undefined ? undefined : input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate === undefined ? undefined : input.endDate ? new Date(input.endDate) : null
    }
  })) as DbSprint;

  return serializeSprint(sprint);
}