import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { ProjectProgressList } from "../components/dashboard/ProjectProgressList";
import { StatusBreakdown } from "../components/dashboard/StatusBreakdown";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { LoadingState } from "../components/ui/LoadingState";

export function DashboardPage() {
  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  if (dashboardQuery.isLoading) return <LoadingState label="Loading dashboard" />;
  if (dashboardQuery.error || !dashboardQuery.data) return <ErrorAlert message="Dashboard could not be loaded" />;

  const summary = dashboardQuery.data;

  return (
    <div className="page stack">
      <div className="page-header"><div><h1>Dashboard</h1><p>{summary.totalTasks} tasks across {summary.projectCount} projects</p></div></div>
      <SummaryCards summary={summary} />
      {summary.totalTasks === 0 ? <EmptyState title="No dashboard data yet" /> : null}
      <div className="dashboard-grid">
        <StatusBreakdown summary={summary} />
        <ProjectProgressList summary={summary} />
      </div>
    </div>
  );
}
