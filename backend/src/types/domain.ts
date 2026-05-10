export type Role = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
