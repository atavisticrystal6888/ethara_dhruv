import { randomUUID } from "node:crypto";
import type { ProjectRole, RecurrencePattern, Role, TaskAssignmentType, TaskStatus } from "../types/domain.js";
import type { DatabaseClient, DbMembership, DbProject, DbTask, DbUser } from "../types/database.js";

type Args = Record<string, unknown>;
type Select = Record<string, boolean>;

type Store = {
  users: DbUser[];
  projects: DbProject[];
  memberships: DbMembership[];
  tasks: DbTask[];
};

function selectRecord<T extends object>(record: T, select?: Select) {
  if (!select) return record;
  const selected: Record<string, unknown> = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) selected[key] = (record as Record<string, unknown>)[key];
  }
  return selected;
}

function sortByCreatedAt<T extends { createdAt: Date }>(records: T[], direction: "asc" | "desc") {
  return [...records].sort((left, right) => {
    const delta = left.createdAt.getTime() - right.createdAt.getTime();
    return direction === "asc" ? delta : -delta;
  });
}

function databaseConflict() {
  return Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
}

export function createMemoryDatabase(): DatabaseClient {
  const store: Store = { users: [], projects: [], memberships: [], tasks: [] };

  const publicUser = (userId: string, select?: Select) => {
    const user = store.users.find((candidate) => candidate.id === userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    return selectRecord(user, select);
  };

  const membershipWithInclude = (membership: DbMembership, include?: Args) => {
    const userInclude = include?.user as { select?: Select } | undefined;
    return userInclude ? { ...membership, user: publicUser(membership.userId, userInclude.select) } : membership;
  };

  const taskWithInclude = (task: DbTask, include?: Args) => {
    if (!include) return task;
    const assigneeInclude = include.assignee as { select?: Select } | undefined;
    const createdByInclude = include.createdBy as { select?: Select } | undefined;
    return {
      ...task,
      ...(assigneeInclude ? { assignee: task.assigneeId ? publicUser(task.assigneeId, assigneeInclude.select) : null } : {}),
      ...(createdByInclude ? { createdBy: publicUser(task.createdById, createdByInclude.select) } : {})
    };
  };

  const projectWithInclude = (project: DbProject, include?: Args) => {
    if (!include) return project;
    const result: Record<string, unknown> = { ...project };

    if (include.memberships) {
      const membershipInclude = include.memberships as { include?: Args };
      result.memberships = sortByCreatedAt(
        store.memberships.filter((membership) => membership.projectId === project.id),
        "asc"
      ).map((membership) => membershipWithInclude(membership, membershipInclude.include));
    }

    if (include.tasks) {
      const taskRecords = sortByCreatedAt(
        store.tasks.filter((task) => task.projectId === project.id),
        "desc"
      );
      result.tasks = include.tasks === true ? taskRecords : taskRecords.map((task) => taskWithInclude(task, (include.tasks as { include?: Args }).include));
    }

    if (include._count) {
      result._count = {
        memberships: store.memberships.filter((membership) => membership.projectId === project.id).length,
        tasks: store.tasks.filter((task) => task.projectId === project.id).length
      };
    }

    return result;
  };

  const matchesProjectWhere = (project: DbProject, where?: Args) => {
    if (!where) return true;
    const memberships = where.memberships as { some?: { userId?: string } } | undefined;
    if (memberships?.some?.userId) {
      return store.memberships.some((membership) => membership.projectId === project.id && membership.userId === memberships.some?.userId);
    }
    return true;
  };

  const matchesTaskWhere = (task: DbTask, where?: Args) => {
    if (!where) return true;
    if (where.id && task.id !== where.id) return false;
    if (where.projectId && task.projectId !== where.projectId) return false;
    if (where.assigneeId && task.assigneeId !== where.assigneeId) return false;
    if (where.recurrenceParentTaskId && task.recurrenceParentTaskId !== where.recurrenceParentTaskId) return false;
    const status = where.status as TaskStatus | { in?: TaskStatus[] } | undefined;
    if (typeof status === "string" && task.status !== status) return false;
    if (typeof status === "object" && status.in && !status.in.includes(task.status)) return false;
    return true;
  };

  return {
    user: {
      async count() {
        return store.users.length;
      },
      async create(args) {
        const data = args.data as { name: string; email: string; passwordHash: string; role: Role };
        if (store.users.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) throw databaseConflict();
        const createdAt = new Date();
        const user: DbUser = { id: randomUUID(), name: data.name, email: data.email.toLowerCase(), passwordHash: data.passwordHash, role: data.role, createdAt, updatedAt: createdAt };
        store.users.push(user);
        return selectRecord(user, args.select as Select | undefined);
      },
      async delete() {
        throw new Error("user.delete is not implemented in memory mode");
      },
      async deleteMany() {
        store.users = [];
        return { count: 0 };
      },
      async findFirst(args) {
        return this.findUnique(args);
      },
      async findMany(args = {}) {
        const where = args.where as { OR?: Array<Record<string, { contains?: string }>> } | undefined;
        const query = where?.OR?.[0]?.name?.contains?.toLowerCase() ?? where?.OR?.[1]?.email?.contains?.toLowerCase();
        const users = query
          ? store.users.filter((user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
          : store.users;
        return users
          .sort((left, right) => left.name.localeCompare(right.name))
          .slice(0, (args.take as number | undefined) ?? users.length)
          .map((user) => selectRecord(user, args.select as Select | undefined));
      },
      async findUnique(args) {
        const where = args.where as { id?: string; email?: string };
        const user = where.id
          ? store.users.find((candidate) => candidate.id === where.id)
          : store.users.find((candidate) => candidate.email.toLowerCase() === where.email?.toLowerCase());
        return user ? selectRecord(user, args.select as Select | undefined) : null;
      },
      async findUniqueOrThrow(args) {
        const user = await this.findUnique(args);
        if (!user) throw new Error("User not found");
        return user;
      },
      async update() {
        throw new Error("user.update is not implemented in memory mode");
      }
    },
    project: {
      async count() {
        return store.projects.length;
      },
      async create(args) {
        const data = args.data as { name: string; description?: string | null; createdById: string; memberships?: { create?: { userId: string; role?: ProjectRole } } };
        const createdAt = new Date();
        const project: DbProject = { id: randomUUID(), name: data.name, description: data.description ?? null, createdById: data.createdById, createdAt, updatedAt: createdAt };
        store.projects.push(project);
        if (data.memberships?.create) {
          store.memberships.push({ id: randomUUID(), projectId: project.id, userId: data.memberships.create.userId, role: data.memberships.create.role ?? "MEMBER", createdAt });
        }
        return projectWithInclude(project, args.include as Args | undefined);
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        store.tasks = store.tasks.filter((task) => task.projectId !== id);
        store.memberships = store.memberships.filter((membership) => membership.projectId !== id);
        store.projects = store.projects.filter((project) => project.id !== id);
        return {};
      },
      async deleteMany() {
        store.projects = [];
        return { count: 0 };
      },
      async findFirst(args) {
        return this.findUnique(args);
      },
      async findMany(args = {}) {
        const projects = sortByCreatedAt(store.projects.filter((project) => matchesProjectWhere(project, args.where as Args | undefined)), "desc");
        return projects.map((project) => projectWithInclude(project, args.include as Args | undefined));
      },
      async findUnique(args) {
        const id = (args.where as { id: string }).id;
        const project = store.projects.find((candidate) => candidate.id === id);
        if (!project) return null;
        return args.select ? selectRecord(project, args.select as Select) : projectWithInclude(project, args.include as Args | undefined);
      },
      async findUniqueOrThrow(args) {
        const project = await this.findUnique(args);
        if (!project) throw new Error("Project not found");
        return project;
      },
      async update(args) {
        const id = (args.where as { id: string }).id;
        const project = store.projects.find((candidate) => candidate.id === id);
        if (!project) throw new Error("Project not found");
        const data = args.data as { name?: string; description?: string | null };
        if (data.name !== undefined) project.name = data.name;
        if (data.description !== undefined) project.description = data.description;
        project.updatedAt = new Date();
        return projectWithInclude(project, args.include as Args | undefined);
      }
    },
    membership: {
      async count() {
        return store.memberships.length;
      },
      async create(args) {
        const data = args.data as { projectId: string; userId: string; role?: ProjectRole };
        if (store.memberships.some((membership) => membership.projectId === data.projectId && membership.userId === data.userId)) throw databaseConflict();
        const membership: DbMembership = { id: randomUUID(), projectId: data.projectId, userId: data.userId, role: data.role ?? "MEMBER", createdAt: new Date() };
        store.memberships.push(membership);
        return membershipWithInclude(membership, args.include as Args | undefined);
      },
      async delete(args) {
        const where = (args.where as { projectId_userId: { projectId: string; userId: string } }).projectId_userId;
        store.memberships = store.memberships.filter((membership) => membership.projectId !== where.projectId || membership.userId !== where.userId);
        return {};
      },
      async deleteMany() {
        store.memberships = [];
        return { count: 0 };
      },
      async findFirst(args) {
        return this.findUnique(args);
      },
      async findMany(args = {}) {
        const projectId = (args.where as { projectId?: string } | undefined)?.projectId;
        return sortByCreatedAt(store.memberships.filter((membership) => !projectId || membership.projectId === projectId), "asc").map((membership) => membershipWithInclude(membership, args.include as Args | undefined));
      },
      async findUnique(args) {
        const where = (args.where as { projectId_userId: { projectId: string; userId: string } }).projectId_userId;
        const membership = store.memberships.find((candidate) => candidate.projectId === where.projectId && candidate.userId === where.userId);
        if (!membership) return null;
        return args.select ? selectRecord(membership, args.select as Select) : membershipWithInclude(membership, args.include as Args | undefined);
      },
      async findUniqueOrThrow(args) {
        const membership = await this.findUnique(args);
        if (!membership) throw new Error("Membership not found");
        return membership;
      },
      async update(args) {
        const where = (args.where as { projectId_userId: { projectId: string; userId: string } }).projectId_userId;
        const membership = store.memberships.find((candidate) => candidate.projectId === where.projectId && candidate.userId === where.userId);
        if (!membership) throw new Error("Membership not found");
        const data = args.data as { role?: ProjectRole };
        if (data.role !== undefined) membership.role = data.role;
        return membershipWithInclude(membership, args.include as Args | undefined);
      }
    },
    task: {
      async count(args = {}) {
        return store.tasks.filter((task) => matchesTaskWhere(task, args.where as Args | undefined)).length;
      },
      async create(args) {
        const data = args.data as {
          projectId: string;
          title: string;
          description?: string | null;
          status: TaskStatus;
          assignmentType: TaskAssignmentType;
          assigneeId?: string | null;
          assigneeRole?: ProjectRole | null;
          createdById: string;
          dueDate: Date;
          estimatedMinutes?: number;
          trackedMinutes?: number;
          timerStartedAt?: Date | null;
          timerUserId?: string | null;
          recurrencePattern?: RecurrencePattern;
          recurrenceParentTaskId?: string | null;
        };
        const createdAt = new Date();
        const task: DbTask = {
          id: randomUUID(),
          projectId: data.projectId,
          title: data.title,
          description: data.description ?? null,
          status: data.status,
          assignmentType: data.assignmentType,
          assigneeId: data.assigneeId ?? null,
          assigneeRole: data.assigneeRole ?? null,
          createdById: data.createdById,
          dueDate: data.dueDate,
          estimatedMinutes: data.estimatedMinutes ?? 0,
          trackedMinutes: data.trackedMinutes ?? 0,
          timerStartedAt: data.timerStartedAt ?? null,
          timerUserId: data.timerUserId ?? null,
          recurrencePattern: data.recurrencePattern ?? "NONE",
          recurrenceParentTaskId: data.recurrenceParentTaskId ?? null,
          createdAt,
          updatedAt: createdAt
        };
        store.tasks.push(task);
        return taskWithInclude(task, args.include as Args | undefined);
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        store.tasks = store.tasks.filter((task) => task.id !== id);
        return {};
      },
      async deleteMany() {
        store.tasks = [];
        return { count: 0 };
      },
      async findFirst(args) {
        const task = store.tasks.find((candidate) => matchesTaskWhere(candidate, args.where as Args | undefined));
        return task ? taskWithInclude(task, args.include as Args | undefined) : null;
      },
      async findMany(args = {}) {
        return sortByCreatedAt(store.tasks.filter((task) => matchesTaskWhere(task, args.where as Args | undefined)), "desc").map((task) => taskWithInclude(task, args.include as Args | undefined));
      },
      async findUnique(args) {
        const id = (args.where as { id: string }).id;
        const task = store.tasks.find((candidate) => candidate.id === id);
        return task ? taskWithInclude(task, args.include as Args | undefined) : null;
      },
      async findUniqueOrThrow(args) {
        const task = await this.findUnique(args);
        if (!task) throw new Error("Task not found");
        return task;
      },
      async update(args) {
        const id = (args.where as { id: string }).id;
        const task = store.tasks.find((candidate) => candidate.id === id);
        if (!task) throw new Error("Task not found");
        const data = args.data as {
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          assignmentType?: TaskAssignmentType;
          assigneeId?: string | null;
          assigneeRole?: ProjectRole | null;
          dueDate?: Date;
          estimatedMinutes?: number;
          trackedMinutes?: number;
          timerStartedAt?: Date | null;
          timerUserId?: string | null;
          recurrencePattern?: RecurrencePattern;
        };
        if (data.title !== undefined) task.title = data.title;
        if (data.description !== undefined) task.description = data.description;
        if (data.status !== undefined) task.status = data.status;
        if (data.assignmentType !== undefined) task.assignmentType = data.assignmentType;
        if (data.assigneeId !== undefined) task.assigneeId = data.assigneeId;
        if (data.assigneeRole !== undefined) task.assigneeRole = data.assigneeRole;
        if (data.dueDate !== undefined) task.dueDate = data.dueDate;
        if (data.estimatedMinutes !== undefined) task.estimatedMinutes = data.estimatedMinutes;
        if (data.trackedMinutes !== undefined) task.trackedMinutes = data.trackedMinutes;
        if (data.timerStartedAt !== undefined) task.timerStartedAt = data.timerStartedAt;
        if (data.timerUserId !== undefined) task.timerUserId = data.timerUserId;
        if (data.recurrencePattern !== undefined) task.recurrencePattern = data.recurrencePattern;
        task.updatedAt = new Date();
        return taskWithInclude(task, args.include as Args | undefined);
      }
    },
    async $disconnect() {},
    async $queryRaw<T = unknown>() {
      return [] as T;
    }
  };
}