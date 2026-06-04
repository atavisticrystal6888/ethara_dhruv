DO $$ BEGIN
  CREATE TYPE "TaskActivityType" AS ENUM ('CREATED', 'UPDATED', 'COMMENTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "TaskComment" (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT NOT NULL REFERENCES "Task"("id") ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TaskActivity" (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT NOT NULL REFERENCES "Task"("id") ON DELETE CASCADE,
  "actorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "type" "TaskActivityType" NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "TaskComment_taskId_idx" ON "TaskComment" ("taskId");
CREATE INDEX IF NOT EXISTS "TaskComment_authorId_idx" ON "TaskComment" ("authorId");
CREATE INDEX IF NOT EXISTS "TaskActivity_taskId_idx" ON "TaskActivity" ("taskId");
CREATE INDEX IF NOT EXISTS "TaskActivity_actorId_idx" ON "TaskActivity" ("actorId");
CREATE INDEX IF NOT EXISTS "TaskActivity_type_idx" ON "TaskActivity" ("type");