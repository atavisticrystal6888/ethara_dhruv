import type { TaskStatus } from "../../api/client";

const labels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done"
};

export function StatusBadge({ status, overdue = false }: { status: TaskStatus; overdue?: boolean }) {
  return <span className={`status status-${overdue ? "overdue" : status.toLowerCase()}`}>{overdue ? "Overdue" : labels[status]}</span>;
}
