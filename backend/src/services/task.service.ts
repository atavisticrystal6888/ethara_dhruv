import { ApiError } from "../api/middleware/error.js";
import type { AuthenticatedUser } from "../auth/middleware.js";
import { canUpdateTaskStatusOnly, requireProjectAccess, requireProjectAdmin } from "../auth/permissions.js";
import { prisma } from "../models/prisma.js";
import type { DbMembership, DbTask } from "../types/prisma.js";
import type { TaskCreateInput, TaskUpdateInput } from "../validations/task.schemas.js";
import type { TaskWithUsers } from "./serializers.js";
import { serializeTask } from "./serializers.js";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
};

async function assertAssigneeMembership(projectId: string, assigneeId: string) {
  const membership = (await prisma.membership.findUnique({ where: { projectId_userId: { projectId, userId: assigneeId } } })) as DbMembership | null;
  if (!membership) {
    throw new ApiError(400, "INVALID_ASSIGNEE", "Task assignee must be a member of the project");
  }
}

export async function listTasks(user: AuthenticatedUser, projectId: string, filters: { status?: string; assigneeId?: string }) {
  await requireProjectAccess(user, projectId);
  const tasks = (await prisma.task.findMany({
    where: { projectId, status: filters.status as never, assigneeId: filters.assigneeId },
    include: taskInclude,
    orderBy: { createdAt: "desc" }
  })) as TaskWithUsers[];
  return tasks.map((task) => serializeTask(task));
}

export async function createTask(user: AuthenticatedUser, projectId: string, input: TaskCreateInput) {
  await requireProjectAdmin(user, projectId);
  await assertAssigneeMembership(projectId, input.assigneeId);
  const task = (await prisma.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description || null,
      status: input.status,
      assigneeId: input.assigneeId,
      createdById: user.id,
      dueDate: new Date(input.dueDate)
    },
    include: taskInclude
  })) as TaskWithUsers;
  return serializeTask(task);
}

export async function getTask(user: AuthenticatedUser, projectId: string, taskId: string) {
  await requireProjectAccess(user, projectId);
  const task = (await prisma.task.findFirst({ where: { id: taskId, projectId }, include: taskInclude })) as TaskWithUsers | null;
  if (!task) throw new ApiError(404, "NOT_FOUND", "Task not found");
  return serializeTask(task);
}

export async function updateTask(user: AuthenticatedUser, projectId: string, taskId: string, input: TaskUpdateInput) {
  await requireProjectAccess(user, projectId);
  const existingTask = (await prisma.task.findFirst({ where: { id: taskId, projectId } })) as DbTask | null;
  if (!existingTask) throw new ApiError(404, "NOT_FOUND", "Task not found");

  if (user.role !== "ADMIN") {
    const requestedFields = Object.keys(input);
    if (!canUpdateTaskStatusOnly(user, existingTask.assigneeId) || requestedFields.some((field) => field !== "status")) {
      throw new ApiError(403, "FORBIDDEN", "Members can update status only for assigned tasks");
    }
  }

  if (input.assigneeId) {
    await assertAssigneeMembership(projectId, input.assigneeId);
  }

  const task = (await prisma.task.update({
    where: { id: taskId },
    data: {
      title: input.title,
      description: input.description === undefined ? undefined : input.description || null,
      status: input.status,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined
    },
    include: taskInclude
  })) as TaskWithUsers;
  return serializeTask(task);
}

export async function deleteTask(user: AuthenticatedUser, projectId: string, taskId: string) {
  await requireProjectAdmin(user, projectId);
  await prisma.task.delete({ where: { id: taskId } });
}
