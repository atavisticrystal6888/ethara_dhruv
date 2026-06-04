DO $$ BEGIN
  CREATE TYPE "SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Sprint" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "goal" TEXT,
  "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "sprintId" TEXT REFERENCES "Sprint"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Sprint_projectId_idx" ON "Sprint" ("projectId");
CREATE INDEX IF NOT EXISTS "Sprint_status_idx" ON "Sprint" ("status");
CREATE INDEX IF NOT EXISTS "Task_sprintId_idx" ON "Task" ("sprintId");
CREATE UNIQUE INDEX IF NOT EXISTS "Sprint_active_project_idx" ON "Sprint" ("projectId") WHERE "status" = 'ACTIVE';