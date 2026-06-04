export type ProjectWorkspaceTab = "SUMMARY" | "BOARD" | "BACKLOG" | "TEAM";

const tabs: Array<{ id: ProjectWorkspaceTab; label: string; meta: string }> = [
  { id: "SUMMARY", label: "Summary", meta: "Signals and upcoming work" },
  { id: "BOARD", label: "Board", meta: "Issue views and filters" },
  { id: "BACKLOG", label: "Backlog", meta: "Sprint planning and ordering" },
  { id: "TEAM", label: "Team", meta: "People and permissions" }
];

export function ProjectTabs({
  activeTab,
  onChange,
  taskCount,
  backlogCount,
  memberCount
}: {
  activeTab: ProjectWorkspaceTab;
  onChange: (tab: ProjectWorkspaceTab) => void;
  taskCount: number;
  backlogCount: number;
  memberCount: number;
}) {
  return (
    <div className="project-tabs" role="tablist" aria-label="Project workspace tabs">
      {tabs.map((tab) => {
        const countLabel = tab.id === "BOARD"
          ? `${taskCount} issues`
          : tab.id === "BACKLOG"
            ? `${backlogCount} unscheduled`
          : tab.id === "TEAM"
            ? `${memberCount} members`
            : "Delivery overview";

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`project-tab ${activeTab === tab.id ? "project-tab-active" : ""}`.trim()}
            onClick={() => onChange(tab.id)}
          >
            <strong>{tab.label}</strong>
            <small>{tab.meta}</small>
            <small>{countLabel}</small>
          </button>
        );
      })}
    </div>
  );
}