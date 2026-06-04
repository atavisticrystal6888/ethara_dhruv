import { Search } from "lucide-react";
import type { Membership, Sprint, TaskIssueType, TaskPriority, TaskStatus } from "../../api/client";
import { Button } from "../ui/Button";

type ViewMode = "LIST" | "BOARD" | "TIMELINE" | "CALENDAR";

const viewModes: ViewMode[] = ["BOARD", "LIST", "TIMELINE", "CALENDAR"];
const issueTypes: Array<TaskIssueType | "ALL"> = ["ALL", "EPIC", "STORY", "TASK", "BUG"];
const priorities: Array<TaskPriority | "ALL"> = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function BoardToolbar({
  members,
  sprints,
  view,
  onViewChange,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  issueTypeFilter,
  onIssueTypeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sprintFilter,
  onSprintFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  overdueOnly,
  onOverdueOnlyChange,
  visibleCount,
  totalCount,
  canCreate,
  showCreate,
  onCreateToggle
}: {
  members: Membership[];
  sprints: Sprint[];
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: TaskStatus | "ALL";
  onStatusFilterChange: (value: TaskStatus | "ALL") => void;
  issueTypeFilter: TaskIssueType | "ALL";
  onIssueTypeFilterChange: (value: TaskIssueType | "ALL") => void;
  priorityFilter: TaskPriority | "ALL";
  onPriorityFilterChange: (value: TaskPriority | "ALL") => void;
  sprintFilter: string;
  onSprintFilterChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  overdueOnly: boolean;
  onOverdueOnlyChange: (value: boolean) => void;
  visibleCount: number;
  totalCount: number;
  canCreate: boolean;
  showCreate: boolean;
  onCreateToggle: () => void;
}) {
  return (
    <section className="panel stack board-toolbar">
      <div className="board-toolbar-head">
        <div>
          <div className="eyebrow">Workspace board</div>
          <h2>Filter, triage, and switch views without leaving the project context.</h2>
          <p className="muted-copy">Showing {visibleCount} of {totalCount} issues in the current workspace lens.</p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={onCreateToggle}>
            {showCreate ? "Hide create" : "Create issue"}
          </Button>
        ) : null}
      </div>

      <div className="board-toolbar-grid">
        <label className="toolbar-field toolbar-search">
          <span>Search</span>
          <Search size={16} />
          <input
            className="input"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search title, description, assignee, or delegation"
          />
        </label>

        <label className="toolbar-field">
          <span>Status</span>
          <select className="input" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as TaskStatus | "ALL")}>
            <option value="ALL">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </label>

        <label className="toolbar-field">
          <span>Issue type</span>
          <select className="input" value={issueTypeFilter} onChange={(event) => onIssueTypeFilterChange(event.target.value as TaskIssueType | "ALL")}>
            {issueTypes.map((value) => <option key={value} value={value}>{value === "ALL" ? "All issue types" : value}</option>)}
          </select>
        </label>

        <label className="toolbar-field">
          <span>Priority</span>
          <select className="input" value={priorityFilter} onChange={(event) => onPriorityFilterChange(event.target.value as TaskPriority | "ALL")}>
            {priorities.map((value) => <option key={value} value={value}>{value === "ALL" ? "All priorities" : value}</option>)}
          </select>
        </label>

        <label className="toolbar-field">
          <span>Sprint</span>
          <select className="input" value={sprintFilter} onChange={(event) => onSprintFilterChange(event.target.value)}>
            <option value="ALL">All planning lanes</option>
            <option value="BACKLOG">Backlog only</option>
            {sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
          </select>
        </label>

        <label className="toolbar-field">
          <span>Assignee</span>
          <select className="input" value={assigneeFilter} onChange={(event) => onAssigneeFilterChange(event.target.value)}>
            <option value="ALL">All owners</option>
            <option value="ROLE">Role delegated</option>
            {members.map((membership) => (
              <option key={membership.id} value={membership.user.id}>{membership.user.name}</option>
            ))}
          </select>
        </label>

        <div className="toolbar-field">
          <span>Scope</span>
          <label className="toolbar-toggle">
            <input type="checkbox" checked={overdueOnly} onChange={(event) => onOverdueOnlyChange(event.target.checked)} />
            <span>Overdue only</span>
          </label>
        </div>
      </div>

      <div className="view-switcher">
        {viewModes.map((mode) => (
          <button
            key={mode}
            type="button"
            className={`button button-secondary view-tab ${view === mode ? "view-tab-active" : ""}`.trim()}
            onClick={() => onViewChange(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
    </section>
  );
}