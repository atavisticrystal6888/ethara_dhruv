import { Activity, FolderKanban, Gauge, RefreshCcw, TimerReset, ListTodo } from "lucide-react";
import type { DashboardSummary } from "../../api/client";

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const formatHours = (minutes: number) => {
    const hours = minutes / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
  };

  const cards = [
    { label: "My queue", value: summary.assignedTasks, hint: "assigned to you", icon: ListTodo },
    { label: "Overdue", value: summary.overdueTasks, hint: "needs attention", icon: Activity },
    { label: "Completion", value: `${summary.completionRate}%`, hint: "done rate", icon: Gauge },
    { label: "Tracked", value: formatHours(summary.trackedMinutesTotal), hint: "logged effort", icon: TimerReset },
    { label: "Projects", value: summary.projectCount, hint: "active workspaces", icon: FolderKanban },
    { label: "Recurring", value: summary.recurringTaskCount, hint: "automation enabled", icon: RefreshCcw }
  ];

  return (
    <div className="summary-grid">
      {cards.map((card) => (
        <div className="summary-card" key={card.label}>
          <card.icon size={18} />
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.hint}</small>
        </div>
      ))}
    </div>
  );
}
