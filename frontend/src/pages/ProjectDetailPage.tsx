import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api, type ProjectRole, type TaskStatus, type User } from "../api/client";
import { MembersPanel } from "../components/projects/MembersPanel";
import { TaskForm } from "../components/tasks/TaskForm";
import { TaskList } from "../components/tasks/TaskList";
import { TaskBoardView, TaskCalendarView, TaskTimelineView } from "../components/tasks/TaskViews";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../state/auth";

type ViewMode = "LIST" | "BOARD" | "TIMELINE" | "CALENDAR";

export function ProjectDetailPage() {
  const { projectId = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>("BOARD");
  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => api.getProject(projectId), enabled: Boolean(projectId) });
  const refreshProject = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
    queryClient.invalidateQueries({ queryKey: ["projects"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  ]);
  const addMember = useMutation({ mutationFn: ({ selectedUser, role }: { selectedUser: User; role: ProjectRole }) => api.addMembership(projectId, selectedUser.id, role), onSuccess: refreshProject });
  const updateMember = useMutation({ mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) => api.updateMembership(projectId, userId, role), onSuccess: refreshProject });
  const removeMember = useMutation({ mutationFn: (userId: string) => api.removeMembership(projectId, userId), onSuccess: refreshProject });
  const createTask = useMutation({ mutationFn: (input: Parameters<typeof api.createTask>[1]) => api.createTask(projectId, input), onSuccess: refreshProject });
  const updateTask = useMutation({ mutationFn: ({ taskId, payload }: { taskId: string; payload: Parameters<typeof api.updateTask>[2] }) => api.updateTask(projectId, taskId, payload), onSuccess: refreshProject });
  const deleteTask = useMutation({ mutationFn: (taskId: string) => api.deleteTask(projectId, taskId), onSuccess: refreshProject });

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

  const formatHours = (minutes: number) => {
    const hours = minutes / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
  };

  const renderView = () => {
    if (project.tasks.length === 0) {
      return <EmptyState title="No tasks yet" />;
    }

    if (view === "LIST") {
      return (
        <TaskList
          tasks={project.tasks}
          canManage={canManageProject}
          currentUserId={user?.id}
          currentProjectRole={currentProjectRole}
          onStatusChange={(taskId, status) => updateTask.mutateAsync({ taskId, payload: { status } })}
          onTimerAction={(taskId, action) => updateTask.mutateAsync({ taskId, payload: { timerAction: action } })}
          onLogTime={(taskId, minutes) => updateTask.mutateAsync({ taskId, payload: { trackedMinutesDelta: minutes } })}
          onDelete={(taskId) => deleteTask.mutateAsync(taskId)}
        />
      );
    }

    if (view === "TIMELINE") {
      return <TaskTimelineView tasks={project.tasks} />;
    }

    if (view === "CALENDAR") {
      return <TaskCalendarView tasks={project.tasks} />;
    }

    return <TaskBoardView tasks={project.tasks} />;
  };

  return (
    <div className="page stack project-page">
      <section className="panel page-hero project-hero">
        <div>
          <div className="eyebrow">Project workspace</div>
          <h1>{project.name}</h1>
          <p>{project.description || "No project summary yet. Add one to frame scope, risks, and delivery goals."}</p>
          <div className="hero-chip-list">
            <span className={`role-pill role-${(currentProjectRole ?? "member").toLowerCase()}`}>{currentProjectRole ?? user?.role ?? "MEMBER"}</span>
            <span className="mini-pill">{project.members.length} members</span>
            <span className="mini-pill">{project.tasks.length} tasks</span>
          </div>
        </div>
        <div className="hero-metrics">
          <div className="hero-stat"><span>Tracked</span><strong>{formatHours(trackedMinutes)}</strong></div>
          <div className="hero-stat"><span>Planned</span><strong>{formatHours(estimatedMinutes)}</strong></div>
          <div className="hero-stat"><span>Recurring</span><strong>{recurringTasks}</strong></div>
        </div>
      </section>

      <div className="detail-grid">
        <section className="stack">
          {canCreateTask ? <TaskForm members={project.members} defaultAssigneeId={user?.id} pending={createTask.isPending} onSubmit={(input) => createTask.mutateAsync(input)} /> : null}
          {createTask.error ? <ErrorAlert message="Task could not be saved" /> : null}
          {updateTask.error || deleteTask.error ? <ErrorAlert message="Task change could not be saved" /> : null}

          <section className="panel stack">
            <div className="section-header">
              <div>
                <h2>Project views</h2>
                <p>Switch between operational list, delivery board, timeline, and calendar.</p>
              </div>
            </div>
            <div className="view-switcher">
              {(["BOARD", "LIST", "TIMELINE", "CALENDAR"] as ViewMode[]).map((mode) => (
                <button key={mode} className={`button button-secondary view-tab ${view === mode ? "view-tab-active" : ""}`.trim()} type="button" onClick={() => setView(mode)}>
                  {mode}
                </button>
              ))}
            </div>
            {renderView()}
          </section>
        </section>

        <aside className="stack">
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

          <MembersPanel
            canManage={canManageProject}
            members={project.members}
            onAdd={(selectedUser, role) => addMember.mutateAsync({ selectedUser, role })}
            onRoleChange={(userId, role) => updateMember.mutateAsync({ userId, role })}
            onRemove={(memberId) => removeMember.mutateAsync(memberId)}
          />
          {addMember.error || updateMember.error || removeMember.error ? <ErrorAlert message="Membership change was not saved" /> : null}
        </aside>
      </div>
    </div>
  );
}
