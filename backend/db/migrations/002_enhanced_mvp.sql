DO $$ BEGIN
  CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskAssignmentType" AS ENUM ('USER', 'ROLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RecurrencePattern" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Membership"
  ADD COLUMN IF NOT EXISTS "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER';

UPDATE "Membership"
SET "role" = 'OWNER'::"ProjectRole"
FROM "Project"
WHERE "Membership"."projectId" = "Project"."id"
  AND "Membership"."userId" = "Project"."createdById";

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "assignmentType" "TaskAssignmentType" NOT NULL DEFAULT 'USER';

ALTER TABLE "Task"
  ALTER COLUMN "assigneeId" DROP NOT NULL;

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "assigneeRole" "ProjectRole";

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "estimatedMinutes" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "trackedMinutes" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "timerStartedAt" TIMESTAMPTZ;

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "timerUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "recurrencePattern" "RecurrencePattern" NOT NULL DEFAULT 'NONE';

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "recurrenceParentTaskId" TEXT REFERENCES "Task"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Membership_role_idx" ON "Membership" ("role");
CREATE INDEX IF NOT EXISTS "Task_assignmentType_idx" ON "Task" ("assignmentType");
CREATE INDEX IF NOT EXISTS "Task_recurrencePattern_idx" ON "Task" ("recurrencePattern");
CREATE INDEX IF NOT EXISTS "Task_timerUserId_idx" ON "Task" ("timerUserId");