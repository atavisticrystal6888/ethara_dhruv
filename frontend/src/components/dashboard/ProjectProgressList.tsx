import type { DashboardSummary } from "../../api/client";

export function ProjectProgressList({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="panel stack">
      <h2>Progress</h2>
      {summary.projectSummaries.map((project) => (
        <div className="progress-row" key={project.projectId}>
          <div><strong>{project.projectName}</strong><small>{project.totalTasks} tasks · {project.overdueTasks} overdue</small></div>
          <div className="progress-track"><span style={{ width: `${project.progressPercent}%` }} /></div>
          <b>{project.progressPercent}%</b>
        </div>
      ))}
    </section>
  );
}
