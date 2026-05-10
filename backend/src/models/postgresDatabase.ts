import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { env } from "../config/env.js";
import type { ProjectRole, RecurrencePattern, Role, TaskAssignmentType, TaskStatus } from "../types/domain.js";
import type { DatabaseClient, DbMembership, DbProject, DbTask, DbUser } from "../types/database.js";

type Args = Record<string, unknown>;
type Select = Record<string, boolean>;
type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

const globalForPostgres = globalThis as unknown as {
  postgresPool?: Pool;
  postgresSchemaPromise?: Promise<void>;
};

function createPool() {
  return new Pool({ connectionString: env.DATABASE_URL });
}

function getPool() {
  globalForPostgres.postgresPool ??= createPool();
  return globalForPostgres.postgresPool;
}

function selectRecord<T extends object>(record: T, select?: Select) {
  if (!select) {
    return record;
  }

  const selected: Record<string, unknown> = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) {
      selected[key] = (record as Record<string, unknown>)[key];
    }
  }
  return selected;
}

function databaseConflict() {
  return Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const isoValue = value.includes("T") ? value : value.replace(" ", "T");
    return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(isoValue) ? isoValue : `${isoValue}Z`);
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  throw new Error(`Unsupported date value: ${String(value)}`);
}

function mapUser(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.passwordHash),
    role: row.role as Role,
    createdAt: normalizeDate(row.createdAt),
    updatedAt: normalizeDate(row.updatedAt)
  };
}

function mapProject(row: Record<string, unknown>): DbProject {
  return {
    id: String(row.id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    createdById: String(row.createdById),
    createdAt: normalizeDate(row.createdAt),
    updatedAt: normalizeDate(row.updatedAt)
  };
}

function mapMembership(row: Record<string, unknown>): DbMembership {
  return {
    id: String(row.id),
    projectId: String(row.projectId),
    userId: String(row.userId),
    role: row.role as ProjectRole,
    createdAt: normalizeDate(row.createdAt)
  };
}

function mapTask(row: Record<string, unknown>): DbTask {
  return {
    id: String(row.id),
    projectId: String(row.projectId),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    status: row.status as TaskStatus,
    assignmentType: row.assignmentType as TaskAssignmentType,
    assigneeId: (row.assigneeId as string | null) ?? null,
    assigneeRole: (row.assigneeRole as ProjectRole | null) ?? null,
    createdById: String(row.createdById),
    dueDate: normalizeDate(row.dueDate),
    estimatedMinutes: Number(row.estimatedMinutes ?? 0),
    trackedMinutes: Number(row.trackedMinutes ?? 0),
    timerStartedAt: row.timerStartedAt ? normalizeDate(row.timerStartedAt) : null,
    timerUserId: (row.timerUserId as string | null) ?? null,
    recurrencePattern: row.recurrencePattern as RecurrencePattern,
    recurrenceParentTaskId: (row.recurrenceParentTaskId as string | null) ?? null,
    createdAt: normalizeDate(row.createdAt),
    updatedAt: normalizeDate(row.updatedAt)
  };
}

async function queryRows<T>(db: Queryable, text: string, values: unknown[] = []) {
  const result = (await db.query(text, values)) as unknown as { rows: T[] };
  return result.rows;
}

async function queryOne<T>(db: Queryable, text: string, values: unknown[] = []) {
  const rows = await queryRows<T>(db, text, values);
  return rows[0] ?? null;
}

async function execute(db: Queryable, text: string, values: unknown[] = []) {
  const result = (await db.query(text, values)) as { rowCount: number | null };
  return result.rowCount ?? 0;
}

function rethrowDbError(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    throw databaseConflict();
  }

  throw error;
}

async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    rethrowDbError(error);
  } finally {
    client.release();
  }
}

async function ensureSchema() {
  globalForPostgres.postgresSchemaPromise ??= (async () => {
    const statements = [
      `DO $$ BEGIN
         CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');
       EXCEPTION
         WHEN duplicate_object THEN NULL;
       END $$;`,
      `DO $$ BEGIN
         CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
       EXCEPTION
         WHEN duplicate_object THEN NULL;
       END $$;`,
      `DO $$ BEGIN
         CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER');
       EXCEPTION
         WHEN duplicate_object THEN NULL;
       END $$;`,
      `DO $$ BEGIN
         CREATE TYPE "TaskAssignmentType" AS ENUM ('USER', 'ROLE');
       EXCEPTION
         WHEN duplicate_object THEN NULL;
       END $$;`,
      `DO $$ BEGIN
         CREATE TYPE "RecurrencePattern" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');
       EXCEPTION
         WHEN duplicate_object THEN NULL;
       END $$;`,
      `CREATE TABLE IF NOT EXISTS "User" (
         "id" TEXT PRIMARY KEY,
         "name" TEXT NOT NULL,
         "email" TEXT NOT NULL UNIQUE,
         "passwordHash" TEXT NOT NULL,
         "role" "Role" NOT NULL DEFAULT 'MEMBER',
         "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
       );`,
      `CREATE TABLE IF NOT EXISTS "Project" (
         "id" TEXT PRIMARY KEY,
         "name" TEXT NOT NULL,
         "description" TEXT,
         "createdById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
         "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
       );`,
      `CREATE TABLE IF NOT EXISTS "Membership" (
         "id" TEXT PRIMARY KEY,
         "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
         "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
         "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER',
         "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         UNIQUE ("projectId", "userId")
       );`,
      `CREATE TABLE IF NOT EXISTS "Task" (
         "id" TEXT PRIMARY KEY,
         "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
         "title" TEXT NOT NULL,
         "description" TEXT,
         "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
         "assignmentType" "TaskAssignmentType" NOT NULL DEFAULT 'USER',
         "assigneeId" TEXT REFERENCES "User"("id") ON DELETE RESTRICT,
         "assigneeRole" "ProjectRole",
         "createdById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
         "dueDate" TIMESTAMPTZ NOT NULL,
         "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
         "trackedMinutes" INTEGER NOT NULL DEFAULT 0,
         "timerStartedAt" TIMESTAMPTZ,
         "timerUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
         "recurrencePattern" "RecurrencePattern" NOT NULL DEFAULT 'NONE',
         "recurrenceParentTaskId" TEXT REFERENCES "Task"("id") ON DELETE SET NULL,
         "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
       );`,
      `ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER';`,
      `UPDATE "Membership"
       SET "role" = 'OWNER'::"ProjectRole"
       FROM "Project"
       WHERE "Membership"."projectId" = "Project"."id"
         AND "Membership"."userId" = "Project"."createdById";`,
      `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assignmentType" "TaskAssignmentType" NOT NULL DEFAULT 'USER';`,
      `ALTER TABLE "Task" ALTER COLUMN "assigneeId" DROP NOT NULL;`,
      `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assigneeRole" "ProjectRole";`,
      `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "trackedMinutes" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "timerStartedAt" TIMESTAMPTZ;`,
      `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "timerUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurrencePattern" "RecurrencePattern" NOT NULL DEFAULT 'NONE';`,
      `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurrenceParentTaskId" TEXT REFERENCES "Task"("id") ON DELETE SET NULL;`,
      `CREATE INDEX IF NOT EXISTS "Project_createdById_idx" ON "Project" ("createdById");`,
      `CREATE INDEX IF NOT EXISTS "Membership_userId_idx" ON "Membership" ("userId");`,
      `CREATE INDEX IF NOT EXISTS "Membership_role_idx" ON "Membership" ("role");`,
      `CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task" ("projectId");`,
      `CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "Task" ("assigneeId");`,
      `CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task" ("status");`,
      `CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task" ("dueDate");`,
      `CREATE INDEX IF NOT EXISTS "Task_assignmentType_idx" ON "Task" ("assignmentType");`,
      `CREATE INDEX IF NOT EXISTS "Task_recurrencePattern_idx" ON "Task" ("recurrencePattern");`,
      `CREATE INDEX IF NOT EXISTS "Task_timerUserId_idx" ON "Task" ("timerUserId");`
    ];

    for (const statement of statements) {
      await getPool().query(statement);
    }
  })();

  await globalForPostgres.postgresSchemaPromise;
}

async function getUserById(db: Queryable, userId: string) {
  const row = await queryOne<Record<string, unknown>>(
    db,
    'SELECT "id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt" FROM "User" WHERE "id" = $1',
    [userId]
  );
  return row ? mapUser(row) : null;
}

async function getUserByEmail(db: Queryable, email: string) {
  const row = await queryOne<Record<string, unknown>>(
    db,
    'SELECT "id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt" FROM "User" WHERE LOWER("email") = LOWER($1)',
    [email]
  );
  return row ? mapUser(row) : null;
}

async function publicUser(db: Queryable, userId: string, select?: Select) {
  const user = await getUserById(db, userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
  return selectRecord(user, select);
}

async function getMembershipsByProjectId(db: Queryable, projectId: string) {
  const rows = await queryRows<Record<string, unknown>>(
    db,
    'SELECT "id", "projectId", "userId", "role", "createdAt" FROM "Membership" WHERE "projectId" = $1 ORDER BY "createdAt" ASC',
    [projectId]
  );
  return rows.map(mapMembership);
}

async function getTasksByProjectId(db: Queryable, projectId: string, direction: "asc" | "desc" = "desc") {
  const rows = await queryRows<Record<string, unknown>>(
    db,
    `SELECT "id", "projectId", "title", "description", "status", "assignmentType", "assigneeId", "assigneeRole", "createdById", "dueDate", "estimatedMinutes", "trackedMinutes", "timerStartedAt", "timerUserId", "recurrencePattern", "recurrenceParentTaskId", "createdAt", "updatedAt"
     FROM "Task"
     WHERE "projectId" = $1
     ORDER BY "createdAt" ${direction.toUpperCase()}`,
    [projectId]
  );
  return rows.map(mapTask);
}

async function countMembershipsByProjectId(db: Queryable, projectId: string) {
  const row = await queryOne<{ count: number }>(db, 'SELECT COUNT(*)::int AS "count" FROM "Membership" WHERE "projectId" = $1', [projectId]);
  return row ? Number(row.count) : 0;
}

async function countTasksByProjectId(db: Queryable, projectId: string) {
  const row = await queryOne<{ count: number }>(db, 'SELECT COUNT(*)::int AS "count" FROM "Task" WHERE "projectId" = $1', [projectId]);
  return row ? Number(row.count) : 0;
}

async function membershipWithInclude(db: Queryable, membership: DbMembership, include?: Args) {
  const userInclude = include?.user as { select?: Select } | undefined;
  if (!userInclude) {
    return membership;
  }

  return {
    ...membership,
    user: await publicUser(db, membership.userId, userInclude.select)
  };
}

async function taskWithInclude(db: Queryable, task: DbTask, include?: Args) {
  if (!include) {
    return task;
  }

  const assigneeInclude = include.assignee as { select?: Select } | undefined;
  const createdByInclude = include.createdBy as { select?: Select } | undefined;

  return {
    ...task,
    ...(assigneeInclude ? { assignee: task.assigneeId ? await publicUser(db, task.assigneeId, assigneeInclude.select) : null } : {}),
    ...(createdByInclude ? { createdBy: await publicUser(db, task.createdById, createdByInclude.select) } : {})
  };
}

async function projectWithInclude(db: Queryable, project: DbProject, include?: Args) {
  if (!include) {
    return project;
  }

  const result: Record<string, unknown> = { ...project };

  if (include.memberships) {
    const membershipInclude = include.memberships as { include?: Args };
    const memberships = await getMembershipsByProjectId(db, project.id);
    result.memberships = await Promise.all(
      memberships.map((membership) => membershipWithInclude(db, membership, membershipInclude.include))
    );
  }

  if (include.tasks) {
    const taskInclude = include.tasks;
    const taskConfig = taskInclude === true ? undefined : (taskInclude as { include?: Args; orderBy?: { createdAt?: "asc" | "desc" } });
    const direction = taskConfig?.orderBy?.createdAt ?? "desc";
    const tasks = await getTasksByProjectId(db, project.id, direction);
    result.tasks = taskInclude === true ? tasks : await Promise.all(tasks.map((task) => taskWithInclude(db, task, taskConfig?.include)));
  }

  if (include._count) {
    result._count = {
      memberships: await countMembershipsByProjectId(db, project.id),
      tasks: await countTasksByProjectId(db, project.id)
    };
  }

  return result;
}

function buildTaskWhere(where?: Args) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (!where) {
    return { clause: "", values };
  }

  if (where.id) {
    values.push(where.id);
    conditions.push(`"id" = $${values.length}`);
  }

  if (where.projectId) {
    values.push(where.projectId);
    conditions.push(`"projectId" = $${values.length}`);
  }

  if (where.assigneeId) {
    values.push(where.assigneeId);
    conditions.push(`"assigneeId" = $${values.length}`);
  }

  if (where.recurrenceParentTaskId) {
    values.push(where.recurrenceParentTaskId);
    conditions.push(`"recurrenceParentTaskId" = $${values.length}`);
  }

  const status = where.status as TaskStatus | { in?: TaskStatus[] } | undefined;
  if (typeof status === "string") {
    values.push(status);
    conditions.push(`"status" = $${values.length}`);
  } else if (status?.in?.length) {
    values.push(status.in);
    conditions.push(`"status" = ANY($${values.length}::"TaskStatus"[])`);
  }

  return {
    clause: conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "",
    values
  };
}

function buildRawQuery(query: TemplateStringsArray, values: unknown[]) {
  const text = query.reduce(
    (statement, part, index) => statement + part + (index < values.length ? `$${index + 1}` : ""),
    ""
  );
  return { text, values };
}

export async function createPostgresDatabase(): Promise<DatabaseClient> {
  await ensureSchema();

  return {
    user: {
      async count() {
        const row = await queryOne<{ count: number }>(getPool(), 'SELECT COUNT(*)::int AS "count" FROM "User"');
        return row ? Number(row.count) : 0;
      },
      async create(args) {
        const data = args.data as { name: string; email: string; passwordHash: string; role: Role };
        const createdAt = new Date();

        try {
          const row = await queryOne<Record<string, unknown>>(
            getPool(),
            `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt")
             VALUES ($1, $2, LOWER($3), $4, $5::"Role", $6, $7)
             RETURNING "id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt"`,
            [randomUUID(), data.name, data.email, data.passwordHash, data.role, createdAt, createdAt]
          );

          if (!row) {
            throw new Error("Failed to create user");
          }

          return selectRecord(mapUser(row), args.select as Select | undefined);
        } catch (error) {
          rethrowDbError(error);
        }
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        await execute(getPool(), 'DELETE FROM "User" WHERE "id" = $1', [id]);
        return {};
      },
      async deleteMany() {
        const count = await execute(getPool(), 'DELETE FROM "User"');
        return { count };
      },
      async findFirst(args) {
        return this.findUnique(args);
      },
      async findMany(args = {}) {
        const where = args.where as { OR?: Array<Record<string, { contains?: string }>> } | undefined;
        const query = where?.OR?.[0]?.name?.contains ?? where?.OR?.[1]?.email?.contains;
        const values: unknown[] = [];
        let whereClause = "";

        if (query) {
          values.push(`%${query}%`);
          whereClause = ` WHERE "name" ILIKE $1 OR "email" ILIKE $1`;
        }

        const take = (args.take as number | undefined) ?? 20;
        values.push(take);

        const rows = await queryRows<Record<string, unknown>>(
          getPool(),
          `SELECT "id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt"
           FROM "User"
           ${whereClause}
           ORDER BY "name" ASC
           LIMIT $${values.length}`,
          values
        );

        return rows.map((row) => selectRecord(mapUser(row), args.select as Select | undefined));
      },
      async findUnique(args) {
        const where = args.where as { id?: string; email?: string };
        const user = where.id ? await getUserById(getPool(), where.id) : await getUserByEmail(getPool(), String(where.email));
        return user ? selectRecord(user, args.select as Select | undefined) : null;
      },
      async findUniqueOrThrow(args) {
        const user = await this.findUnique(args);
        if (!user) {
          throw new Error("User not found");
        }
        return user;
      },
      async update() {
        throw new Error("user.update is not implemented in postgres mode");
      }
    },
    project: {
      async count() {
        const row = await queryOne<{ count: number }>(getPool(), 'SELECT COUNT(*)::int AS "count" FROM "Project"');
        return row ? Number(row.count) : 0;
      },
      async create(args) {
        const data = args.data as {
          name: string;
          description?: string | null;
          createdById: string;
          memberships?: { create?: { userId: string; role?: ProjectRole } };
        };

        return withTransaction(async (client) => {
          const createdAt = new Date();
          const row = await queryOne<Record<string, unknown>>(
            client,
            `INSERT INTO "Project" ("id", "name", "description", "createdById", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING "id", "name", "description", "createdById", "createdAt", "updatedAt"`,
            [randomUUID(), data.name, data.description ?? null, data.createdById, createdAt, createdAt]
          );

          if (!row) {
            throw new Error("Failed to create project");
          }

          const project = mapProject(row);

          if (data.memberships?.create) {
            await queryOne<Record<string, unknown>>(
              client,
              `INSERT INTO "Membership" ("id", "projectId", "userId", "role", "createdAt")
               VALUES ($1, $2, $3, $4::"ProjectRole", $5)
               RETURNING "id"`,
              [randomUUID(), project.id, data.memberships.create.userId, data.memberships.create.role ?? "MEMBER", createdAt]
            );
          }

          return projectWithInclude(client, project, args.include as Args | undefined);
        });
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        await execute(getPool(), 'DELETE FROM "Project" WHERE "id" = $1', [id]);
        return {};
      },
      async deleteMany() {
        const count = await execute(getPool(), 'DELETE FROM "Project"');
        return { count };
      },
      async findFirst(args) {
        return this.findUnique(args);
      },
      async findMany(args = {}) {
        const userId = (args.where as { memberships?: { some?: { userId?: string } } } | undefined)?.memberships?.some?.userId;
        const values: unknown[] = [];
        let whereClause = "";

        if (userId) {
          values.push(userId);
          whereClause = ` WHERE EXISTS (
            SELECT 1 FROM "Membership"
            WHERE "Membership"."projectId" = "Project"."id"
              AND "Membership"."userId" = $1
          )`;
        }

        const direction = ((args.orderBy as { createdAt?: "asc" | "desc" } | undefined)?.createdAt ?? "desc").toUpperCase();
        const rows = await queryRows<Record<string, unknown>>(
          getPool(),
          `SELECT "id", "name", "description", "createdById", "createdAt", "updatedAt"
           FROM "Project"
           ${whereClause}
           ORDER BY "createdAt" ${direction}`,
          values
        );

        return Promise.all(rows.map((row) => projectWithInclude(getPool(), mapProject(row), args.include as Args | undefined)));
      },
      async findUnique(args) {
        const id = (args.where as { id: string }).id;
        const row = await queryOne<Record<string, unknown>>(
          getPool(),
          'SELECT "id", "name", "description", "createdById", "createdAt", "updatedAt" FROM "Project" WHERE "id" = $1',
          [id]
        );

        if (!row) {
          return null;
        }

        const project = mapProject(row);
        return args.select ? selectRecord(project, args.select as Select) : projectWithInclude(getPool(), project, args.include as Args | undefined);
      },
      async findUniqueOrThrow(args) {
        const project = await this.findUnique(args);
        if (!project) {
          throw new Error("Project not found");
        }
        return project;
      },
      async update(args) {
        const id = (args.where as { id: string }).id;
        const data = args.data as { name?: string; description?: string | null };
        const values: unknown[] = [];
        const updates: string[] = [];

        if (data.name !== undefined) {
          values.push(data.name);
          updates.push(`"name" = $${values.length}`);
        }

        if (data.description !== undefined) {
          values.push(data.description);
          updates.push(`"description" = $${values.length}`);
        }

        values.push(new Date());
        updates.push(`"updatedAt" = $${values.length}`);
        values.push(id);

        const row = await queryOne<Record<string, unknown>>(
          getPool(),
          `UPDATE "Project"
           SET ${updates.join(", ")}
           WHERE "id" = $${values.length}
           RETURNING "id", "name", "description", "createdById", "createdAt", "updatedAt"`,
          values
        );

        if (!row) {
          throw new Error("Project not found");
        }

        return projectWithInclude(getPool(), mapProject(row), args.include as Args | undefined);
      }
    },
    membership: {
      async count() {
        const row = await queryOne<{ count: number }>(getPool(), 'SELECT COUNT(*)::int AS "count" FROM "Membership"');
        return row ? Number(row.count) : 0;
      },
      async create(args) {
        const data = args.data as { projectId: string; userId: string; role?: ProjectRole };
        const createdAt = new Date();

        try {
          const row = await queryOne<Record<string, unknown>>(
            getPool(),
            `INSERT INTO "Membership" ("id", "projectId", "userId", "role", "createdAt")
             VALUES ($1, $2, $3, $4::"ProjectRole", $5)
             RETURNING "id", "projectId", "userId", "role", "createdAt"`,
            [randomUUID(), data.projectId, data.userId, data.role ?? "MEMBER", createdAt]
          );

          if (!row) {
            throw new Error("Failed to create membership");
          }

          return membershipWithInclude(getPool(), mapMembership(row), args.include as Args | undefined);
        } catch (error) {
          rethrowDbError(error);
        }
      },
      async delete(args) {
        const where = (args.where as { projectId_userId: { projectId: string; userId: string } }).projectId_userId;
        await execute(getPool(), 'DELETE FROM "Membership" WHERE "projectId" = $1 AND "userId" = $2', [where.projectId, where.userId]);
        return {};
      },
      async deleteMany() {
        const count = await execute(getPool(), 'DELETE FROM "Membership"');
        return { count };
      },
      async findFirst(args) {
        return this.findUnique(args);
      },
      async findMany(args = {}) {
        const where = args.where as { projectId?: string } | undefined;
        const values: unknown[] = [];
        let whereClause = "";

        if (where?.projectId) {
          values.push(where.projectId);
          whereClause = ` WHERE "projectId" = $1`;
        }

        const direction = ((args.orderBy as { createdAt?: "asc" | "desc" } | undefined)?.createdAt ?? "asc").toUpperCase();
        const rows = await queryRows<Record<string, unknown>>(
          getPool(),
          `SELECT "id", "projectId", "userId", "role", "createdAt"
           FROM "Membership"
           ${whereClause}
           ORDER BY "createdAt" ${direction}`,
          values
        );

        return Promise.all(rows.map((row) => membershipWithInclude(getPool(), mapMembership(row), args.include as Args | undefined)));
      },
      async findUnique(args) {
        const where = (args.where as { projectId_userId: { projectId: string; userId: string } }).projectId_userId;
        const row = await queryOne<Record<string, unknown>>(
          getPool(),
          'SELECT "id", "projectId", "userId", "role", "createdAt" FROM "Membership" WHERE "projectId" = $1 AND "userId" = $2',
          [where.projectId, where.userId]
        );

        if (!row) {
          return null;
        }

        const membership = mapMembership(row);
        return args.select ? selectRecord(membership, args.select as Select) : membershipWithInclude(getPool(), membership, args.include as Args | undefined);
      },
      async findUniqueOrThrow(args) {
        const membership = await this.findUnique(args);
        if (!membership) {
          throw new Error("Membership not found");
        }
        return membership;
      },
      async update(args) {
        const where = (args.where as { projectId_userId: { projectId: string; userId: string } }).projectId_userId;
        const data = args.data as { role?: ProjectRole };
        const values: unknown[] = [];
        const updates: string[] = [];

        if (data.role !== undefined) {
          values.push(data.role);
          updates.push(`"role" = $${values.length}::"ProjectRole"`);
        }

        values.push(where.projectId, where.userId);

        const row = await queryOne<Record<string, unknown>>(
          getPool(),
          `UPDATE "Membership"
           SET ${updates.join(", ")}
           WHERE "projectId" = $${values.length - 1} AND "userId" = $${values.length}
           RETURNING "id", "projectId", "userId", "role", "createdAt"`,
          values
        );

        if (!row) {
          throw new Error("Membership not found");
        }

        return membershipWithInclude(getPool(), mapMembership(row), args.include as Args | undefined);
      }
    },
    task: {
      async count(args = {}) {
        const where = buildTaskWhere(args.where as Args | undefined);
        const row = await queryOne<{ count: number }>(
          getPool(),
          `SELECT COUNT(*)::int AS "count" FROM "Task"${where.clause}`,
          where.values
        );
        return row ? Number(row.count) : 0;
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

        const row = await queryOne<Record<string, unknown>>(
          getPool(),
          `INSERT INTO "Task" ("id", "projectId", "title", "description", "status", "assignmentType", "assigneeId", "assigneeRole", "createdById", "dueDate", "estimatedMinutes", "trackedMinutes", "timerStartedAt", "timerUserId", "recurrencePattern", "recurrenceParentTaskId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5::"TaskStatus", $6::"TaskAssignmentType", $7, $8::"ProjectRole", $9, $10, $11, $12, $13, $14, $15::"RecurrencePattern", $16, $17, $18)
           RETURNING "id", "projectId", "title", "description", "status", "assignmentType", "assigneeId", "assigneeRole", "createdById", "dueDate", "estimatedMinutes", "trackedMinutes", "timerStartedAt", "timerUserId", "recurrencePattern", "recurrenceParentTaskId", "createdAt", "updatedAt"`,
          [
            randomUUID(),
            data.projectId,
            data.title,
            data.description ?? null,
            data.status,
            data.assignmentType,
            data.assigneeId ?? null,
            data.assigneeRole ?? null,
            data.createdById,
            data.dueDate,
            data.estimatedMinutes ?? 0,
            data.trackedMinutes ?? 0,
            data.timerStartedAt ?? null,
            data.timerUserId ?? null,
            data.recurrencePattern ?? "NONE",
            data.recurrenceParentTaskId ?? null,
            createdAt,
            createdAt
          ]
        );

        if (!row) {
          throw new Error("Failed to create task");
        }

        return taskWithInclude(getPool(), mapTask(row), args.include as Args | undefined);
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        await execute(getPool(), 'DELETE FROM "Task" WHERE "id" = $1', [id]);
        return {};
      },
      async deleteMany() {
        const count = await execute(getPool(), 'DELETE FROM "Task"');
        return { count };
      },
      async findFirst(args) {
        const where = buildTaskWhere(args.where as Args | undefined);
        const row = await queryOne<Record<string, unknown>>(
          getPool(),
          `SELECT "id", "projectId", "title", "description", "status", "assignmentType", "assigneeId", "assigneeRole", "createdById", "dueDate", "estimatedMinutes", "trackedMinutes", "timerStartedAt", "timerUserId", "recurrencePattern", "recurrenceParentTaskId", "createdAt", "updatedAt"
           FROM "Task"
           ${where.clause}
           ORDER BY "createdAt" DESC
           LIMIT 1`,
          where.values
        );

        if (!row) {
          return null;
        }

        return taskWithInclude(getPool(), mapTask(row), args.include as Args | undefined);
      },
      async findMany(args = {}) {
        const where = buildTaskWhere(args.where as Args | undefined);
        const direction = ((args.orderBy as { createdAt?: "asc" | "desc" } | undefined)?.createdAt ?? "desc").toUpperCase();
        const rows = await queryRows<Record<string, unknown>>(
          getPool(),
          `SELECT "id", "projectId", "title", "description", "status", "assignmentType", "assigneeId", "assigneeRole", "createdById", "dueDate", "estimatedMinutes", "trackedMinutes", "timerStartedAt", "timerUserId", "recurrencePattern", "recurrenceParentTaskId", "createdAt", "updatedAt"
           FROM "Task"
           ${where.clause}
           ORDER BY "createdAt" ${direction}`,
          where.values
        );

        return Promise.all(rows.map((row) => taskWithInclude(getPool(), mapTask(row), args.include as Args | undefined)));
      },
      async findUnique(args) {
        const id = (args.where as { id: string }).id;
        const row = await queryOne<Record<string, unknown>>(
          getPool(),
          'SELECT "id", "projectId", "title", "description", "status", "assignmentType", "assigneeId", "assigneeRole", "createdById", "dueDate", "estimatedMinutes", "trackedMinutes", "timerStartedAt", "timerUserId", "recurrencePattern", "recurrenceParentTaskId", "createdAt", "updatedAt" FROM "Task" WHERE "id" = $1',
          [id]
        );

        if (!row) {
          return null;
        }

        return taskWithInclude(getPool(), mapTask(row), args.include as Args | undefined);
      },
      async findUniqueOrThrow(args) {
        const task = await this.findUnique(args);
        if (!task) {
          throw new Error("Task not found");
        }
        return task;
      },
      async update(args) {
        const id = (args.where as { id: string }).id;
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
        const values: unknown[] = [];
        const updates: string[] = [];

        if (data.title !== undefined) {
          values.push(data.title);
          updates.push(`"title" = $${values.length}`);
        }

        if (data.description !== undefined) {
          values.push(data.description);
          updates.push(`"description" = $${values.length}`);
        }

        if (data.status !== undefined) {
          values.push(data.status);
          updates.push(`"status" = $${values.length}::"TaskStatus"`);
        }

        if (data.assignmentType !== undefined) {
          values.push(data.assignmentType);
          updates.push(`"assignmentType" = $${values.length}::"TaskAssignmentType"`);
        }

        if (data.assigneeId !== undefined) {
          values.push(data.assigneeId);
          updates.push(`"assigneeId" = $${values.length}`);
        }

        if (data.assigneeRole !== undefined) {
          values.push(data.assigneeRole);
          updates.push(`"assigneeRole" = $${values.length}::"ProjectRole"`);
        }

        if (data.dueDate !== undefined) {
          values.push(data.dueDate);
          updates.push(`"dueDate" = $${values.length}`);
        }

        if (data.estimatedMinutes !== undefined) {
          values.push(data.estimatedMinutes);
          updates.push(`"estimatedMinutes" = $${values.length}`);
        }

        if (data.trackedMinutes !== undefined) {
          values.push(data.trackedMinutes);
          updates.push(`"trackedMinutes" = $${values.length}`);
        }

        if (data.timerStartedAt !== undefined) {
          values.push(data.timerStartedAt);
          updates.push(`"timerStartedAt" = $${values.length}`);
        }

        if (data.timerUserId !== undefined) {
          values.push(data.timerUserId);
          updates.push(`"timerUserId" = $${values.length}`);
        }

        if (data.recurrencePattern !== undefined) {
          values.push(data.recurrencePattern);
          updates.push(`"recurrencePattern" = $${values.length}::"RecurrencePattern"`);
        }

        values.push(new Date());
        updates.push(`"updatedAt" = $${values.length}`);
        values.push(id);

        const row = await queryOne<Record<string, unknown>>(
          getPool(),
          `UPDATE "Task"
           SET ${updates.join(", ")}
           WHERE "id" = $${values.length}
           RETURNING "id", "projectId", "title", "description", "status", "assignmentType", "assigneeId", "assigneeRole", "createdById", "dueDate", "estimatedMinutes", "trackedMinutes", "timerStartedAt", "timerUserId", "recurrencePattern", "recurrenceParentTaskId", "createdAt", "updatedAt"`,
          values
        );

        if (!row) {
          throw new Error("Task not found");
        }

        return taskWithInclude(getPool(), mapTask(row), args.include as Args | undefined);
      }
    },
    async $disconnect() {
      await globalForPostgres.postgresPool?.end();
      globalForPostgres.postgresPool = undefined;
      globalForPostgres.postgresSchemaPromise = undefined;
    },
    async $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]) {
      const rawQuery = buildRawQuery(query, values);
      const rows = await queryRows<T>(getPool(), rawQuery.text, rawQuery.values);
      return rows as T;
    }
  };
}
