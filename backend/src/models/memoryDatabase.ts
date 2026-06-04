import { randomUUID } from "node:crypto";
import type { ProjectRole, RecurrencePattern, Role, SprintStatus, TaskActivityType, TaskAssignmentType, TaskIssueType, TaskPriority, TaskStatus } from "../types/domain.js";
import type { DatabaseClient, DbMembership, DbProject, DbSprint, DbTask, DbTaskActivity, DbTaskComment, DbUser } from "../types/database.js";

type Args = Record<string, unknown>;
type Select = Record<string, boolean>;

type Store = {
  users: DbUser[];
  projects: DbProject[];
  memberships: DbMembership[];
  sprints: DbSprint[];
  taskComments: DbTaskComment[];
  taskActivities: DbTaskActivity[];
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
  const store: Store = { users: [], projects: [], memberships: [], sprints: [], taskComments: [], taskActivities: [], tasks: [] };

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

  const taskCommentWithInclude = (comment: DbTaskComment, include?: Args) => {
    if (!include) return comment;
    const authorInclude = include.author as { select?: Select } | undefined;
    return {
      ...comment,
      ...(authorInclude ? { author: publicUser(comment.authorId, authorInclude.select) } : {})
    };
  };

  const taskActivityWithInclude = (activity: DbTaskActivity, include?: Args) => {
    if (!include) return activity;
    const actorInclude = include.actor as { select?: Select } | undefined;
    return {
      ...activity,
      ...(actorInclude ? { actor: publicUser(activity.actorId, actorInclude.select) } : {})
    };
  };

  const sprintWithInclude = (sprint: DbSprint) => sprint;

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

    if (include.sprints) {
      const sprintDirection = ((include.sprints as { orderBy?: { createdAt?: "asc" | "desc" } }).orderBy?.createdAt ?? "desc");
      result.sprints = sortByCreatedAt(
        store.sprints.filter((sprint) => sprint.projectId === project.id),
        sprintDirection
      ).map((sprint) => sprintWithInclude(sprint));
    }

    if (include.tasks) {
      const taskConfig = include.tasks === true ? {} : (include.tasks as { include?: Args; orderBy?: { createdAt?: "asc" | "desc"; sortOrder?: "asc" | "desc" } });
      const taskDirection = taskConfig.orderBy?.sortOrder ?? taskConfig.orderBy?.createdAt ?? "desc";
      const taskRecords = [...store.tasks.filter((task) => task.projectId === project.id)].sort((left, right) => {
        const delta = taskConfig.orderBy?.sortOrder
          ? left.sortOrder - right.sortOrder
          : left.createdAt.getTime() - right.createdAt.getTime();
        return taskDirection === "asc" ? delta : -delta;
      });
      result.tasks = include.tasks === true ? taskRecords : taskRecords.map((task) => taskWithInclude(task, taskConfig.include));
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
    if (where.sprintId === null && task.sprintId !== null) return false;
    if (typeof where.sprintId === "string" && task.sprintId !== where.sprintId) return false;
    if (where.recurrenceParentTaskId && task.recurrenceParentTaskId !== where.recurrenceParentTaskId) return false;
    const status = where.status as TaskStatus | { in?: TaskStatus[] } | undefined;
    if (typeof status === "string" && task.status !== status) return false;
    if (typeof status === "object" && status.in && !status.in.includes(task.status)) return false;
    return true;
  };

  const matchesTaskCommentWhere = (comment: DbTaskComment, where?: Args) => {
    if (!where) return true;
    if (where.id && comment.id !== where.id) return false;
    if (where.taskId && comment.taskId !== where.taskId) return false;
    return true;
  };

  const matchesTaskActivityWhere = (activity: DbTaskActivity, where?: Args) => {
    if (!where) return true;
    if (where.id && activity.id !== where.id) return false;
    if (where.taskId && activity.taskId !== where.taskId) return false;
    if (where.type && activity.type !== where.type) return false;
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
        const projectTaskIds = new Set(store.tasks.filter((task) => task.projectId === id).map((task) => task.id));
        store.tasks = store.tasks.filter((task) => task.projectId !== id);
        store.taskComments = store.taskComments.filter((comment) => !projectTaskIds.has(comment.taskId));
        store.taskActivities = store.taskActivities.filter((activity) => !projectTaskIds.has(activity.taskId));
        store.sprints = store.sprints.filter((sprint) => sprint.projectId !== id);
        store.memberships = store.memberships.filter((membership) => membership.projectId !== id);
        store.projects = store.projects.filter((project) => project.id !== id);
        return {};
      },
      async deleteMany() {
        store.projects = [];
        store.sprints = [];
        store.taskComments = [];
        store.taskActivities = [];
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
    sprint: {
      async count(args = {}) {
        const projectId = (args.where as { projectId?: string } | undefined)?.projectId;
        return store.sprints.filter((sprint) => !projectId || sprint.projectId === projectId).length;
      },
      async create(args) {
        const data = args.data as { projectId: string; name: string; goal?: string | null; status?: SprintStatus; startDate?: Date | null; endDate?: Date | null };
        const createdAt = new Date();
        const sprint: DbSprint = {
          id: randomUUID(),
          projectId: data.projectId,
          name: data.name,
          goal: data.goal ?? null,
          status: data.status ?? "PLANNED",
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
          createdAt,
          updatedAt: createdAt
        };
        store.sprints.push(sprint);
        return sprintWithInclude(sprint);
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        store.tasks = store.tasks.map((task) => task.sprintId === id ? { ...task, sprintId: null, updatedAt: new Date() } : task);
        store.sprints = store.sprints.filter((sprint) => sprint.id !== id);
        return {};
      },
      async deleteMany() {
        const count = store.sprints.length;
        store.sprints = [];
        store.tasks = store.tasks.map((task) => ({ ...task, sprintId: null, updatedAt: new Date() }));
        return { count };
      },
      async findFirst(args) {
        const where = args.where as { id?: string; projectId?: string; status?: SprintStatus } | undefined;
        const sprint = store.sprints.find((candidate) => (!where?.id || candidate.id === where.id) && (!where?.projectId || candidate.projectId === where.projectId) && (!where?.status || candidate.status === where.status));
        return sprint ? sprintWithInclude(sprint) : null;
      },
      async findMany(args = {}) {
        const where = args.where as { projectId?: string; status?: SprintStatus } | undefined;
        const direction = ((args.orderBy as { createdAt?: "asc" | "desc" } | undefined)?.createdAt ?? "desc");
        return sortByCreatedAt(store.sprints.filter((sprint) => (!where?.projectId || sprint.projectId === where.projectId) && (!where?.status || sprint.status === where.status)), direction).map((sprint) => sprintWithInclude(sprint));
      },
      async findUnique(args) {
        const id = (args.where as { id: string }).id;
        const sprint = store.sprints.find((candidate) => candidate.id === id);
        return sprint ? sprintWithInclude(sprint) : null;
      },
      async findUniqueOrThrow(args) {
        const sprint = await this.findUnique(args);
        if (!sprint) throw new Error("Sprint not found");
        return sprint;
      },
      async update(args) {
        const id = (args.where as { id: string }).id;
        const sprint = store.sprints.find((candidate) => candidate.id === id);
        if (!sprint) throw new Error("Sprint not found");
        const data = args.data as { name?: string; goal?: string | null; status?: SprintStatus; startDate?: Date | null; endDate?: Date | null };
        if (data.name !== undefined) sprint.name = data.name;
        if (data.goal !== undefined) sprint.goal = data.goal;
        if (data.status !== undefined) sprint.status = data.status;
        if (data.startDate !== undefined) sprint.startDate = data.startDate;
        if (data.endDate !== undefined) sprint.endDate = data.endDate;
        sprint.updatedAt = new Date();
        return sprintWithInclude(sprint);
      }
    },
    taskComment: {
      async count(args = {}) {
        return store.taskComments.filter((comment) => matchesTaskCommentWhere(comment, args.where as Args | undefined)).length;
      },
      async create(args) {
        const data = args.data as { taskId: string; authorId: string; body: string };
        const createdAt = new Date();
        const comment: DbTaskComment = {
          id: randomUUID(),
          taskId: data.taskId,
          authorId: data.authorId,
          body: data.body,
          createdAt,
          updatedAt: createdAt
        };
        store.taskComments.push(comment);
        return taskCommentWithInclude(comment, args.include as Args | undefined);
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        store.taskComments = store.taskComments.filter((comment) => comment.id !== id);
        return {};
      },
      async deleteMany(args = {}) {
        const before = store.taskComments.length;
        store.taskComments = store.taskComments.filter((comment) => !matchesTaskCommentWhere(comment, args.where as Args | undefined));
        return { count: before - store.taskComments.length };
      },
      async findFirst(args) {
        const comment = store.taskComments.find((candidate) => matchesTaskCommentWhere(candidate, args.where as Args | undefined));
        return comment ? taskCommentWithInclude(comment, args.include as Args | undefined) : null;
      },
      async findMany(args = {}) {
        const direction = ((args.orderBy as { createdAt?: "asc" | "desc" } | undefined)?.createdAt ?? "asc");
        return sortByCreatedAt(store.taskComments.filter((comment) => matchesTaskCommentWhere(comment, args.where as Args | undefined)), direction)
          .map((comment) => taskCommentWithInclude(comment, args.include as Args | undefined));
      },
      async findUnique(args) {
        const id = (args.where as { id: string }).id;
        const comment = store.taskComments.find((candidate) => candidate.id === id);
        return comment ? taskCommentWithInclude(comment, args.include as Args | undefined) : null;
      },
      async findUniqueOrThrow(args) {
        const comment = await this.findUnique(args);
        if (!comment) throw new Error("Task comment not found");
        return comment;
      },
      async update(args) {
        const id = (args.where as { id: string }).id;
        const comment = store.taskComments.find((candidate) => candidate.id === id);
        if (!comment) throw new Error("Task comment not found");
        const data = args.data as { body?: string };
        if (data.body !== undefined) comment.body = data.body;
        comment.updatedAt = new Date();
        return taskCommentWithInclude(comment, args.include as Args | undefined);
      }
    },
    taskActivity: {
      async count(args = {}) {
        return store.taskActivities.filter((activity) => matchesTaskActivityWhere(activity, args.where as Args | undefined)).length;
      },
      async create(args) {
        const data = args.data as { taskId: string; actorId: string; type: TaskActivityType; message: string };
        const activity: DbTaskActivity = {
          id: randomUUID(),
          taskId: data.taskId,
          actorId: data.actorId,
          type: data.type,
          message: data.message,
          createdAt: new Date()
        };
        store.taskActivities.push(activity);
        return taskActivityWithInclude(activity, args.include as Args | undefined);
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        store.taskActivities = store.taskActivities.filter((activity) => activity.id !== id);
        return {};
      },
      async deleteMany(args = {}) {
        const before = store.taskActivities.length;
        store.taskActivities = store.taskActivities.filter((activity) => !matchesTaskActivityWhere(activity, args.where as Args | undefined));
        return { count: before - store.taskActivities.length };
      },
      async findFirst(args) {
        const activity = store.taskActivities.find((candidate) => matchesTaskActivityWhere(candidate, args.where as Args | undefined));
        return activity ? taskActivityWithInclude(activity, args.include as Args | undefined) : null;
      },
      async findMany(args = {}) {
        const direction = ((args.orderBy as { createdAt?: "asc" | "desc" } | undefined)?.createdAt ?? "desc");
        return sortByCreatedAt(store.taskActivities.filter((activity) => matchesTaskActivityWhere(activity, args.where as Args | undefined)), direction)
          .map((activity) => taskActivityWithInclude(activity, args.include as Args | undefined));
      },
      async findUnique(args) {
        const id = (args.where as { id: string }).id;
        const activity = store.taskActivities.find((candidate) => candidate.id === id);
        return activity ? taskActivityWithInclude(activity, args.include as Args | undefined) : null;
      },
      async findUniqueOrThrow(args) {
        const activity = await this.findUnique(args);
        if (!activity) throw new Error("Task activity not found");
        return activity;
      },
      async update(args) {
        const id = (args.where as { id: string }).id;
        const activity = store.taskActivities.find((candidate) => candidate.id === id);
        if (!activity) throw new Error("Task activity not found");
        const data = args.data as { message?: string; type?: TaskActivityType };
        if (data.message !== undefined) activity.message = data.message;
        if (data.type !== undefined) activity.type = data.type;
        return taskActivityWithInclude(activity, args.include as Args | undefined);
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
          issueType?: TaskIssueType;
          priority?: TaskPriority;
          assignmentType: TaskAssignmentType;
          assigneeId?: string | null;
          assigneeRole?: ProjectRole | null;
          createdById: string;
          dueDate: Date;
          sprintId?: string | null;
          storyPoints?: number;
          labels?: string[];
          sortOrder?: number;
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
          issueType: data.issueType ?? "TASK",
          priority: data.priority ?? "MEDIUM",
          assignmentType: data.assignmentType,
          assigneeId: data.assigneeId ?? null,
          assigneeRole: data.assigneeRole ?? null,
          createdById: data.createdById,
          dueDate: data.dueDate,
          sprintId: data.sprintId ?? null,
          storyPoints: data.storyPoints ?? 0,
          labels: data.labels ?? [],
          sortOrder: data.sortOrder ?? Date.now(),
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
        store.taskComments = store.taskComments.filter((comment) => comment.taskId !== id);
        store.taskActivities = store.taskActivities.filter((activity) => activity.taskId !== id);
        return {};
      },
      async deleteMany() {
        const count = store.tasks.length;
        store.tasks = [];
        store.taskComments = [];
        store.taskActivities = [];
        return { count };
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
          issueType?: TaskIssueType;
          priority?: TaskPriority;
          assignmentType?: TaskAssignmentType;
          assigneeId?: string | null;
          assigneeRole?: ProjectRole | null;
          dueDate?: Date;
          sprintId?: string | null;
          storyPoints?: number;
          labels?: string[];
          sortOrder?: number;
          estimatedMinutes?: number;
          trackedMinutes?: number;
          timerStartedAt?: Date | null;
          timerUserId?: string | null;
          recurrencePattern?: RecurrencePattern;
        };
        if (data.title !== undefined) task.title = data.title;
        if (data.description !== undefined) task.description = data.description;
        if (data.status !== undefined) task.status = data.status;
        if (data.issueType !== undefined) task.issueType = data.issueType;
        if (data.priority !== undefined) task.priority = data.priority;
        if (data.assignmentType !== undefined) task.assignmentType = data.assignmentType;
        if (data.assigneeId !== undefined) task.assigneeId = data.assigneeId;
        if (data.assigneeRole !== undefined) task.assigneeRole = data.assigneeRole;
        if (data.dueDate !== undefined) task.dueDate = data.dueDate;
        if (data.sprintId !== undefined) task.sprintId = data.sprintId;
        if (data.storyPoints !== undefined) task.storyPoints = data.storyPoints;
        if (data.labels !== undefined) task.labels = data.labels;
        if (data.sortOrder !== undefined) task.sortOrder = data.sortOrder;
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