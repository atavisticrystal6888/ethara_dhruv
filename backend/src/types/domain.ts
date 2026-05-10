export type Role = "ADMIN" | "MEMBER";
export type ProjectRole = "OWNER" | "MANAGER" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskAssignmentType = "USER" | "ROLE";
export type RecurrencePattern = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export const projectRoles = ["OWNER", "MANAGER", "MEMBER"] as const;
export const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const taskAssignmentTypes = ["USER", "ROLE"] as const;
export const recurrencePatterns = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;
