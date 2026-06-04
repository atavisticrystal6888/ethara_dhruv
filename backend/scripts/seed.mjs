import bcryptjs from "bcryptjs";
import pg from "pg";

const { hash } = bcryptjs;

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

const now = new Date();

function addDays(days) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

const users = [
  { key: "avery", name: "Avery Stone", email: "avery@teamflow.demo", role: "ADMIN" },
  { key: "maya", name: "Maya Chen", email: "maya@teamflow.demo", role: "MEMBER" },
  { key: "idris", name: "Idris Vale", email: "idris@teamflow.demo", role: "MEMBER" },
  { key: "sana", name: "Sana Noor", email: "sana@teamflow.demo", role: "MEMBER" },
  { key: "leo", name: "Leo Park", email: "leo@teamflow.demo", role: "MEMBER" }
];

const projects = [
  { id: "seed-project-pulse", name: "Pulse Launch", description: "Cross-functional rollout with recurring launch rituals.", createdByKey: "avery" },
  { id: "seed-project-ops", name: "Client Ops Revamp", description: "Operational cleanup, SLA reporting, and handoff automation.", createdByKey: "maya" },
  { id: "seed-project-campus", name: "Campus Sprint", description: "Student-facing onboarding improvements and event delivery.", createdByKey: "sana" }
];

const memberships = [
  { id: "seed-membership-pulse-avery", projectId: "seed-project-pulse", userKey: "avery", role: "OWNER" },
  { id: "seed-membership-pulse-maya", projectId: "seed-project-pulse", userKey: "maya", role: "MANAGER" },
  { id: "seed-membership-pulse-idris", projectId: "seed-project-pulse", userKey: "idris", role: "MEMBER" },
  { id: "seed-membership-pulse-leo", projectId: "seed-project-pulse", userKey: "leo", role: "MEMBER" },
  { id: "seed-membership-ops-maya", projectId: "seed-project-ops", userKey: "maya", role: "OWNER" },
  { id: "seed-membership-ops-avery", projectId: "seed-project-ops", userKey: "avery", role: "MANAGER" },
  { id: "seed-membership-ops-idris", projectId: "seed-project-ops", userKey: "idris", role: "MEMBER" },
  { id: "seed-membership-campus-sana", projectId: "seed-project-campus", userKey: "sana", role: "OWNER" },
  { id: "seed-membership-campus-leo", projectId: "seed-project-campus", userKey: "leo", role: "MANAGER" },
  { id: "seed-membership-campus-idris", projectId: "seed-project-campus", userKey: "idris", role: "MEMBER" }
];

const tasks = [
  {
    id: "seed-task-launch-sync",
    projectId: "seed-project-pulse",
    title: "Weekly launch sync",
    description: "Delegated to project managers for rollout readiness.",
    status: "IN_PROGRESS",
    issueType: "TASK",
    priority: "HIGH",
    assignmentType: "ROLE",
    assigneeRole: "MANAGER",
    createdByKey: "avery",
    dueDate: addDays(2),
    storyPoints: 5,
    labels: ["launch", "ritual"],
    estimatedMinutes: 90,
    trackedMinutes: 40,
    recurrencePattern: "WEEKLY"
  },
  {
    id: "seed-task-copy-final",
    projectId: "seed-project-pulse",
    title: "Finalize launch copy",
    description: "Approve public messaging and CTA hierarchy.",
    status: "TODO",
    issueType: "STORY",
    priority: "CRITICAL",
    assignmentType: "USER",
    assigneeKey: "idris",
    createdByKey: "maya",
    dueDate: addDays(4),
    storyPoints: 8,
    labels: ["content", "launch"],
    estimatedMinutes: 180,
    trackedMinutes: 60,
    recurrencePattern: "NONE"
  },
  {
    id: "seed-task-ops-report",
    projectId: "seed-project-ops",
    title: "Publish SLA report",
    description: "Roll up tracked time and completion rates for weekly review.",
    status: "DONE",
    issueType: "TASK",
    priority: "MEDIUM",
    assignmentType: "USER",
    assigneeKey: "maya",
    createdByKey: "avery",
    dueDate: addDays(-1),
    storyPoints: 3,
    labels: ["ops", "reporting"],
    estimatedMinutes: 120,
    trackedMinutes: 135,
    recurrencePattern: "MONTHLY"
  },
  {
    id: "seed-task-ops-followup",
    projectId: "seed-project-ops",
    title: "Next SLA report",
    description: "Auto-generated follow-up for the next reporting cycle.",
    status: "TODO",
    issueType: "TASK",
    priority: "LOW",
    assignmentType: "USER",
    assigneeKey: "maya",
    createdByKey: "avery",
    dueDate: addDays(29),
    storyPoints: 3,
    labels: ["ops", "reporting"],
    estimatedMinutes: 120,
    trackedMinutes: 0,
    recurrencePattern: "MONTHLY",
    recurrenceParentTaskId: "seed-task-ops-report"
  },
  {
    id: "seed-task-campus-calendar",
    projectId: "seed-project-campus",
    title: "Confirm orientation calendar",
    description: "Calendar and gantt views should show this near-term milestone.",
    status: "IN_PROGRESS",
    issueType: "EPIC",
    priority: "HIGH",
    assignmentType: "USER",
    assigneeKey: "leo",
    createdByKey: "sana",
    dueDate: addDays(6),
    storyPoints: 13,
    labels: ["events", "planning"],
    estimatedMinutes: 240,
    trackedMinutes: 155,
    recurrencePattern: "NONE"
  },
  {
    id: "seed-task-campus-checkin",
    projectId: "seed-project-campus",
    title: "Volunteer check-in",
    description: "A recurring daily reminder for event prep.",
    status: "TODO",
    issueType: "BUG",
    priority: "MEDIUM",
    assignmentType: "ROLE",
    assigneeRole: "MEMBER",
    createdByKey: "leo",
    dueDate: addDays(1),
    storyPoints: 2,
    labels: ["ops", "volunteers"],
    estimatedMinutes: 30,
    trackedMinutes: 0,
    recurrencePattern: "DAILY"
  }
];

await client.connect();

try {
  const passwordHash = await hash("TeamFlow2026!", 10);
  const userIds = new Map();

  await client.query("BEGIN");

  for (const user of users) {
    const result = await client.query(
      `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt")
       VALUES ($1, $2, LOWER($3), $4, $5::"Role", NOW(), NOW())
       ON CONFLICT ("email") DO UPDATE
       SET "name" = EXCLUDED."name",
           "passwordHash" = EXCLUDED."passwordHash",
           "role" = EXCLUDED."role",
           "updatedAt" = NOW()
       RETURNING "id"`,
      [`seed-user-${user.key}`, user.name, user.email, passwordHash, user.role]
    );
    userIds.set(user.key, result.rows[0].id);
  }

  for (const project of projects) {
    await client.query(
      `INSERT INTO "Project" ("id", "name", "description", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT ("id") DO UPDATE
       SET "name" = EXCLUDED."name",
           "description" = EXCLUDED."description",
           "createdById" = EXCLUDED."createdById",
           "updatedAt" = NOW()`,
      [project.id, project.name, project.description, userIds.get(project.createdByKey)]
    );
  }

  for (const membership of memberships) {
    await client.query(
      `INSERT INTO "Membership" ("id", "projectId", "userId", "role", "createdAt")
       VALUES ($1, $2, $3, $4::"ProjectRole", NOW())
       ON CONFLICT ("projectId", "userId") DO UPDATE
       SET "role" = EXCLUDED."role"`,
      [membership.id, membership.projectId, userIds.get(membership.userKey), membership.role]
    );
  }

  for (const task of tasks) {
    await client.query(
      `INSERT INTO "Task" (
        "id", "projectId", "title", "description", "status", "issueType", "priority", "assignmentType", "assigneeId", "assigneeRole", "createdById", "dueDate",
        "storyPoints", "labels", "sortOrder", "estimatedMinutes", "trackedMinutes", "timerStartedAt", "timerUserId", "recurrencePattern", "recurrenceParentTaskId", "createdAt", "updatedAt"
       )
       VALUES (
        $1, $2, $3, $4, $5::"TaskStatus", $6::"TaskIssueType", $7::"TaskPriority", $8::"TaskAssignmentType", $9, $10::"ProjectRole", $11, $12,
        $13, $14::TEXT[], $15, $16, $17, $18, $19, $20::"RecurrencePattern", $21, NOW(), NOW()
       )
       ON CONFLICT ("id") DO UPDATE
       SET "title" = EXCLUDED."title",
           "description" = EXCLUDED."description",
           "status" = EXCLUDED."status",
           "issueType" = EXCLUDED."issueType",
           "priority" = EXCLUDED."priority",
           "assignmentType" = EXCLUDED."assignmentType",
           "assigneeId" = EXCLUDED."assigneeId",
           "assigneeRole" = EXCLUDED."assigneeRole",
           "createdById" = EXCLUDED."createdById",
           "dueDate" = EXCLUDED."dueDate",
           "storyPoints" = EXCLUDED."storyPoints",
           "labels" = EXCLUDED."labels",
           "sortOrder" = EXCLUDED."sortOrder",
           "estimatedMinutes" = EXCLUDED."estimatedMinutes",
           "trackedMinutes" = EXCLUDED."trackedMinutes",
           "timerStartedAt" = EXCLUDED."timerStartedAt",
           "timerUserId" = EXCLUDED."timerUserId",
           "recurrencePattern" = EXCLUDED."recurrencePattern",
           "recurrenceParentTaskId" = EXCLUDED."recurrenceParentTaskId",
           "updatedAt" = NOW()`,
      [
        task.id,
        task.projectId,
        task.title,
        task.description,
        task.status,
        task.issueType,
        task.priority,
        task.assignmentType,
        task.assigneeKey ? userIds.get(task.assigneeKey) : null,
        task.assigneeRole ?? null,
        userIds.get(task.createdByKey),
        task.dueDate,
        task.storyPoints,
        task.labels,
        task.dueDate.getTime(),
        task.estimatedMinutes,
        task.trackedMinutes,
        null,
        null,
        task.recurrencePattern,
        task.recurrenceParentTaskId ?? null
      ]
    );
  }

  await client.query("COMMIT");

  console.log("Seeded TeamFlow demo data.");
  console.log("Demo credentials: avery@teamflow.demo / TeamFlow2026!");
  console.log("Member credentials: maya@teamflow.demo / TeamFlow2026!");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}