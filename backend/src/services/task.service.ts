import { ApiError } from "../api/middleware/error.js";
import type { AuthenticatedUser } from "../auth/middleware.js";
import { canUpdateTaskStatusOnly, getProjectMembershipRole, isProjectAdminRole, requireProjectAccess, requireProjectAdmin } from "../auth/permissions.js";
import { database } from "../models/database.js";
import type { DbMembership, DbSprint, DbTask } from "../types/database.js";
import type { ProjectRole, RecurrencePattern, TaskActivityType, TaskAssignmentType, TaskStatus } from "../types/domain.js";
import type { TaskCommentCreateInput, TaskCreateInput, TaskListQueryInput, TaskUpdateInput } from "../validations/task.schemas.js";
import type { TaskActivityRecord, TaskCommentRecord, TaskWithUsers } from "./serializers.js";
import { serializeTask, serializeTaskActivity, serializeTaskComment, serializeTaskDetail } from "./serializers.js";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
};

const taskCommentInclude = {
  author: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
};

const taskActivityInclude = {
  actor: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
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

async function assertSprintAssignment(projectId: string, sprintId: string) {
  const sprint = (await database.sprint.findFirst({ where: { id: sprintId, projectId } })) as DbSprint | null;
  if (!sprint) {
    throw new ApiError(400, "INVALID_SPRINT", "Task sprint must belong to the project");
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
      issueType: task.issueType,
      priority: task.priority,
      assignmentType: task.assignmentType,
      assigneeId: task.assigneeId,
      assigneeRole: task.assigneeRole,
      createdById: task.createdById,
      dueDate: addRecurringDueDate(task.dueDate, task.recurrencePattern),
      sprintId: null,
      storyPoints: task.storyPoints,
      labels: task.labels,
      sortOrder: Date.now(),
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

function priorityWeight(priority: string) {
  return priority === "CRITICAL" ? 4 : priority === "HIGH" ? 3 : priority === "MEDIUM" ? 2 : 1;
}

function readableStatus(status: TaskStatus) {
  return status === "TODO" ? "To Do" : status === "IN_PROGRESS" ? "In Progress" : "Done";
}

async function createTaskActivity(taskId: string, actorId: string, type: TaskActivityType, message: string) {
  await database.taskActivity.create({
    data: { taskId, actorId, type, message },
    include: taskActivityInclude
  });
}

function collectTaskActivityMessages(existingTask: DbTask, input: TaskUpdateInput, nextAssignmentType: TaskAssignmentType, nextAssigneeId: string | null, nextAssigneeRole: ProjectRole | null) {
  const messages: string[] = [];

  if (input.status && input.status !== existingTask.status) {
    messages.push(`Status changed from ${readableStatus(existingTask.status)} to ${readableStatus(input.status)}`);
  }
  if (input.priority && input.priority !== existingTask.priority) {
    messages.push(`Priority changed to ${input.priority.toLowerCase()}`);
  }
  if (input.issueType && input.issueType !== existingTask.issueType) {
    messages.push(`Issue type changed to ${input.issueType.toLowerCase()}`);
  }
  if (input.title !== undefined && input.title !== existingTask.title) {
    messages.push("Title updated");
  }
  if (input.description !== undefined && (input.description || null) !== existingTask.description) {
    messages.push("Description updated");
  }
  if (input.sprintId !== undefined && input.sprintId !== existingTask.sprintId) {
    messages.push(input.sprintId ? "Moved into a sprint" : "Moved to backlog");
  }
  if (input.storyPoints !== undefined && input.storyPoints !== existingTask.storyPoints) {
    messages.push(`Story points changed to ${input.storyPoints}`);
  }
  if (input.labels !== undefined) {
    messages.push("Labels updated");
  }
  if (input.assignmentType !== undefined || input.assigneeId !== undefined || input.assigneeRole !== undefined) {
    messages.push(nextAssignmentType === "ROLE" ? `Delegated to ${nextAssigneeRole ?? "role group"}` : nextAssigneeId ? "Assigned to a specific user" : "Assignment updated");
  }
  if (input.trackedMinutesDelta !== undefined) {
    messages.push(`Logged ${input.trackedMinutesDelta} minutes`);
  }
  if (input.timerAction === "START") {
    messages.push("Started timer");
  }
  if (input.timerAction === "STOP") {
    messages.push("Stopped timer");
  }

  return messages;
}

export async function listTasks(user: AuthenticatedUser, projectId: string, filters: TaskListQueryInput) {
  await requireProjectAccess(user, projectId);
  const tasks = (await database.task.findMany({
    where: { projectId },
    include: taskInclude,
    orderBy: { createdAt: "desc" }
  })) as TaskWithUsers[];
  const normalizedQuery = filters.q?.trim().toLowerCase();
  const filteredTasks = tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
    if (filters.issueType && task.issueType !== filters.issueType) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.sprintId && task.sprintId !== filters.sprintId) return false;
    if (filters.backlogOnly && task.sprintId !== null) return false;
    if (normalizedQuery) {
      const haystack = [task.title, task.description ?? "", task.labels.join(" "), task.assignee?.name ?? "", task.createdBy.name]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }
    return true;
  });

  const orderBy = filters.orderBy ?? "sortOrder";
  const direction = filters.orderDirection ?? "asc";
  filteredTasks.sort((left, right) => {
    const compare =
      orderBy === "dueDate"
        ? left.dueDate.getTime() - right.dueDate.getTime()
        : orderBy === "priority"
          ? priorityWeight(left.priority) - priorityWeight(right.priority)
          : orderBy === "createdAt"
            ? left.createdAt.getTime() - right.createdAt.getTime()
            : orderBy === "updatedAt"
              ? left.updatedAt.getTime() - right.updatedAt.getTime()
              : left.sortOrder - right.sortOrder;
    return direction === "asc" ? compare : -compare;
  });

  return filteredTasks
    .filter((task) => !filters.backlogOnly || task.sprintId === null)
    .map((task) => serializeTask(task));
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

  if (input.sprintId) {
    await assertSprintAssignment(projectId, input.sprintId);
  }

  const task = (await database.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description || null,
      status: input.status,
      issueType: input.issueType,
      priority: input.priority,
      assignmentType: input.assignmentType,
      assigneeId: input.assignmentType === "USER" ? input.assigneeId : null,
      assigneeRole: input.assignmentType === "ROLE" ? input.assigneeRole : null,
      createdById: user.id,
      dueDate: new Date(input.dueDate),
      sprintId: input.sprintId ?? null,
      storyPoints: input.storyPoints,
      labels: input.labels,
      sortOrder: Date.now(),
      estimatedMinutes: input.estimatedMinutes,
      trackedMinutes: 0,
      recurrencePattern: input.recurrencePattern,
      recurrenceParentTaskId: null
    },
    include: taskInclude
  })) as TaskWithUsers;
  await createTaskActivity(task.id, user.id, "CREATED", "Created issue");
  return serializeTask(task);
}

export async function getTask(user: AuthenticatedUser, projectId: string, taskId: string) {
  await requireProjectAccess(user, projectId);
  const task = (await database.task.findFirst({ where: { id: taskId, projectId }, include: taskInclude })) as TaskWithUsers | null;
  if (!task) throw new ApiError(404, "NOT_FOUND", "Task not found");
  const comments = (await database.taskComment.findMany({ where: { taskId }, include: taskCommentInclude, orderBy: { createdAt: "asc" } })) as TaskCommentRecord[];
  const activity = (await database.taskActivity.findMany({ where: { taskId }, include: taskActivityInclude, orderBy: { createdAt: "desc" } })) as TaskActivityRecord[];
  return serializeTaskDetail(task, comments, activity);
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

  const nextSprintId = input.sprintId === undefined ? existingTask.sprintId : input.sprintId;

  const now = new Date();
  let trackedMinutes = existingTask.trackedMinutes;
  let timerStartedAt = existingTask.timerStartedAt;
  let timerUserId = existingTask.timerUserId;

  if (nextSprintId) {
    await assertSprintAssignment(projectId, nextSprintId);
  }

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
      issueType: input.issueType,
      priority: input.priority,
      assignmentType: nextAssignmentType,
      assigneeId: nextAssigneeId,
      assigneeRole: nextAssigneeRole,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      sprintId: input.sprintId === undefined ? undefined : nextSprintId,
      storyPoints: input.storyPoints,
      labels: input.labels,
      sortOrder: input.sortOrder,
      estimatedMinutes: input.estimatedMinutes,
      trackedMinutes,
      timerStartedAt,
      timerUserId,
      recurrencePattern: input.recurrencePattern
    },
    include: taskInclude
  })) as TaskWithUsers;

  const activityMessages = collectTaskActivityMessages(existingTask, input, nextAssignmentType, nextAssigneeId, nextAssigneeRole);
  await Promise.all(activityMessages.map((message) => createTaskActivity(taskId, user.id, "UPDATED", message)));

  if (existingTask.status !== "DONE" && task.status === "DONE") {
    await maybeCreateRecurringTask({
      ...existingTask,
      status: task.status,
      issueType: task.issueType,
      priority: task.priority,
      assignmentType: task.assignmentType,
      assigneeId: task.assignee?.id ?? nextAssigneeId,
      assigneeRole: task.assigneeRole,
      dueDate: new Date(task.dueDate),
      sprintId: null,
      storyPoints: task.storyPoints,
      labels: task.labels,
      sortOrder: task.sortOrder,
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

export async function listTaskComments(user: AuthenticatedUser, projectId: string, taskId: string) {
  await requireProjectAccess(user, projectId);
  const task = (await database.task.findFirst({ where: { id: taskId, projectId } })) as DbTask | null;
  if (!task) throw new ApiError(404, "NOT_FOUND", "Task not found");
  const comments = (await database.taskComment.findMany({ where: { taskId }, include: taskCommentInclude, orderBy: { createdAt: "asc" } })) as TaskCommentRecord[];
  return comments.map(serializeTaskComment);
}

export async function addTaskComment(user: AuthenticatedUser, projectId: string, taskId: string, input: TaskCommentCreateInput) {
  await requireProjectAccess(user, projectId);
  const task = (await database.task.findFirst({ where: { id: taskId, projectId } })) as DbTask | null;
  if (!task) throw new ApiError(404, "NOT_FOUND", "Task not found");
  const comment = (await database.taskComment.create({
    data: { taskId, authorId: user.id, body: input.body },
    include: taskCommentInclude
  })) as TaskCommentRecord;
  await createTaskActivity(taskId, user.id, "COMMENTED", "Added a comment");
  return serializeTaskComment(comment);
}

export async function listTaskActivity(user: AuthenticatedUser, projectId: string, taskId: string) {
  await requireProjectAccess(user, projectId);
  const task = (await database.task.findFirst({ where: { id: taskId, projectId } })) as DbTask | null;
  if (!task) throw new ApiError(404, "NOT_FOUND", "Task not found");
  const activity = (await database.taskActivity.findMany({ where: { taskId }, include: taskActivityInclude, orderBy: { createdAt: "desc" } })) as TaskActivityRecord[];
  return activity.map(serializeTaskActivity);
}

export async function deleteTask(user: AuthenticatedUser, projectId: string, taskId: string) {
  await requireProjectAdmin(user, projectId);
  await database.task.delete({ where: { id: taskId } });
}
