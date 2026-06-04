import type { DashboardSummary } from "../../api/client";
import { Link } from "react-router-dom";

export function ProjectProgressList({ summary }: { summary: DashboardSummary }) {
  const formatHours = (minutes: number) => {
    const hours = minutes / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
  };

  const projects = [...summary.projectSummaries].sort((left, right) => right.overdueTasks - left.overdueTasks || right.totalTasks - left.totalTasks);

  return (
    <section className="panel stack">
      <div className="section-header">
        <div>
          <h2>Projects needing attention</h2>
          <p>Overdue work and progress drift, ordered so triage starts where risk is highest.</p>
        </div>
      </div>
      {projects.map((project) => (
        <div className="progress-row" key={project.projectId}>
          <div>
            <strong>{project.projectName}</strong>
            <small>{project.totalTasks} tasks · {project.overdueTasks} overdue · {project.recurringTaskCount} recurring</small>
          </div>
          <div className="progress-track"><span style={{ width: `${project.progressPercent}%` }} /></div>
          <div className="progress-meta"><b>{project.progressPercent}%</b><small>{formatHours(project.trackedMinutes)} / {formatHours(project.estimatedMinutes)}</small></div>
          <Link className="project-card-link" to={`/projects/${project.projectId}`}>Open board</Link>
        </div>
      ))}
    </section>
  );
}
