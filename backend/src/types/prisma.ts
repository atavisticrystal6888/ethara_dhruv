import type { Role, TaskStatus } from "./domain.js";

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

export type PrismaDatabase = {
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
  createdAt: Date;
};

export type DbTask = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string;
  createdById: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function hasPrismaErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}