import type { DashboardSummary } from "../../api/client";

export function ProjectProgressList({ summary }: { summary: DashboardSummary }) {
  const formatHours = (minutes: number) => {
    const hours = minutes / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
  };

  return (
    <section className="panel stack">
      <div className="section-header">
        <div>
          <h2>Project pulse</h2>
          <p>Progress, workload, and automation by workspace.</p>
        </div>
      </div>
      {summary.projectSummaries.map((project) => (
        <div className="progress-row" key={project.projectId}>
          <div>
            <strong>{project.projectName}</strong>
            <small>{project.totalTasks} tasks · {project.overdueTasks} overdue · {project.recurringTaskCount} recurring</small>
          </div>
          <div className="progress-track"><span style={{ width: `${project.progressPercent}%` }} /></div>
          <div className="progress-meta"><b>{project.progressPercent}%</b><small>{formatHours(project.trackedMinutes)} / {formatHours(project.estimatedMinutes)}</small></div>
        </div>
      ))}
    </section>
  );
}
