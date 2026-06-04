import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ProjectProgressList } from "../components/dashboard/ProjectProgressList";
import { StatusBreakdown } from "../components/dashboard/StatusBreakdown";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { WorkloadReport } from "../components/dashboard/WorkloadReport";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../state/auth";

export function DashboardPage() {
  const { user } = useAuth();
  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  if (dashboardQuery.isLoading) return <LoadingState label="Loading dashboard" />;
  if (dashboardQuery.error || !dashboardQuery.data) return <ErrorAlert message="Dashboard could not be loaded" />;

  const summary = dashboardQuery.data;
  const trackedHours = (summary.trackedMinutesTotal / 60).toFixed(summary.trackedMinutesTotal % 60 === 0 ? 0 : 1);

  return (
    <div className="page stack dashboard-page">
      <section className="panel page-hero">
        <div>
          <div className="eyebrow">Daily flow</div>
          <h1>Dashboard</h1>
          <p>Start with your queue, scan the projects that need a decision, and move straight into execution.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/your-work">Open your work</Link>
            <Link className="button button-secondary" to="/projects">Browse projects</Link>
          </div>
        </div>
        <div className="hero-metrics">
          <div className="hero-stat"><span>Overdue</span><strong>{summary.overdueTasks}</strong></div>
          <div className="hero-stat"><span>Assigned to you</span><strong>{summary.assignedTasks}</strong></div>
          <div className="hero-stat"><span>Tracked</span><strong>{trackedHours}h</strong></div>
        </div>
      </section>
      <SummaryCards summary={summary} />
      {summary.totalTasks === 0 ? <EmptyState title="No dashboard data yet" /> : null}
      <div className="dashboard-grid">
        <ProjectProgressList summary={summary} />
        <StatusBreakdown summary={summary} />
      </div>
      <WorkloadReport summary={summary} currentUserName={user?.name ?? "You"} />
    </div>
  );
}
