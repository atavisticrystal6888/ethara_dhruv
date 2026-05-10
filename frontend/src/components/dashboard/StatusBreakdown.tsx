import type { DashboardSummary, TaskStatus } from "../../api/client";
import { StatusBadge } from "../tasks/StatusBadge";

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export function StatusBreakdown({ summary }: { summary: DashboardSummary }) {
  const formatHours = (minutes: number) => {
    const hours = minutes / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
  };

  return (
    <section className="panel stack">
      <div className="section-header">
        <div>
          <h2>Status and automation</h2>
          <p>Live execution, recurring work, and planned effort.</p>
        </div>
      </div>
      {statuses.map((status) => (
        <div className="metric-row" key={status}>
          <StatusBadge status={status} />
          <strong>{summary.statusTotals[status]}</strong>
        </div>
      ))}
      <div className="metric-row"><span>Planned effort</span><strong>{formatHours(summary.estimatedMinutesTotal)}</strong></div>
      <div className="metric-row"><span>Tracked effort</span><strong>{formatHours(summary.trackedMinutesTotal)}</strong></div>
      <div className="metric-row"><span>Overdue</span><strong>{summary.overdueTasks}</strong></div>
    </section>
  );
}
