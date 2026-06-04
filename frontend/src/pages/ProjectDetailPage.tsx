import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { ProjectTabs, type ProjectWorkspaceTab } from "../components/layout/ProjectTabs";
import { api, type ProjectRole, type Task, type TaskIssueType, type TaskPriority, type TaskStatus, type User } from "../api/client";
import { BacklogView } from "../components/tasks/BacklogView";
import { BoardToolbar } from "../components/tasks/BoardToolbar";
import { MembersPanel } from "../components/projects/MembersPanel";
import { StatusBadge } from "../components/tasks/StatusBadge";
import { TaskDetailPanel } from "../components/tasks/TaskDetailPanel";
import { TaskForm } from "../components/tasks/TaskForm";
import { TaskList } from "../components/tasks/TaskList";
import { TaskBoardView, TaskCalendarView, TaskTimelineView } from "../components/tasks/TaskViews";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../state/auth";

type ViewMode = "LIST" | "BOARD" | "TIMELINE" | "CALENDAR";

const boardColumns: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function orderedTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
}

export function ProjectDetailPage() {
  const { projectId = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ProjectWorkspaceTab>("BOARD");
  const [view, setView] = useState<ViewMode>("BOARD");
  const [showTaskComposer, setShowTaskComposer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [issueTypeFilter, setIssueTypeFilter] = useState<TaskIssueType | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">("ALL");
  const [sprintFilter, setSprintFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => api.getProject(projectId), enabled: Boolean(projectId) });
  const taskDetailQuery = useQuery({
    queryKey: ["task", projectId, selectedTaskId],
    queryFn: () => api.getTask(projectId, selectedTaskId ?? ""),
    enabled: Boolean(projectId && selectedTaskId)
  });
  const refreshProject = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
    queryClient.invalidateQueries({ queryKey: ["projects"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  ]);
  const addMember = useMutation({ mutationFn: ({ selectedUser, role }: { selectedUser: User; role: ProjectRole }) => api.addMembership(projectId, selectedUser.id, role), onSuccess: refreshProject });
  const updateMember = useMutation({ mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) => api.updateMembership(projectId, userId, role), onSuccess: refreshProject });
  const removeMember = useMutation({ mutationFn: (userId: string) => api.removeMembership(projectId, userId), onSuccess: refreshProject });
  const createTask = useMutation({
    mutationFn: (input: Parameters<typeof api.createTask>[1]) => api.createTask(projectId, input),
    onSuccess: async () => {
      setShowTaskComposer(false);
      await refreshProject();
    }
  });
  const updateTask = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Parameters<typeof api.updateTask>[2] }) => api.updateTask(projectId, taskId, payload),
    onSuccess: async () => {
      await refreshProject();
      if (selectedTaskId) {
        await queryClient.invalidateQueries({ queryKey: ["task", projectId, selectedTaskId] });
      }
    }
  });
  const planTasks = useMutation({
    mutationFn: async (changes: Array<{ taskId: string; payload: Parameters<typeof api.updateTask>[2] }>) => {
      for (const change of changes) {
        await api.updateTask(projectId, change.taskId, change.payload);
      }
    },
    onSuccess: async () => {
      await refreshProject();
      if (selectedTaskId) {
        await queryClient.invalidateQueries({ queryKey: ["task", projectId, selectedTaskId] });
      }
    }
  });
  const createSprint = useMutation({ mutationFn: (input: Parameters<typeof api.createSprint>[1]) => api.createSprint(projectId, input), onSuccess: refreshProject });
  const updateSprint = useMutation({ mutationFn: ({ sprintId, payload }: { sprintId: string; payload: Parameters<typeof api.updateSprint>[2] }) => api.updateSprint(projectId, sprintId, payload), onSuccess: refreshProject });
  const deleteTask = useMutation({
    mutationFn: (taskId: string) => api.deleteTask(projectId, taskId),
    onSuccess: async (_, taskId) => {
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
      await refreshProject();
    }
  });
  const addTaskComment = useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: string }) => api.addTaskComment(projectId, taskId, { body }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["task", projectId, variables.taskId] });
    }
  });

  if (projectQuery.isLoading) return <LoadingState label="Loading project" />;
  if (projectQuery.error || !projectQuery.data) return <ErrorAlert message="Project could not be loaded" />;

  const project = projectQuery.data;
  const currentMembership = project.members.find((membership) => membership.user.id === user?.id);
  const currentProjectRole = currentMembership?.role ?? null;
  const canManageProject = user?.role === "ADMIN" || currentProjectRole === "OWNER" || currentProjectRole === "MANAGER";
  const canCreateTask = Boolean(user?.role === "ADMIN" || currentMembership);
  const trackedMinutes = project.tasks.reduce((total, task) => total + task.trackedMinutes, 0);
  const estimatedMinutes = project.tasks.reduce((total, task) => total + task.estimatedMinutes, 0);
  const recurringTasks = project.tasks.filter((task) => task.recurrencePattern !== "NONE").length;
  const backlogCount = project.tasks.filter((task) => task.sprintId === null).length;
  const activeSprint = project.sprints.find((sprint) => sprint.status === "ACTIVE") ?? null;
  const focusTasks = [...project.tasks]
    .filter((task) => task.status !== "DONE")
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 5);

  const filteredTasks = project.tasks.filter((task) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesText = normalizedQuery.length === 0 || [
      task.title,
      task.description ?? "",
      task.assignmentLabel,
      task.assignee?.name ?? ""
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesIssueType = issueTypeFilter === "ALL" || task.issueType === issueTypeFilter;
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
    const matchesSprint = sprintFilter === "ALL" || (sprintFilter === "BACKLOG" ? task.sprintId === null : task.sprintId === sprintFilter);
    const matchesAssignee = assigneeFilter === "ALL"
      || (assigneeFilter === "ROLE" ? task.assignmentType === "ROLE" : task.assignee?.id === assigneeFilter);
    const matchesOverdue = !overdueOnly || task.isOverdue;

    return matchesText && matchesStatus && matchesIssueType && matchesPriority && matchesSprint && matchesAssignee && matchesOverdue;
  });

  const formatHours = (minutes: number) => {
    const hours = minutes / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
  };

  const formatShortDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const orderedLaneTasks = (sprintId: string | null) => orderedTasks(project.tasks.filter((task) => task.sprintId === sprintId));

  const orderedBoardTasks = (status: TaskStatus) => orderedTasks(project.tasks.filter((task) => task.status === status));

  const moveTaskInPlanningLane = async (taskId: string, sprintId: string | null, direction: "up" | "down") => {
    const laneTasks = orderedLaneTasks(sprintId);
    const index = laneTasks.findIndex((task) => task.id === taskId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= laneTasks.length) {
      return;
    }

    const current = laneTasks[index];
    const swapTarget = laneTasks[targetIndex];
    if (!current || !swapTarget) {
      return;
    }
    await planTasks.mutateAsync([
      { taskId: current.id, payload: { sortOrder: swapTarget.sortOrder } },
      { taskId: swapTarget.id, payload: { sortOrder: current.sortOrder } }
    ]);
  };

  const assignTaskToSprint = async (taskId: string, sprintId: string | null) => {
    const task = project.tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const targetLane = orderedLaneTasks(sprintId);
    const nextSortOrder = targetLane.length === 0 ? Date.now() : Math.max(...targetLane.map((item) => item.sortOrder)) + 1;
    await planTasks.mutateAsync([{ taskId, payload: { sprintId, sortOrder: nextSortOrder } }]);
  };

  const moveTaskInBoardLane = async (taskId: string, status: TaskStatus, direction: "up" | "down") => {
    const laneTasks = orderedBoardTasks(status);
    const index = laneTasks.findIndex((task) => task.id === taskId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= laneTasks.length) {
      return;
    }

    const current = laneTasks[index];
    const swapTarget = laneTasks[targetIndex];
    if (!current || !swapTarget) {
      return;
    }

    await planTasks.mutateAsync([
      { taskId: current.id, payload: { sortOrder: swapTarget.sortOrder } },
      { taskId: swapTarget.id, payload: { sortOrder: current.sortOrder } }
    ]);
  };

  const moveTaskAcrossBoardColumns = async (taskId: string, direction: "left" | "right") => {
    const task = project.tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const statusIndex = boardColumns.indexOf(task.status);
    const targetStatus = boardColumns[statusIndex + (direction === "left" ? -1 : 1)];
    if (!targetStatus) {
      return;
    }

    const targetLane = orderedBoardTasks(targetStatus);
    const nextSortOrder = targetLane.length === 0 ? Date.now() : Math.max(...targetLane.map((item) => item.sortOrder)) + 1;
    await planTasks.mutateAsync([{ taskId, payload: { status: targetStatus, sortOrder: nextSortOrder } }]);
  };

  const renderView = (tasks: Task[]) => {
    if (tasks.length === 0) {
      return <EmptyState title={project.tasks.length === 0 ? "No tasks yet" : "No issues match the current filters"} />;
    }

    if (view === "LIST") {
      return (
        <TaskList
          tasks={tasks}
          canManage={canManageProject}
          currentUserId={user?.id}
          currentProjectRole={currentProjectRole}
          onSelectTask={(task) => setSelectedTaskId(task.id)}
          onStatusChange={(taskId, status) => updateTask.mutateAsync({ taskId, payload: { status } })}
          onTimerAction={(taskId, action) => updateTask.mutateAsync({ taskId, payload: { timerAction: action } })}
          onLogTime={(taskId, minutes) => updateTask.mutateAsync({ taskId, payload: { trackedMinutesDelta: minutes } })}
          onDelete={(taskId) => deleteTask.mutateAsync(taskId)}
        />
      );
    }

    if (view === "TIMELINE") {
      return <TaskTimelineView tasks={tasks} />;
    }

    if (view === "CALENDAR") {
      return <TaskCalendarView tasks={tasks} />;
    }

    return (
      <TaskBoardView
        tasks={tasks}
        canManage={canManageProject}
        pending={planTasks.isPending}
        onSelectTask={(task) => setSelectedTaskId(task.id)}
        onMoveTask={moveTaskInBoardLane}
        onMoveAcrossColumns={moveTaskAcrossBoardColumns}
      />
    );
  };

  return (
    <div className="page stack project-page">
      <section className="panel workspace-header">
        <div className="workspace-header-top">
          <div>
            <div className="eyebrow">Project workspace</div>
            <h1>{project.name}</h1>
            <p>{project.description || "No project summary yet. Add one to frame scope, risks, and delivery goals."}</p>
            <div className="hero-chip-list">
              <span className={`role-pill role-${(currentProjectRole ?? "member").toLowerCase()}`}>{currentProjectRole ?? user?.role ?? "MEMBER"}</span>
              <span className="mini-pill">{project.members.length} members</span>
              <span className="mini-pill">{project.tasks.length} issues</span>
            </div>
          </div>
          <div className="hero-metrics">
            <div className="hero-stat"><span>Tracked</span><strong>{formatHours(trackedMinutes)}</strong></div>
            <div className="hero-stat"><span>Planned</span><strong>{formatHours(estimatedMinutes)}</strong></div>
            <div className="hero-stat"><span>Recurring</span><strong>{recurringTasks}</strong></div>
          </div>
        </div>
      </section>

      <ProjectTabs activeTab={tab} onChange={setTab} taskCount={project.tasks.length} backlogCount={backlogCount} memberCount={project.members.length} />

      <div className="detail-grid workspace-grid">
        <section className="stack">
          {tab === "SUMMARY" ? (
            <section className="panel stack">
              <div className="section-header">
                <div>
                  <h2>Delivery focus</h2>
                  <p>Upcoming and unresolved work ordered by due date.</p>
                </div>
                <div className="toolbar-summary">
                  <span className="mini-pill">{project.tasks.filter((task) => task.status === "IN_PROGRESS").length} in progress</span>
                  <span className="mini-pill">{project.tasks.filter((task) => task.isOverdue).length} overdue</span>
                  {activeSprint ? <span className="mini-pill">Active sprint: {activeSprint.name}</span> : null}
                </div>
              </div>
              {focusTasks.length === 0 ? <EmptyState title="No active issues" /> : (
                <div className="summary-list">
                  {focusTasks.map((task) => (
                    <article className="issue-line" key={task.id}>
                      <div className="issue-line-copy">
                        <strong>{task.title}</strong>
                        <p>{task.description || task.assignmentLabel}</p>
                      </div>
                      <div className="task-card-badges">
                        <span className="mini-pill">Due {formatShortDate(task.dueDate)}</span>
                        <StatusBadge status={task.status} overdue={task.isOverdue} />
                        <button className="issue-inline-button" type="button" onClick={() => setSelectedTaskId(task.id)}>Open</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {tab === "BOARD" ? (
            <>
              <BoardToolbar
                members={project.members}
                sprints={project.sprints}
                view={view}
                onViewChange={setView}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                issueTypeFilter={issueTypeFilter}
                onIssueTypeFilterChange={setIssueTypeFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                sprintFilter={sprintFilter}
                onSprintFilterChange={setSprintFilter}
                assigneeFilter={assigneeFilter}
                onAssigneeFilterChange={setAssigneeFilter}
                overdueOnly={overdueOnly}
                onOverdueOnlyChange={setOverdueOnly}
                visibleCount={filteredTasks.length}
                totalCount={project.tasks.length}
                canCreate={canCreateTask}
                showCreate={showTaskComposer}
                onCreateToggle={() => setShowTaskComposer((current) => !current)}
              />
              {showTaskComposer && canCreateTask ? <TaskForm members={project.members} sprints={project.sprints} defaultAssigneeId={user?.id} pending={createTask.isPending} onSubmit={(input) => createTask.mutateAsync(input)} /> : null}
              {createTask.error ? <ErrorAlert message="Task could not be saved" /> : null}
              {updateTask.error || deleteTask.error || planTasks.error ? <ErrorAlert message="Task change could not be saved" /> : null}

              <section className="panel stack">
                <div className="section-header">
                  <div>
                    <h2>{view === "BOARD" ? "Active board" : view === "LIST" ? "Issue list" : view === "TIMELINE" ? "Delivery timeline" : "Delivery calendar"}</h2>
                    <p>Showing {filteredTasks.length} of {project.tasks.length} issues in the current workspace view.</p>
                  </div>
                  <div className="toolbar-summary">
                    <span className="mini-pill">{filteredTasks.filter((task) => task.status === "IN_PROGRESS").length} in progress</span>
                    <span className="mini-pill">{filteredTasks.filter((task) => task.isOverdue).length} overdue</span>
                  </div>
                </div>
                {renderView(filteredTasks)}
              </section>
            </>
          ) : null}

          {tab === "BACKLOG" ? (
            <>
              <BacklogView
                tasks={project.tasks}
                sprints={project.sprints}
                canManage={canManageProject}
                pending={planTasks.isPending || createSprint.isPending || updateSprint.isPending}
                onSelectTask={(task) => setSelectedTaskId(task.id)}
                onMoveTask={moveTaskInPlanningLane}
                onAssignTask={assignTaskToSprint}
                onCreateSprint={(input) => createSprint.mutateAsync(input)}
                onSprintStatusChange={(sprintId, status) => updateSprint.mutateAsync({ sprintId, payload: { status } })}
              />
              {createSprint.error || updateSprint.error ? <ErrorAlert message="Sprint planning change was not saved" /> : null}
            </>
          ) : null}

          {tab === "TEAM" ? (
            <>
              <MembersPanel
                canManage={canManageProject}
                members={project.members}
                onAdd={(selectedUser, role) => addMember.mutateAsync({ selectedUser, role })}
                onRoleChange={(userId, role) => updateMember.mutateAsync({ userId, role })}
                onRemove={(memberId) => removeMember.mutateAsync(memberId)}
              />
              {addMember.error || updateMember.error || removeMember.error ? <ErrorAlert message="Membership change was not saved" /> : null}
            </>
          ) : null}
        </section>

        <aside className="stack">
          <TaskDetailPanel
            key={selectedTaskId ?? "empty"}
            task={taskDetailQuery.data ?? null}
            isLoading={taskDetailQuery.isLoading}
            error={Boolean(taskDetailQuery.error)}
            pendingComment={addTaskComment.isPending}
            onClose={() => setSelectedTaskId(null)}
            onCommentSubmit={(taskId, body) => addTaskComment.mutateAsync({ taskId, body })}
          />

          <section className="panel stack">
            <div className="section-header">
              <div>
                <h2>Project report</h2>
                <p>Quick delivery signals from the current task set.</p>
              </div>
            </div>
            <div className="metric-grid">
              <div className="metric-tile"><span>Completed</span><strong>{project.tasks.filter((task) => task.status === "DONE").length}</strong></div>
              <div className="metric-tile"><span>Overdue</span><strong>{project.tasks.filter((task) => task.isOverdue).length}</strong></div>
              <div className="metric-tile"><span>Delegated</span><strong>{project.tasks.filter((task) => task.assignmentType === "ROLE").length}</strong></div>
              <div className="metric-tile"><span>Active timers</span><strong>{project.tasks.filter((task) => Boolean(task.timerStartedAt)).length}</strong></div>
            </div>
          </section>

          <section className="panel stack">
            <div className="section-header">
              <div>
                <h2>{tab === "TEAM" ? "Role coverage" : "Team snapshot"}</h2>
                <p>{tab === "TEAM" ? "Current members and their project-level permissions." : "Quick glance at who is currently in this workspace."}</p>
              </div>
            </div>
            <div className="team-snapshot">
              {(tab === "TEAM" ? project.members : project.members.slice(0, 5)).map((membership) => (
                <div className="team-chip" key={membership.id}>
                  <div className="team-chip-copy">
                    <strong>{membership.user.name}</strong>
                    <span>{membership.user.email}</span>
                  </div>
                  <span className={`role-pill role-${membership.role.toLowerCase()}`}>{membership.role}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
