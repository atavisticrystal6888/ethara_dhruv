import { ApiError } from "../api/middleware/error.js";
import type { AuthenticatedUser } from "../auth/middleware.js";
import { canUpdateTaskStatusOnly, getProjectMembershipRole, isProjectAdminRole, requireProjectAccess, requireProjectAdmin } from "../auth/permissions.js";
import { database } from "../models/database.js";
import type { DbMembership, DbTask } from "../types/database.js";
import type { ProjectRole, RecurrencePattern, TaskAssignmentType } from "../types/domain.js";
import type { TaskCreateInput, TaskUpdateInput } from "../validations/task.schemas.js";
import type { TaskWithUsers } from "./serializers.js";
import { serializeTask } from "./serializers.js";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
};

async function assertAssigneeMembership(projectId: string, assigneeId: string) {
  const membership = (await database.membership.findUnique({ where: { projectId_userId: { projectId, userId: assigneeId } } })) as DbMembership | null;
  if (!membership) {
    throw new ApiError(400, "INVALID_ASSIGNEE", "Task assignee must be a member of the project");
  }
}

async function assertRoleAssignment(projectId: string, assigneeRole: ProjectRole) {
  const memberships = (await database.membership.findMany({ where: { projectId } })) as DbMembership[];
  if (!memberships.some((membership) => membership.role === assigneeRole)) {
    throw new ApiError(400, "INVALID_ASSIGNEE_ROLE", "Task assignee role must exist on the project");
  }
}

function addRecurringDueDate(dueDate: Date, recurrencePattern: RecurrencePattern) {
  const nextDueDate = new Date(dueDate);
  if (recurrencePattern === "DAILY") {
    nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 1);
  }
  if (recurrencePattern === "WEEKLY") {
    nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 7);
  }
  if (recurrencePattern === "MONTHLY") {
    nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + 1);
  }
  return nextDueDate;
}

async function maybeCreateRecurringTask(task: DbTask) {
  if (task.recurrencePattern === "NONE") {
    return;
  }

  const existingFollowUp = (await database.task.findFirst({ where: { recurrenceParentTaskId: task.id } })) as DbTask | null;
  if (existingFollowUp) {
    return;
  }

  await database.task.create({
    data: {
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: "TODO",
      assignmentType: task.assignmentType,
      assigneeId: task.assigneeId,
      assigneeRole: task.assigneeRole,
      createdById: task.createdById,
      dueDate: addRecurringDueDate(task.dueDate, task.recurrencePattern),
      estimatedMinutes: task.estimatedMinutes,
      trackedMinutes: 0,
      recurrencePattern: task.recurrencePattern,
      recurrenceParentTaskId: task.id
    },
    include: taskInclude
  });
}

function canExecuteTask(user: AuthenticatedUser, task: DbTask, memberRole: ProjectRole | null) {
  return canUpdateTaskStatusOnly(user, task.assigneeId, task.assigneeRole, memberRole);
}

export async function listTasks(user: AuthenticatedUser, projectId: string, filters: { status?: string; assigneeId?: string }) {
  await requireProjectAccess(user, projectId);
  const tasks = (await database.task.findMany({
    where: { projectId, status: filters.status as never, assigneeId: filters.assigneeId },
    include: taskInclude,
    orderBy: { createdAt: "desc" }
  })) as TaskWithUsers[];
  return tasks.map((task) => serializeTask(task));
}

export async function createTask(user: AuthenticatedUser, projectId: string, input: TaskCreateInput) {
  await requireProjectAccess(user, projectId);

  if (input.assignmentType === "ROLE") {
    if (!input.assigneeRole) {
      throw new ApiError(400, "INVALID_ASSIGNEE_ROLE", "Task assignee role must exist on the project");
    }
    await assertRoleAssignment(projectId, input.assigneeRole);
  } else {
    if (!input.assigneeId) {
      throw new ApiError(400, "INVALID_ASSIGNEE", "Task assignee must be a member of the project");
    }
    await assertAssigneeMembership(projectId, input.assigneeId);
  }

  const task = (await database.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description || null,
      status: input.status,
      assignmentType: input.assignmentType,
      assigneeId: input.assignmentType === "USER" ? input.assigneeId : null,
      assigneeRole: input.assignmentType === "ROLE" ? input.assigneeRole : null,
      createdById: user.id,
      dueDate: new Date(input.dueDate),
      estimatedMinutes: input.estimatedMinutes,
      trackedMinutes: 0,
      recurrencePattern: input.recurrencePattern,
      recurrenceParentTaskId: null
    },
    include: taskInclude
  })) as TaskWithUsers;
  return serializeTask(task);
}

export async function getTask(user: AuthenticatedUser, projectId: string, taskId: string) {
  await requireProjectAccess(user, projectId);
  const task = (await database.task.findFirst({ where: { id: taskId, projectId }, include: taskInclude })) as TaskWithUsers | null;
  if (!task) throw new ApiError(404, "NOT_FOUND", "Task not found");
  return serializeTask(task);
}

export async function updateTask(user: AuthenticatedUser, projectId: string, taskId: string, input: TaskUpdateInput) {
  await requireProjectAccess(user, projectId);
  const existingTask = (await database.task.findFirst({ where: { id: taskId, projectId } })) as DbTask | null;
  if (!existingTask) throw new ApiError(404, "NOT_FOUND", "Task not found");

  const memberRole = user.role === "ADMIN" ? null : await getProjectMembershipRole(user.id, projectId);
  const projectAdmin = user.role === "ADMIN" || isProjectAdminRole(memberRole);
  const executableTask = canExecuteTask(user, existingTask, memberRole);
  const executionFields = new Set(["status", "trackedMinutesDelta", "timerAction"]);

  if (!projectAdmin) {
    const requestedFields = Object.keys(input);
    if (!executableTask || requestedFields.some((field) => !executionFields.has(field))) {
      throw new ApiError(403, "FORBIDDEN", "Members can only update execution fields for delegated tasks");
    }
  }

  const nextAssignmentType = (input.assignmentType ?? (input.assigneeRole ? "ROLE" : input.assigneeId ? "USER" : existingTask.assignmentType)) as TaskAssignmentType;
  const nextAssigneeId = nextAssignmentType === "USER" ? (input.assigneeId ?? existingTask.assigneeId) : null;
  const nextAssigneeRole = nextAssignmentType === "ROLE" ? (input.assigneeRole ?? existingTask.assigneeRole) : null;

  if (nextAssignmentType === "USER") {
    if (!nextAssigneeId) {
      throw new ApiError(400, "INVALID_ASSIGNEE", "Task assignee must be a member of the project");
    }
    await assertAssigneeMembership(projectId, nextAssigneeId);
  }

  if (nextAssignmentType === "ROLE") {
    if (!nextAssigneeRole) {
      throw new ApiError(400, "INVALID_ASSIGNEE_ROLE", "Task assignee role must exist on the project");
    }
    await assertRoleAssignment(projectId, nextAssigneeRole);
  }

  const now = new Date();
  let trackedMinutes = existingTask.trackedMinutes;
  let timerStartedAt = existingTask.timerStartedAt;
  let timerUserId = existingTask.timerUserId;

  if (input.timerAction === "START") {
    if (!projectAdmin && !executableTask) {
      throw new ApiError(403, "FORBIDDEN", "You cannot start a timer for this task");
    }
    if (timerStartedAt) {
      throw new ApiError(409, "TIMER_ALREADY_RUNNING", "A timer is already running for this task");
    }
    timerStartedAt = now;
    timerUserId = user.id;
  }

  if (input.timerAction === "STOP") {
    if (!timerStartedAt) {
      throw new ApiError(400, "TIMER_NOT_RUNNING", "There is no active timer for this task");
    }
    if (!projectAdmin && timerUserId !== user.id) {
      throw new ApiError(403, "FORBIDDEN", "Only the active timer owner can stop this timer");
    }

    trackedMinutes += Math.max(1, Math.ceil((now.getTime() - timerStartedAt.getTime()) / 60_000));
    timerStartedAt = null;
    timerUserId = null;
  }

  if (input.trackedMinutesDelta !== undefined) {
    trackedMinutes += input.trackedMinutesDelta;
  }

  const task = (await database.task.update({
    where: { id: taskId },
    data: {
      title: input.title,
      description: input.description === undefined ? undefined : input.description || null,
      status: input.status,
      assignmentType: nextAssignmentType,
      assigneeId: nextAssigneeId,
      assigneeRole: nextAssigneeRole,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      estimatedMinutes: input.estimatedMinutes,
      trackedMinutes,
      timerStartedAt,
      timerUserId,
      recurrencePattern: input.recurrencePattern
    },
    include: taskInclude
  })) as TaskWithUsers;

  if (existingTask.status !== "DONE" && task.status === "DONE") {
    await maybeCreateRecurringTask({
      ...existingTask,
      status: task.status,
      assignmentType: task.assignmentType,
      assigneeId: task.assignee?.id ?? nextAssigneeId,
      assigneeRole: task.assigneeRole,
      dueDate: new Date(task.dueDate),
      estimatedMinutes: task.estimatedMinutes,
      trackedMinutes: task.trackedMinutes,
      timerStartedAt: task.timerStartedAt ? new Date(task.timerStartedAt) : null,
      timerUserId: task.timerUserId,
      recurrencePattern: task.recurrencePattern,
      recurrenceParentTaskId: task.recurrenceParentTaskId,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt)
    });
  }

  return serializeTask(task);
}

export async function deleteTask(user: AuthenticatedUser, projectId: string, taskId: string) {
  await requireProjectAdmin(user, projectId);
  await database.task.delete({ where: { id: taskId } });
}
