import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { ProjectProgressList } from "../components/dashboard/ProjectProgressList";
import { StatusBreakdown } from "../components/dashboard/StatusBreakdown";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { WorkloadReport } from "../components/dashboard/WorkloadReport";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { LoadingState } from "../components/ui/LoadingState";

export function DashboardPage() {
  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  if (dashboardQuery.isLoading) return <LoadingState label="Loading dashboard" />;
  if (dashboardQuery.error || !dashboardQuery.data) return <ErrorAlert message="Dashboard could not be loaded" />;

  const summary = dashboardQuery.data;
  const trackedHours = (summary.trackedMinutesTotal / 60).toFixed(summary.trackedMinutesTotal % 60 === 0 ? 0 : 1);

  return (
    <div className="page stack dashboard-page">
      <section className="panel page-hero">
        <div>
          <div className="eyebrow">Delivery cockpit</div>
          <h1>Dashboard</h1>
          <p>Monitor workload, recurring automation, and execution time across every active workspace.</p>
        </div>
        <div className="hero-metrics">
          <div className="hero-stat"><span>Completion</span><strong>{summary.completionRate}%</strong></div>
          <div className="hero-stat"><span>Tracked</span><strong>{trackedHours}h</strong></div>
          <div className="hero-stat"><span>Assigned to you</span><strong>{summary.assignedTasks}</strong></div>
        </div>
      </section>
      <SummaryCards summary={summary} />
      {summary.totalTasks === 0 ? <EmptyState title="No dashboard data yet" /> : null}
      <div className="dashboard-grid">
        <StatusBreakdown summary={summary} />
        <ProjectProgressList summary={summary} />
      </div>
      <WorkloadReport summary={summary} />
    </div>
  );
}
