import type { DashboardSummary, TaskStatus } from "../../api/client";
import { StatusBadge } from "../tasks/StatusBadge";

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export function StatusBreakdown({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="panel stack">
      <h2>Status</h2>
      {statuses.map((status) => (
        <div className="metric-row" key={status}>
          <StatusBadge status={status} />
          <strong>{summary.statusTotals[status]}</strong>
        </div>
      ))}
    </section>
  );
}
