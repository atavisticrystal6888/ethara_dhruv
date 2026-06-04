import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Membership, Sprint, TaskDetail, TaskIssueType, TaskPriority } from "../../src/api/client";
import { ProjectTabs } from "../../src/components/layout/ProjectTabs";
import { BacklogView } from "../../src/components/tasks/BacklogView";
import { BoardToolbar } from "../../src/components/tasks/BoardToolbar";
import { TaskDetailPanel } from "../../src/components/tasks/TaskDetailPanel";
import { TaskBoardView } from "../../src/components/tasks/TaskViews";

function ControlledBoardToolbar({
  onViewChange,
  onSearchQueryChange,
  onStatusFilterChange,
  onIssueTypeFilterChange,
  onPriorityFilterChange,
  onSprintFilterChange,
  onAssigneeFilterChange,
  onOverdueOnlyChange,
  onCreateToggle
}: {
  onViewChange: ReturnType<typeof vi.fn>;
  onSearchQueryChange: ReturnType<typeof vi.fn>;
  onStatusFilterChange: ReturnType<typeof vi.fn>;
  onIssueTypeFilterChange: ReturnType<typeof vi.fn>;
  onPriorityFilterChange: ReturnType<typeof vi.fn>;
  onSprintFilterChange: ReturnType<typeof vi.fn>;
  onAssigneeFilterChange: ReturnType<typeof vi.fn>;
  onOverdueOnlyChange: ReturnType<typeof vi.fn>;
  onCreateToggle: ReturnType<typeof vi.fn>;
}) {
  const [view, setView] = useState<"BOARD" | "LIST" | "TIMELINE" | "CALENDAR">("BOARD");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "TODO" | "IN_PROGRESS" | "DONE">("ALL");
  const [issueTypeFilter, setIssueTypeFilter] = useState<TaskIssueType | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">("ALL");
  const [sprintFilter, setSprintFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <BoardToolbar
      members={members}
      sprints={sprints}
      view={view}
      onViewChange={(value) => {
        setView(value);
        onViewChange(value);
      }}
      searchQuery={searchQuery}
      onSearchQueryChange={(value) => {
        setSearchQuery(value);
        onSearchQueryChange(value);
      }}
      statusFilter={statusFilter}
      onStatusFilterChange={(value) => {
        setStatusFilter(value);
        onStatusFilterChange(value);
      }}
      issueTypeFilter={issueTypeFilter}
      onIssueTypeFilterChange={(value) => {
        setIssueTypeFilter(value);
        onIssueTypeFilterChange(value);
      }}
      priorityFilter={priorityFilter}
      onPriorityFilterChange={(value) => {
        setPriorityFilter(value);
        onPriorityFilterChange(value);
      }}
      sprintFilter={sprintFilter}
      onSprintFilterChange={(value) => {
        setSprintFilter(value);
        onSprintFilterChange(value);
      }}
      assigneeFilter={assigneeFilter}
      onAssigneeFilterChange={(value) => {
        setAssigneeFilter(value);
        onAssigneeFilterChange(value);
      }}
      overdueOnly={overdueOnly}
      onOverdueOnlyChange={(value) => {
        setOverdueOnly(value);
        onOverdueOnlyChange(value);
      }}
      visibleCount={4}
      totalCount={8}
      canCreate
      showCreate={showCreate}
      onCreateToggle={() => {
        setShowCreate((current) => !current);
        onCreateToggle();
      }}
    />
  );
}

const members: Membership[] = [
  {
    id: "membership-1",
    projectId: "project-1",
    role: "OWNER",
    createdAt: "2026-06-01T00:00:00.000Z",
    user: {
      id: "user-1",
      name: "Avery",
      email: "avery@example.com",
      role: "ADMIN",
      createdAt: "2026-06-01T00:00:00.000Z"
    }
  },
  {
    id: "membership-2",
    projectId: "project-1",
    role: "MEMBER",
    createdAt: "2026-06-01T00:00:00.000Z",
    user: {
      id: "user-2",
      name: "Maya",
      email: "maya@example.com",
      role: "MEMBER",
      createdAt: "2026-06-01T00:00:00.000Z"
    }
  }
];

const sprints: Sprint[] = [
  {
    id: "sprint-1",
    projectId: "project-1",
    name: "Sprint 12",
    goal: "Stabilize the release candidate",
    status: "ACTIVE",
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-14T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  }
];

const taskDetail: TaskDetail = {
  id: "task-1",
  projectId: "project-1",
  title: "Refine sprint planning",
  description: "Tighten backlog ordering and draft the sprint goal.",
  status: "IN_PROGRESS",
  issueType: "STORY",
  priority: "HIGH",
  assignmentType: "USER",
  assignee: members[0].user,
  assigneeRole: null,
  assignmentLabel: members[0].user.name,
  createdBy: members[1].user,
  dueDate: "2026-06-10",
  sprintId: "sprint-1",
  storyPoints: 5,
  labels: ["planning", "ux"],
  sortOrder: 1,
  estimatedMinutes: 240,
  trackedMinutes: 90,
  timerStartedAt: null,
  timerUserId: null,
  recurrencePattern: "NONE",
  recurrenceParentTaskId: null,
  isOverdue: false,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  comments: [
    {
      id: "comment-1",
      taskId: "task-1",
      body: "Need final sign-off from QA.",
      author: members[1].user,
      createdAt: "2026-06-02T08:00:00.000Z",
      updatedAt: "2026-06-02T08:00:00.000Z"
    }
  ],
  activity: [
    {
      id: "activity-1",
      taskId: "task-1",
      actor: members[0].user,
      type: "UPDATED",
      message: "Updated issue details",
      createdAt: "2026-06-02T09:15:00.000Z"
    }
  ]
};

const backlogTasks = [
  {
    ...taskDetail,
    id: "task-backlog-1",
    sprintId: null,
    title: "Refine board toolbar",
    sortOrder: 1,
    comments: [],
    activity: []
  },
  {
    ...taskDetail,
    id: "task-backlog-2",
    sprintId: null,
    title: "Add sprint creation",
    sortOrder: 2,
    comments: [],
    activity: []
  }
];

const boardTasks = [
  {
    ...taskDetail,
    id: "task-board-1",
    status: "TODO" as const,
    title: "Refine board ordering",
    sortOrder: 1,
    comments: [],
    activity: []
  },
  {
    ...taskDetail,
    id: "task-board-2",
    status: "TODO" as const,
    title: "Polish backlog handoff",
    sortOrder: 2,
    comments: [],
    activity: []
  },
  {
    ...taskDetail,
    id: "task-board-3",
    status: "IN_PROGRESS" as const,
    title: "Review sprint scope",
    sortOrder: 3,
    comments: [],
    activity: []
  }
];

describe("project workspace surfaces", () => {
  it("switches project tabs", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ProjectTabs activeTab="SUMMARY" onChange={onChange} taskCount={12} backlogCount={4} memberCount={2} />);

    await user.click(screen.getByRole("tab", { name: /board/i }));

    expect(onChange).toHaveBeenCalledWith("BOARD");
    expect(screen.getByRole("tab", { name: /summary/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/4 unscheduled/i)).toBeInTheDocument();
  });

  it("updates board filters and toggles create state", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const onSearchQueryChange = vi.fn();
    const onStatusFilterChange = vi.fn();
    const onIssueTypeFilterChange = vi.fn();
    const onPriorityFilterChange = vi.fn();
    const onSprintFilterChange = vi.fn();
    const onAssigneeFilterChange = vi.fn();
    const onOverdueOnlyChange = vi.fn();
    const onCreateToggle = vi.fn();

    render(
      <ControlledBoardToolbar
        onViewChange={onViewChange}
        onSearchQueryChange={onSearchQueryChange}
        onStatusFilterChange={onStatusFilterChange}
        onIssueTypeFilterChange={onIssueTypeFilterChange}
        onPriorityFilterChange={onPriorityFilterChange}
        onSprintFilterChange={onSprintFilterChange}
        onAssigneeFilterChange={onAssigneeFilterChange}
        onOverdueOnlyChange={onOverdueOnlyChange}
        onCreateToggle={onCreateToggle}
      />
    );

    await user.type(screen.getByPlaceholderText(/search title, description, assignee, or delegation/i), "bug");
    await user.selectOptions(screen.getByLabelText(/status/i), "IN_PROGRESS");
    await user.selectOptions(screen.getByLabelText(/issue type/i), "BUG");
    await user.selectOptions(screen.getByLabelText(/priority/i), "HIGH");
    await user.selectOptions(screen.getByLabelText(/sprint/i), "sprint-1");
    await user.selectOptions(screen.getByLabelText(/assignee/i), "user-2");
    await user.click(screen.getByLabelText(/overdue only/i));
    await user.click(screen.getByRole("button", { name: /list/i }));
    await user.click(screen.getByRole("button", { name: /create issue/i }));

    expect(onSearchQueryChange).toHaveBeenLastCalledWith("bug");
    expect(onStatusFilterChange).toHaveBeenCalledWith("IN_PROGRESS");
    expect(onIssueTypeFilterChange).toHaveBeenCalledWith("BUG");
    expect(onPriorityFilterChange).toHaveBeenCalledWith("HIGH");
    expect(onSprintFilterChange).toHaveBeenCalledWith("sprint-1");
    expect(onAssigneeFilterChange).toHaveBeenCalledWith("user-2");
    expect(onOverdueOnlyChange).toHaveBeenCalledWith(true);
    expect(onViewChange).toHaveBeenCalledWith("LIST");
    expect(onCreateToggle).toHaveBeenCalled();
  });

  it("renders task collaboration details and posts a comment", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCommentSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskDetailPanel
        task={taskDetail}
        isLoading={false}
        error={false}
        pendingComment={false}
        onClose={onClose}
        onCommentSubmit={onCommentSubmit}
      />
    );

    expect(screen.getByText(/need final sign-off from qa/i)).toBeInTheDocument();
    expect(screen.getByText(/updated issue details/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/add comment/i), "Blocked on final review");
    await user.click(screen.getByRole("button", { name: /post comment/i }));

    expect(onCommentSubmit).toHaveBeenCalledWith("task-1", "Blocked on final review");
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("triggers backlog ordering controls", async () => {
    const user = userEvent.setup();
    const onMoveTask = vi.fn().mockResolvedValue(undefined);
    const onAssignTask = vi.fn().mockResolvedValue(undefined);
    const onCreateSprint = vi.fn().mockResolvedValue(undefined);
    const onSprintStatusChange = vi.fn().mockResolvedValue(undefined);

    render(
      <BacklogView
        tasks={backlogTasks}
        sprints={sprints}
        canManage
        pending={false}
        onMoveTask={onMoveTask}
        onAssignTask={onAssignTask}
        onCreateSprint={onCreateSprint}
        onSprintStatusChange={onSprintStatusChange}
      />
    );

    const moveDownButtons = screen.getAllByRole("button", { name: /move down/i });
    await user.click(moveDownButtons[0]);

    expect(onMoveTask).toHaveBeenCalledWith("task-backlog-1", null, "down");
  });

  it("triggers board ordering controls", async () => {
    const user = userEvent.setup();
    const onMoveTask = vi.fn().mockResolvedValue(undefined);
    const onMoveAcrossColumns = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskBoardView
        tasks={boardTasks}
        canManage
        pending={false}
        onMoveTask={onMoveTask}
        onMoveAcrossColumns={onMoveAcrossColumns}
      />
    );

    const todoColumn = screen.getByRole("heading", { name: /to do/i }).closest("section");
    expect(todoColumn).not.toBeNull();

    if (!todoColumn) {
      throw new Error("Board column not rendered");
    }

    await user.click(within(todoColumn).getAllByRole("button", { name: /move down/i })[0]);
    await user.click(within(todoColumn).getAllByRole("button", { name: /move right/i })[0]);

    expect(onMoveTask).toHaveBeenCalledWith("task-board-1", "TODO", "down");
    expect(onMoveAcrossColumns).toHaveBeenCalledWith("task-board-1", "right");
  });
});