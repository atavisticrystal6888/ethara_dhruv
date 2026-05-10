import type { DashboardSummary } from "../../api/client";

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

export function WorkloadReport({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="panel stack">
      <div className="section-header">
        <div>
          <h2>Workload report</h2>
          <p>Tracked time and completions for direct task owners.</p>
        </div>
      </div>
      {summary.memberWorkload.length === 0 ? <p className="muted-copy">No tracked work yet.</p> : null}
      {summary.memberWorkload.map((member) => (
        <div className="workload-row" key={member.userId}>
          <div>
            <strong>{member.name}</strong>
            <small>{member.completedTasks} completed · {member.assignedTasks} assigned</small>
          </div>
          <b>{formatHours(member.trackedMinutes)}</b>
        </div>
      ))}
    </section>
  );
}