import type { ProjectRole, RecurrencePattern, Role, SprintStatus, TaskActivityType, TaskAssignmentType, TaskIssueType, TaskPriority, TaskStatus } from "../types/domain.js";
import type { DbMembership, DbProject, DbSprint, DbTask, DbTaskActivity, DbTaskComment, DbUser } from "../types/database.js";

export type PublicUser = Pick<DbUser, "id" | "name" | "email" | "role" | "createdAt">;
export type TaskWithUsers = DbTask & { assignee: PublicUser | null; createdBy: PublicUser };
export type MembershipWithUser = DbMembership & { user: PublicUser };
export type SprintRecord = DbSprint;
export type TaskCommentRecord = DbTaskComment & { author: PublicUser };
export type TaskActivityRecord = DbTaskActivity & { actor: PublicUser };
export type ProjectSummaryRecord = DbProject & { _count?: { memberships: number; tasks: number } };
export type ProjectDetailRecord = ProjectSummaryRecord & {
  memberships: MembershipWithUser[];
  sprints: SprintRecord[];
  tasks: TaskWithUsers[];
};
export type TaskDetailRecord = TaskWithUsers & { comments: TaskCommentRecord[]; activity: TaskActivityRecord[] };

export function serializeUser(user: PublicUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    createdAt: user.createdAt.toISOString()
  };
}

export function isTaskOverdue(task: Pick<DbTask, "dueDate" | "status">, now = new Date()) {
  const dueDateOnly = new Date(task.dueDate.toISOString().slice(0, 10));
  const todayOnly = new Date(now.toISOString().slice(0, 10));
  return dueDateOnly < todayOnly && task.status !== "DONE";
}

export function serializeTask(task: TaskWithUsers, now = new Date()) {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    issueType: task.issueType as TaskIssueType,
    priority: task.priority as TaskPriority,
    assignmentType: task.assignmentType as TaskAssignmentType,
    assignee: task.assignee ? serializeUser(task.assignee) : null,
    assigneeRole: task.assigneeRole as ProjectRole | null,
    createdBy: serializeUser(task.createdBy),
    dueDate: task.dueDate.toISOString().slice(0, 10),
    sprintId: task.sprintId,
    storyPoints: task.storyPoints,
    labels: task.labels,
    sortOrder: task.sortOrder,
    estimatedMinutes: task.estimatedMinutes,
    trackedMinutes: task.trackedMinutes,
    timerStartedAt: task.timerStartedAt?.toISOString() ?? null,
    timerUserId: task.timerUserId,
    recurrencePattern: task.recurrencePattern as RecurrencePattern,
    recurrenceParentTaskId: task.recurrenceParentTaskId,
    isOverdue: isTaskOverdue(task, now),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    assignmentLabel:
      task.assignmentType === "ROLE"
        ? `${task.assigneeRole ?? "MEMBER"} group`
        : task.assignee
          ? task.assignee.name
          : "Unassigned"
  };
}

export function serializeSprint(sprint: SprintRecord) {
  return {
    id: sprint.id,
    projectId: sprint.projectId,
    name: sprint.name,
    goal: sprint.goal,
    status: sprint.status as SprintStatus,
    startDate: sprint.startDate ? sprint.startDate.toISOString().slice(0, 10) : null,
    endDate: sprint.endDate ? sprint.endDate.toISOString().slice(0, 10) : null,
    createdAt: sprint.createdAt.toISOString(),
    updatedAt: sprint.updatedAt.toISOString()
  };
}

export function serializeTaskComment(comment: TaskCommentRecord) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    author: serializeUser(comment.author),
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString()
  };
}

export function serializeTaskActivity(activity: TaskActivityRecord) {
  return {
    id: activity.id,
    taskId: activity.taskId,
    actor: serializeUser(activity.actor),
    type: activity.type as TaskActivityType,
    message: activity.message,
    createdAt: activity.createdAt.toISOString()
  };
}

export function serializeTaskDetail(task: TaskWithUsers, comments: TaskCommentRecord[], activity: TaskActivityRecord[]) {
  return {
    ...serializeTask(task),
    comments: comments.map(serializeTaskComment),
    activity: activity.map(serializeTaskActivity)
  };
}

export function serializeMembership(membership: MembershipWithUser) {
  return {
    id: membership.id,
    projectId: membership.projectId,
    role: membership.role as ProjectRole,
    user: serializeUser(membership.user),
    createdAt: membership.createdAt.toISOString()
  };
}

export function serializeProjectSummary(project: ProjectSummaryRecord) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdById: project.createdById,
    memberCount: project._count?.memberships ?? 0,
    taskCount: project._count?.tasks ?? 0,
    createdAt: project.createdAt.toISOString()
  };
}

export function serializeProject(project: ProjectDetailRecord) {
  return {
    ...serializeProjectSummary(project),
    members: project.memberships.map(serializeMembership),
    sprints: [...project.sprints]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map(serializeSprint),
    tasks: project.tasks
      .map((task) => serializeTask(task))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt))
  };
}
