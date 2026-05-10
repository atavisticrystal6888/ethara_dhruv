import { createRequire } from "node:module";
import type { PrismaDatabase } from "../types/prisma.js";
import { createPostgresPrisma } from "./postgresPrisma.js";
import { createMemoryPrisma } from "./memoryPrisma.js";

const require = createRequire(import.meta.url);
type PrismaClientLike = PrismaDatabase & { $connect?: () => Promise<void> };

let prismaModule: { PrismaClient?: new (options?: unknown) => PrismaClientLike };

try {
  prismaModule = require("@prisma/client") as { PrismaClient?: new (options?: unknown) => PrismaClientLike };
} catch {
  prismaModule = {};
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaDatabase;
  prismaDatabasePromise?: Promise<PrismaDatabase>;
};

async function createDatabase() {
  if (prismaModule.PrismaClient) {
    const client = new prismaModule.PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });

    try {
      await client.$queryRaw`SELECT 1`;
      return client;
    } catch (error) {
      try {
        await client.$disconnect();
      } catch {}

      if (process.env.NODE_ENV === "production") {
        throw error;
      }

      console.warn("Prisma client is generated but unusable; falling back to the development PostgreSQL adapter.", error);
    }
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("Prisma client is not generated. Run npm run prisma:generate --workspace backend.");
  }

  try {
    const postgresPrisma = createPostgresPrisma();
    await postgresPrisma.$queryRaw`SELECT 1`;
    return postgresPrisma;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    console.warn("PostgreSQL adapter unavailable; using in-memory development database.", error);
    return createMemoryPrisma();
  }
}

async function getDatabase() {
  globalForPrisma.prismaDatabasePromise ??= createDatabase();
  return globalForPrisma.prismaDatabasePromise;
}

function createModelDelegate(model: keyof Pick<PrismaDatabase, "user" | "project" | "membership" | "task">) {
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

export const prisma =
  globalForPrisma.prisma ??
  ({
    user: createModelDelegate("user"),
    project: createModelDelegate("project"),
    membership: createModelDelegate("membership"),
    task: createModelDelegate("task"),
    $disconnect: async () => {
      const database = await getDatabase();
      await database.$disconnect();
    },
    $queryRaw: async <T = unknown>(query: TemplateStringsArray, ...values: unknown[]) => {
      const database = await getDatabase();
      return database.$queryRaw<T>(query, ...values);
    }
  } satisfies PrismaDatabase);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
