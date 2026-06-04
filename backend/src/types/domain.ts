export type Role = "ADMIN" | "MEMBER";
export type ProjectRole = "OWNER" | "MANAGER" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskAssignmentType = "USER" | "ROLE";
export type TaskIssueType = "EPIC" | "STORY" | "TASK" | "BUG";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TaskActivityType = "CREATED" | "UPDATED" | "COMMENTED";
export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";
export type RecurrencePattern = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export const projectRoles = ["OWNER", "MANAGER", "MEMBER"] as const;
export const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const taskAssignmentTypes = ["USER", "ROLE"] as const;
export const taskIssueTypes = ["EPIC", "STORY", "TASK", "BUG"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const taskActivityTypes = ["CREATED", "UPDATED", "COMMENTED"] as const;
export const sprintStatuses = ["PLANNED", "ACTIVE", "COMPLETED"] as const;
export const recurrencePatterns = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;
