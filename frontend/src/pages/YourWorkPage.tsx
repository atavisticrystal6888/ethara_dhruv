import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Project, type Task } from "../api/client";
import { IssueTypeBadge } from "../components/tasks/IssueTypeBadge";
import { PriorityBadge } from "../components/tasks/PriorityBadge";
import { StatusBadge } from "../components/tasks/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../state/auth";

type PersonalTask = Task & {
  projectName: string;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

function collectPersonalTasks(projects: Project[], userId: string) {
  return projects.flatMap((project) => {
    const membership = project.members.find((member) => member.user.id === userId);
    const delegatedRole = membership?.role ?? null;

    return project.tasks
      .filter((task) => task.assignee?.id === userId || (delegatedRole && task.assignmentType === "ROLE" && task.assigneeRole === delegatedRole))
      .map((task) => ({ ...task, projectName: project.name } satisfies PersonalTask));
  });
}

export function YourWorkPage() {
  const { user } = useAuth();
  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const projectQueries = useQueries({
    queries: (projectsQuery.data ?? []).map((project) => ({
      queryKey: ["project", project.id, "your-work"],
      queryFn: () => api.getProject(project.id),
      enabled: Boolean(user)
    }))
  });

  const loadingProjects = projectQueries.some((query) => query.isLoading);
  const projectError = projectQueries.find((query) => query.error)?.error;

  if (projectsQuery.isLoading || loadingProjects) return <LoadingState label="Loading your work" />;
  if (projectsQuery.error || projectError || !user) return <ErrorAlert message="Your work surface could not be loaded" />;

  const detailedProjects = projectQueries.flatMap((query) => query.data ? [query.data] : []);
  const tasks = collectPersonalTasks(detailedProjects, user.id);
  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const overdueTasks = openTasks.filter((task) => task.isOverdue);
  const activeTimers = tasks.filter((task) => Boolean(task.timerStartedAt));
  const delegatedTasks = openTasks.filter((task) => task.assignmentType === "ROLE");
  const nextUp = [...openTasks].sort((left, right) => Number(right.isOverdue) - Number(left.isOverdue) || left.dueDate.localeCompare(right.dueDate));

  return (
    <div className="page stack your-work-page">
      <section className="panel page-hero">
        <div>
          <div className="eyebrow">Personal queue</div>
          <h1>Your work</h1>
          <p>Track the work that is explicitly yours, the role-delegated issues waiting on you, and timers that are still active.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/projects">Open project boards</Link>
            <Link className="button button-secondary" to="/dashboard">Back to dashboard</Link>
          </div>
        </div>
        <div className="hero-metrics">
          <div className="hero-stat"><span>Open</span><strong>{openTasks.length}</strong></div>
          <div className="hero-stat"><span>Overdue</span><strong>{overdueTasks.length}</strong></div>
          <div className="hero-stat"><span>Timers</span><strong>{activeTimers.length}</strong></div>
        </div>
      </section>

      {tasks.length === 0 ? <EmptyState title="No assigned work yet" /> : null}

      <div className="dashboard-grid">
        <section className="panel stack">
          <div className="section-header">
            <div>
              <h2>Next up</h2>
              <p>Ordered by urgency so overdue work and the closest due dates rise first.</p>
            </div>
          </div>
          <div className="detail-list">
            {nextUp.slice(0, 8).map((task) => (
              <article className="work-focus-row" key={`${task.projectId}-${task.id}`}>
                <div className="work-focus-copy">
                  <strong>{task.title}</strong>
                  <p>{task.projectName} · Due {formatDate(task.dueDate)}</p>
                </div>
                <div className="task-card-badges">
                  <IssueTypeBadge issueType={task.issueType} />
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} overdue={task.isOverdue} />
                </div>
                <div className="task-meta-row compact-meta">
                  <span>{task.assignmentLabel}</span>
                  <span>{formatHours(task.trackedMinutes)} tracked</span>
                </div>
                <Link className="project-card-link" to={`/projects/${task.projectId}`}>Open board</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="section-header">
            <div>
              <h2>Delegated and live work</h2>
              <p>Role-delegated issues and timers that still need a stop or handoff.</p>
            </div>
          </div>

          <div className="detail-list">
            <div className="detail-meta-item">
              <span>Role-delegated issues</span>
              <strong>{delegatedTasks.length}</strong>
            </div>
            <div className="detail-meta-item">
              <span>Active timers</span>
              <strong>{activeTimers.length}</strong>
            </div>
          </div>

          {activeTimers.length > 0 ? (
            <div className="detail-list">
              {activeTimers.map((task) => (
                <div className="activity-row" key={`timer-${task.id}`}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.projectName} · timer running</p>
                  </div>
                  <Link className="project-card-link" to={`/projects/${task.projectId}`}>Resume</Link>
                </div>
              ))}
            </div>
          ) : <p className="muted-copy">No active timers right now.</p>}
        </section>
      </div>
    </div>
  );
}