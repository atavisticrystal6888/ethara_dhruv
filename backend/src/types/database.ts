import type { ProjectRole, RecurrencePattern, Role, TaskAssignmentType, TaskStatus } from "./domain.js";

type QueryArgs = Record<string, unknown>;

type ModelDelegate = {
  count(args?: QueryArgs): Promise<number>;
  create(args: QueryArgs): Promise<unknown>;
  delete(args: QueryArgs): Promise<unknown>;
  deleteMany(args?: QueryArgs): Promise<unknown>;
  findFirst(args: QueryArgs): Promise<unknown | null>;
  findMany(args?: QueryArgs): Promise<unknown[]>;
  findUnique(args: QueryArgs): Promise<unknown | null>;
  findUniqueOrThrow(args: QueryArgs): Promise<unknown>;
  update(args: QueryArgs): Promise<unknown>;
};

export type DatabaseClient = {
  user: ModelDelegate;
  project: ModelDelegate;
  membership: ModelDelegate;
  task: ModelDelegate;
  $disconnect(): Promise<void>;
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
};

export type DbUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type DbProject = {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DbMembership = {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: Date;
};

export type DbTask = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignmentType: TaskAssignmentType;
  assigneeId: string | null;
  assigneeRole: ProjectRole | null;
  createdById: string;
  dueDate: Date;
  estimatedMinutes: number;
  trackedMinutes: number;
  timerStartedAt: Date | null;
  timerUserId: string | null;
  recurrencePattern: RecurrencePattern;
  recurrenceParentTaskId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function hasDatabaseErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}