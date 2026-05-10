import type { Role, TaskStatus } from "../types/domain.js";
import type { DbMembership, DbProject, DbTask, DbUser } from "../types/prisma.js";

export type PublicUser = Pick<DbUser, "id" | "name" | "email" | "role" | "createdAt">;
export type TaskWithUsers = DbTask & { assignee: PublicUser; createdBy: PublicUser };
export type MembershipWithUser = DbMembership & { user: PublicUser };
export type ProjectSummaryRecord = DbProject & { _count?: { memberships: number; tasks: number } };
export type ProjectDetailRecord = ProjectSummaryRecord & {
  memberships: MembershipWithUser[];
  tasks: TaskWithUsers[];
};

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
    assignee: serializeUser(task.assignee),
    createdBy: serializeUser(task.createdBy),
    dueDate: task.dueDate.toISOString().slice(0, 10),
    isOverdue: isTaskOverdue(task, now),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}

export function serializeMembership(membership: MembershipWithUser) {
  return {
    id: membership.id,
    projectId: membership.projectId,
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
    tasks: project.tasks.map((task) => serializeTask(task))
  };
}
