import type { DashboardSummary } from "../../api/client";

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const cards = [
    ["Projects", summary.projectCount],
    ["Tasks", summary.totalTasks],
    ["Assigned", summary.assignedTasks],
    ["Overdue", summary.overdueTasks]
  ];

  return <div className="summary-grid">{cards.map(([label, value]) => <div className="summary-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}
