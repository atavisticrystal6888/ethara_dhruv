import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { env } from "../config/env.js";
import type { Role, TaskStatus } from "../types/domain.js";
import type { DbMembership, DbProject, DbTask, DbUser, PrismaDatabase } from "../types/prisma.js";

type Args = Record<string, unknown>;
type Select = Record<string, boolean>;
type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

const globalForPostgres = globalThis as unknown as { postgresPool?: Pool };

const pool =
  globalForPostgres.postgresPool ??
  new Pool({
    connectionString: env.DATABASE_URL
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = pool;
}

function selectRecord<T extends object>(record: T, select?: Select) {
  if (!select) return record;

  const selected: Record<string, unknown> = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) {
      selected[key] = (record as Record<string, unknown>)[key];
    }
  }
  return selected;
}

function prismaConflict() {
  return Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const isoValue = value.includes("T") ? value : value.replace(" ", "T");
    return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(isoValue) ? isoValue : `${isoValue}Z`);
  }
  if (typeof value === "number") return new Date(value);
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
    assigneeId: String(row.assigneeId),
    createdById: String(row.createdById),
    dueDate: normalizeDate(row.dueDate),
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
    throw prismaConflict();
  }
  throw error;
}

async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
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
    'SELECT "id", "projectId", "userId", "createdAt" FROM "Membership" WHERE "projectId" = $1 ORDER BY "createdAt" ASC',
    [projectId]
  );
  return rows.map(mapMembership);
}

async function getTasksByProjectId(db: Queryable, projectId: string, direction: "asc" | "desc" = "desc") {
  const rows = await queryRows<Record<string, unknown>>(
    db,
    `SELECT "id", "projectId", "title", "description", "status", "assigneeId", "createdById", "dueDate", "createdAt", "updatedAt"
     FROM "Task"
     WHERE "projectId" = $1
     ORDER BY "createdAt" ${direction.toUpperCase()}`,
    [projectId]
  );
  return rows.map(mapTask);
}

async function countMembershipsByProjectId(db: Queryable, projectId: string) {
  const row = await queryOne<{ count: string }>(db, 'SELECT COUNT(*)::text AS "count" FROM "Membership" WHERE "projectId" = $1', [projectId]);
  return row ? Number(row.count) : 0;
}

async function countTasksByProjectId(db: Queryable, projectId: string) {
  const row = await queryOne<{ count: string }>(db, 'SELECT COUNT(*)::text AS "count" FROM "Task" WHERE "projectId" = $1', [projectId]);
  return row ? Number(row.count) : 0;
}

async function membershipWithInclude(db: Queryable, membership: DbMembership, include?: Args) {
  const userInclude = include?.user as { select?: Select } | undefined;
  if (!userInclude) return membership;
  return {
    ...membership,
    user: await publicUser(db, membership.userId, userInclude.select)
  };
}

async function taskWithInclude(db: Queryable, task: DbTask, include?: Args) {
  if (!include) return task;

  const assigneeInclude = include.assignee as { select?: Select } | undefined;
  const createdByInclude = include.createdBy as { select?: Select } | undefined;

  return {
    ...task,
    ...(assigneeInclude ? { assignee: await publicUser(db, task.assigneeId, assigneeInclude.select) } : {}),
    ...(createdByInclude ? { createdBy: await publicUser(db, task.createdById, createdByInclude.select) } : {})
  };
}

async function projectWithInclude(db: Queryable, project: DbProject, include?: Args) {
  if (!include) return project;

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

export function createPostgresPrisma(): PrismaDatabase {
  return {
    user: {
      async count() {
        const row = await queryOne<{ count: string }>(pool, 'SELECT COUNT(*)::text AS "count" FROM "User"');
        return row ? Number(row.count) : 0;
      },
      async create(args) {
        const data = args.data as { name: string; email: string; passwordHash: string; role: Role };
        const createdAt = new Date();

        try {
          const row = await queryOne<Record<string, unknown>>(
            pool,
            `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt")
             VALUES ($1, $2, LOWER($3), $4, $5::"Role", $6, $7)
             RETURNING "id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt"`,
            [randomUUID(), data.name, data.email, data.passwordHash, data.role, createdAt, createdAt]
          );

          if (!row) throw new Error("Failed to create user");
          return selectRecord(mapUser(row), args.select as Select | undefined);
        } catch (error) {
          rethrowDbError(error);
        }
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        await execute(pool, 'DELETE FROM "User" WHERE "id" = $1', [id]);
        return {};
      },
      async deleteMany() {
        const count = await execute(pool, 'DELETE FROM "User"');
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
          pool,
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
        const user = where.id ? await getUserById(pool, where.id) : await getUserByEmail(pool, String(where.email));
        return user ? selectRecord(user, args.select as Select | undefined) : null;
      },
      async findUniqueOrThrow(args) {
        const user = await this.findUnique(args);
        if (!user) throw new Error("User not found");
        return user;
      },
      async update() {
        throw new Error("user.update is not implemented in postgres mode");
      }
    },
    project: {
      async count() {
        const row = await queryOne<{ count: string }>(pool, 'SELECT COUNT(*)::text AS "count" FROM "Project"');
        return row ? Number(row.count) : 0;
      },
      async create(args) {
        const data = args.data as {
          name: string;
          description?: string | null;
          createdById: string;
          memberships?: { create?: { userId: string } };
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

          if (!row) throw new Error("Failed to create project");

          const project = mapProject(row);

          if (data.memberships?.create) {
            await queryOne<Record<string, unknown>>(
              client,
              `INSERT INTO "Membership" ("id", "projectId", "userId", "createdAt")
               VALUES ($1, $2, $3, $4)
               RETURNING "id"`,
              [randomUUID(), project.id, data.memberships.create.userId, createdAt]
            );
          }

          return projectWithInclude(client, project, args.include as Args | undefined);
        });
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        await execute(pool, 'DELETE FROM "Project" WHERE "id" = $1', [id]);
        return {};
      },
      async deleteMany() {
        const count = await execute(pool, 'DELETE FROM "Project"');
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
          whereClause =
            ' WHERE EXISTS (SELECT 1 FROM "Membership" m WHERE m."projectId" = "Project"."id" AND m."userId" = $1)';
        }

        const rows = await queryRows<Record<string, unknown>>(
          pool,
          `SELECT "id", "name", "description", "createdById", "createdAt", "updatedAt"
           FROM "Project"
           ${whereClause}
           ORDER BY "createdAt" DESC`,
          values
        );

        return Promise.all(
          rows.map((row) => projectWithInclude(pool, mapProject(row), args.include as Args | undefined))
        );
      },
      async findUnique(args) {
        const id = (args.where as { id: string }).id;
        const row = await queryOne<Record<string, unknown>>(
          pool,
          'SELECT "id", "name", "description", "createdById", "createdAt", "updatedAt" FROM "Project" WHERE "id" = $1',
          [id]
        );

        if (!row) return null;
        const project = mapProject(row);
        return args.select ? selectRecord(project, args.select as Select) : projectWithInclude(pool, project, args.include as Args | undefined);
      },
      async findUniqueOrThrow(args) {
        const project = await this.findUnique(args);
        if (!project) throw new Error("Project not found");
        return project;
      },
      async update(args) {
        const id = (args.where as { id: string }).id;
        const data = args.data as { name?: string; description?: string | null };
        const values: unknown[] = [];
        const assignments: string[] = [];

        if (data.name !== undefined) {
          values.push(data.name);
          assignments.push(`"name" = $${values.length}`);
        }

        if (data.description !== undefined) {
          values.push(data.description);
          assignments.push(`"description" = $${values.length}`);
        }

        values.push(new Date());
        assignments.push(`"updatedAt" = $${values.length}`);
        values.push(id);

        const row = await queryOne<Record<string, unknown>>(
          pool,
          `UPDATE "Project"
           SET ${assignments.join(", ")}
           WHERE "id" = $${values.length}
           RETURNING "id", "name", "description", "createdById", "createdAt", "updatedAt"`,
          values
        );

        if (!row) throw new Error("Project not found");
        return projectWithInclude(pool, mapProject(row), args.include as Args | undefined);
      }
    },
    membership: {
      async count() {
        const row = await queryOne<{ count: string }>(pool, 'SELECT COUNT(*)::text AS "count" FROM "Membership"');
        return row ? Number(row.count) : 0;
      },
      async create(args) {
        const data = args.data as { projectId: string; userId: string };
        try {
          const row = await queryOne<Record<string, unknown>>(
            pool,
            `INSERT INTO "Membership" ("id", "projectId", "userId", "createdAt")
             VALUES ($1, $2, $3, $4)
             RETURNING "id", "projectId", "userId", "createdAt"`,
            [randomUUID(), data.projectId, data.userId, new Date()]
          );

          if (!row) throw new Error("Failed to create membership");
          return membershipWithInclude(pool, mapMembership(row), args.include as Args | undefined);
        } catch (error) {
          rethrowDbError(error);
        }
      },
      async delete(args) {
        const where = (args.where as { projectId_userId: { projectId: string; userId: string } }).projectId_userId;
        await execute(pool, 'DELETE FROM "Membership" WHERE "projectId" = $1 AND "userId" = $2', [where.projectId, where.userId]);
        return {};
      },
      async deleteMany() {
        const count = await execute(pool, 'DELETE FROM "Membership"');
        return { count };
      },
      async findFirst(args) {
        return this.findUnique(args);
      },
      async findMany(args = {}) {
        const projectId = (args.where as { projectId?: string } | undefined)?.projectId;
        const rows = await queryRows<Record<string, unknown>>(
          pool,
          projectId
            ? 'SELECT "id", "projectId", "userId", "createdAt" FROM "Membership" WHERE "projectId" = $1 ORDER BY "createdAt" ASC'
            : 'SELECT "id", "projectId", "userId", "createdAt" FROM "Membership" ORDER BY "createdAt" ASC',
          projectId ? [projectId] : []
        );

        return Promise.all(
          rows.map((row) => {
            const membership = mapMembership(row);
            return args.select
              ? Promise.resolve(selectRecord(membership, args.select as Select | undefined))
              : membershipWithInclude(pool, membership, args.include as Args | undefined);
          })
        );
      },
      async findUnique(args) {
        const where = (args.where as { projectId_userId: { projectId: string; userId: string } }).projectId_userId;
        const row = await queryOne<Record<string, unknown>>(
          pool,
          `SELECT "id", "projectId", "userId", "createdAt"
           FROM "Membership"
           WHERE "projectId" = $1 AND "userId" = $2`,
          [where.projectId, where.userId]
        );

        if (!row) return null;
        const membership = mapMembership(row);
        return args.select
          ? selectRecord(membership, args.select as Select | undefined)
          : membershipWithInclude(pool, membership, args.include as Args | undefined);
      },
      async findUniqueOrThrow(args) {
        const membership = await this.findUnique(args);
        if (!membership) throw new Error("Membership not found");
        return membership;
      },
      async update() {
        throw new Error("membership.update is not implemented in postgres mode");
      }
    },
    task: {
      async count(args = {}) {
        const { clause, values } = buildTaskWhere(args.where as Args | undefined);
        const row = await queryOne<{ count: string }>(
          pool,
          `SELECT COUNT(*)::text AS "count" FROM "Task"${clause}`,
          values
        );
        return row ? Number(row.count) : 0;
      },
      async create(args) {
        const data = args.data as {
          projectId: string;
          title: string;
          description?: string | null;
          status: TaskStatus;
          assigneeId: string;
          createdById: string;
          dueDate: Date;
        };

        const createdAt = new Date();
        const row = await queryOne<Record<string, unknown>>(
          pool,
          `INSERT INTO "Task" ("id", "projectId", "title", "description", "status", "assigneeId", "createdById", "dueDate", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5::"TaskStatus", $6, $7, $8, $9, $10)
           RETURNING "id", "projectId", "title", "description", "status", "assigneeId", "createdById", "dueDate", "createdAt", "updatedAt"`,
          [randomUUID(), data.projectId, data.title, data.description ?? null, data.status, data.assigneeId, data.createdById, data.dueDate, createdAt, createdAt]
        );

        if (!row) throw new Error("Failed to create task");
        return taskWithInclude(pool, mapTask(row), args.include as Args | undefined);
      },
      async delete(args) {
        const id = (args.where as { id: string }).id;
        await execute(pool, 'DELETE FROM "Task" WHERE "id" = $1', [id]);
        return {};
      },
      async deleteMany() {
        const count = await execute(pool, 'DELETE FROM "Task"');
        return { count };
      },
      async findFirst(args) {
        const { clause, values } = buildTaskWhere(args.where as Args | undefined);
        const row = await queryOne<Record<string, unknown>>(
          pool,
          `SELECT "id", "projectId", "title", "description", "status", "assigneeId", "createdById", "dueDate", "createdAt", "updatedAt"
           FROM "Task"${clause}
           ORDER BY "createdAt" DESC
           LIMIT 1`,
          values
        );

        if (!row) return null;
        return taskWithInclude(pool, mapTask(row), args.include as Args | undefined);
      },
      async findMany(args = {}) {
        const { clause, values } = buildTaskWhere(args.where as Args | undefined);
        const rows = await queryRows<Record<string, unknown>>(
          pool,
          `SELECT "id", "projectId", "title", "description", "status", "assigneeId", "createdById", "dueDate", "createdAt", "updatedAt"
           FROM "Task"${clause}
           ORDER BY "createdAt" DESC`,
          values
        );

        return Promise.all(rows.map((row) => taskWithInclude(pool, mapTask(row), args.include as Args | undefined)));
      },
      async findUnique(args) {
        const id = (args.where as { id: string }).id;
        const row = await queryOne<Record<string, unknown>>(
          pool,
          `SELECT "id", "projectId", "title", "description", "status", "assigneeId", "createdById", "dueDate", "createdAt", "updatedAt"
           FROM "Task"
           WHERE "id" = $1`,
          [id]
        );

        if (!row) return null;
        return taskWithInclude(pool, mapTask(row), args.include as Args | undefined);
      },
      async findUniqueOrThrow(args) {
        const task = await this.findUnique(args);
        if (!task) throw new Error("Task not found");
        return task;
      },
      async update(args) {
        const id = (args.where as { id: string }).id;
        const data = args.data as {
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          assigneeId?: string;
          dueDate?: Date;
        };
        const values: unknown[] = [];
        const assignments: string[] = [];

        if (data.title !== undefined) {
          values.push(data.title);
          assignments.push(`"title" = $${values.length}`);
        }

        if (data.description !== undefined) {
          values.push(data.description);
          assignments.push(`"description" = $${values.length}`);
        }

        if (data.status !== undefined) {
          values.push(data.status);
          assignments.push(`"status" = $${values.length}::"TaskStatus"`);
        }

        if (data.assigneeId !== undefined) {
          values.push(data.assigneeId);
          assignments.push(`"assigneeId" = $${values.length}`);
        }

        if (data.dueDate !== undefined) {
          values.push(data.dueDate);
          assignments.push(`"dueDate" = $${values.length}`);
        }

        values.push(new Date());
        assignments.push(`"updatedAt" = $${values.length}`);
        values.push(id);

        const row = await queryOne<Record<string, unknown>>(
          pool,
          `UPDATE "Task"
           SET ${assignments.join(", ")}
           WHERE "id" = $${values.length}
           RETURNING "id", "projectId", "title", "description", "status", "assigneeId", "createdById", "dueDate", "createdAt", "updatedAt"`,
          values
        );

        if (!row) throw new Error("Task not found");
        return taskWithInclude(pool, mapTask(row), args.include as Args | undefined);
      }
    },
    async $disconnect() {
      await pool.end();
    },
    async $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]) {
      const statement = buildRawQuery(query, values);
      const rows = await queryRows<T>(pool, statement.text, statement.values);
      return rows as T;
    }
  };
}