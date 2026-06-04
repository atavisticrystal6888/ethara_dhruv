import { createPostgresDatabase } from "./postgresDatabase.js";
import type { DatabaseClient } from "../types/database.js";

const globalForDatabase = globalThis as unknown as {
  database?: DatabaseClient;
  databaseClientPromise?: Promise<DatabaseClient>;
};

async function createDatabase() {
  const database: DatabaseClient = await createPostgresDatabase();
  await database.$queryRaw`SELECT 1`;
  return database;
}

async function getDatabase() {
  globalForDatabase.databaseClientPromise ??= createDatabase();
  return globalForDatabase.databaseClientPromise;
}

function createModelDelegate(model: keyof Pick<DatabaseClient, "user" | "project" | "membership" | "sprint" | "taskComment" | "taskActivity" | "task">) {
  return {
    count: async (args?: Record<string, unknown>) => (await getDatabase())[model].count(args),
    create: async (args: Record<string, unknown>) => (await getDatabase())[model].create(args),
    delete: async (args: Record<string, unknown>) => (await getDatabase())[model].delete(args),
    deleteMany: async (args?: Record<string, unknown>) => (await getDatabase())[model].deleteMany(args),
    findFirst: async (args: Record<string, unknown>) => (await getDatabase())[model].findFirst(args),
    findMany: async (args?: Record<string, unknown>) => (await getDatabase())[model].findMany(args),
    findUnique: async (args: Record<string, unknown>) => (await getDatabase())[model].findUnique(args),
    findUniqueOrThrow: async (args: Record<string, unknown>) => (await getDatabase())[model].findUniqueOrThrow(args),
    update: async (args: Record<string, unknown>) => (await getDatabase())[model].update(args)
  };
}

export const database =
  globalForDatabase.database ??
  ({
    user: createModelDelegate("user"),
    project: createModelDelegate("project"),
    membership: createModelDelegate("membership"),
    sprint: createModelDelegate("sprint"),
    taskComment: createModelDelegate("taskComment"),
    taskActivity: createModelDelegate("taskActivity"),
    task: createModelDelegate("task"),
    $disconnect: async () => {
      const database = await getDatabase();
      await database.$disconnect();
    },
    $queryRaw: async <T = unknown>(query: TemplateStringsArray, ...values: unknown[]) => {
      const database = await getDatabase();
      return database.$queryRaw<T>(query, ...values);
    }
  } satisfies DatabaseClient);

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.database = database;
}
