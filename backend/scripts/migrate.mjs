import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import pg from "pg";

const migrationsDir = resolve(process.cwd(), "db", "migrations");
const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run database migrations.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

const migrationFiles = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "SchemaMigration" (
      "id" TEXT PRIMARY KEY,
      "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const migrationFile of migrationFiles) {
    const migrationCheck = await client.query('SELECT 1 FROM "SchemaMigration" WHERE "id" = $1', [migrationFile]);

    if (migrationCheck.rowCount) {
      console.log(`Skipping ${migrationFile}`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, migrationFile), "utf8").trim();

    if (!sql) {
      console.log(`Skipping ${migrationFile} (empty file)`);
      continue;
    }

    await client.query("BEGIN");

    try {
      await client.query(sql);
      await client.query('INSERT INTO "SchemaMigration" ("id") VALUES ($1)', [migrationFile]);
      await client.query("COMMIT");
      console.log(`Applied ${migrationFile}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}