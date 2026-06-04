import type { DashboardSummary } from "../../api/client";

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

export function WorkloadReport({ summary, currentUserName }: { summary: DashboardSummary; currentUserName: string }) {
  const rows = [...summary.memberWorkload].sort((left, right) => right.assignedTasks - left.assignedTasks || right.trackedMinutes - left.trackedMinutes);

  return (
    <section className="panel stack">
      <div className="section-header">
        <div>
          <h2>Team coverage</h2>
          <p>{currentUserName} can compare personal queue size against the rest of the team and spot overloaded contributors.</p>
        </div>
      </div>
      {rows.length === 0 ? <p className="muted-copy">No tracked work yet.</p> : null}
      {rows.map((member) => (
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