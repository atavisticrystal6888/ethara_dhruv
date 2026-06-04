import { useState } from "react";
import type { Sprint, SprintStatus, Task } from "../../api/client";
import { Button } from "../ui/Button";
import { FormField, TextInput } from "../ui/FormField";
import { IssueTypeBadge } from "./IssueTypeBadge";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

function formatDate(value: string | null) {
  if (!value) return "Dates not set";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function orderedTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
}

function sprintRank(status: SprintStatus) {
  return status === "ACTIVE" ? 0 : status === "PLANNED" ? 1 : 2;
}

export function BacklogView({
  tasks,
  sprints,
  canManage,
  pending,
  onSelectTask,
  onMoveTask,
  onAssignTask,
  onCreateSprint,
  onSprintStatusChange
}: {
  tasks: Task[];
  sprints: Sprint[];
  canManage: boolean;
  pending: boolean;
  onSelectTask?: (task: Task) => void;
  onMoveTask: (taskId: string, sprintId: string | null, direction: "up" | "down") => Promise<unknown>;
  onAssignTask: (taskId: string, sprintId: string | null) => Promise<unknown>;
  onCreateSprint: (input: { name: string; goal?: string }) => Promise<unknown>;
  onSprintStatusChange: (sprintId: string, status: SprintStatus) => Promise<unknown>;
}) {
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const activeSprintId = sprints.find((sprint) => sprint.status === "ACTIVE")?.id ?? null;
  const backlogTasks = orderedTasks(tasks.filter((task) => task.sprintId === null));
  const orderedSprints = [...sprints].sort((left, right) => sprintRank(left.status) - sprintRank(right.status) || left.createdAt.localeCompare(right.createdAt));

  async function handleCreateSprint() {
    if (!sprintName.trim()) return;
    await onCreateSprint({ name: sprintName.trim(), goal: sprintGoal.trim() || undefined });
    setSprintName("");
    setSprintGoal("");
  }

  return (
    <div className="backlog-layout stack">
      {canManage ? (
        <section className="panel stack planning-section">
          <div className="section-header">
            <div>
              <h2>Create sprint</h2>
              <p>Open a sprint bucket before moving backlog work into execution.</p>
            </div>
          </div>
          <div className="sprint-form">
            <FormField label="Sprint name"><TextInput value={sprintName} onChange={(event) => setSprintName(event.target.value)} placeholder="Sprint 12" /></FormField>
            <FormField label="Goal"><TextInput value={sprintGoal} onChange={(event) => setSprintGoal(event.target.value)} placeholder="Finish QA and release prep" /></FormField>
            <Button type="button" disabled={pending || sprintName.trim().length < 2} onClick={() => void handleCreateSprint()}>
              {pending ? "Saving" : "Create sprint"}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="panel stack planning-section">
        <div className="section-header">
          <div>
            <h2>Backlog</h2>
            <p>Unscheduled work waiting to be prioritized into a sprint.</p>
          </div>
          <span className="mini-pill">{backlogTasks.length} issues</span>
        </div>
        <div className="planning-task-list">
          {backlogTasks.length === 0 ? <p className="muted-copy">No backlog issues. Move work here or create new items without a sprint.</p> : null}
          {backlogTasks.map((task, index) => (
            <article className="planning-task" key={task.id}>
              <div className="planning-task-head">
                <div className="planning-task-copy">
                  <strong>{task.title}</strong>
                  <p>{task.description || task.assignmentLabel}</p>
                </div>
                <div className="task-card-badges">
                  <IssueTypeBadge issueType={task.issueType} />
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} overdue={task.isOverdue} />
                </div>
              </div>
              <div className="task-chip-row">
                {task.labels.map((label) => <span className="mini-pill" key={label}>{label}</span>)}
                <span className="mini-pill">{task.storyPoints} pts</span>
              </div>
              <div className="planning-task-meta">
                <span>{task.assignmentLabel}</span>
                <span>Reporter {task.createdBy.name}</span>
                <span>Due {formatDate(task.dueDate)}</span>
              </div>
              {onSelectTask ? <Button type="button" variant="secondary" onClick={() => onSelectTask(task)}>Open issue</Button> : null}
              {canManage ? (
                <div className="planning-task-actions">
                  <select className="input compact" value={task.sprintId ?? "BACKLOG"} onChange={(event) => void onAssignTask(task.id, event.target.value === "BACKLOG" ? null : event.target.value)}>
                    <option value="BACKLOG">Backlog</option>
                    {orderedSprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
                  </select>
                  <Button type="button" variant="secondary" disabled={pending || index === 0} onClick={() => void onMoveTask(task.id, null, "up")}>Move up</Button>
                  <Button type="button" variant="secondary" disabled={pending || index === backlogTasks.length - 1} onClick={() => void onMoveTask(task.id, null, "down")}>Move down</Button>
                  {activeSprintId ? <Button type="button" variant="secondary" disabled={pending} onClick={() => void onAssignTask(task.id, activeSprintId)}>Send to active sprint</Button> : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {orderedSprints.map((sprint) => {
        const sprintTasks = orderedTasks(tasks.filter((task) => task.sprintId === sprint.id));
        return (
          <section className="panel stack planning-section" key={sprint.id}>
            <div className="section-header">
              <div>
                <h2>{sprint.name}</h2>
                <p>{sprint.goal || "No sprint goal set yet."}</p>
              </div>
              <div className="toolbar-summary">
                <span className={`mini-pill sprint-state sprint-${sprint.status.toLowerCase()}`}>{sprint.status}</span>
                <span className="mini-pill">{formatDate(sprint.startDate)} to {formatDate(sprint.endDate)}</span>
                <span className="mini-pill">{sprintTasks.length} issues</span>
              </div>
            </div>

            {canManage ? (
              <div className="planning-task-actions sprint-actions">
                {sprint.status === "PLANNED" ? <Button type="button" variant="secondary" disabled={pending} onClick={() => void onSprintStatusChange(sprint.id, "ACTIVE")}>Start sprint</Button> : null}
                {sprint.status === "ACTIVE" ? <Button type="button" variant="secondary" disabled={pending} onClick={() => void onSprintStatusChange(sprint.id, "COMPLETED")}>Complete sprint</Button> : null}
                {sprint.status === "COMPLETED" ? <Button type="button" variant="secondary" disabled={pending} onClick={() => void onSprintStatusChange(sprint.id, "PLANNED")}>Reopen sprint</Button> : null}
              </div>
            ) : null}

            <div className="planning-task-list">
              {sprintTasks.length === 0 ? <p className="muted-copy">No issues in this sprint yet.</p> : null}
              {sprintTasks.map((task, index) => (
                <article className="planning-task" key={task.id}>
                  <div className="planning-task-head">
                    <div className="planning-task-copy">
                      <strong>{task.title}</strong>
                      <p>{task.description || task.assignmentLabel}</p>
                    </div>
                    <div className="task-card-badges">
                      <IssueTypeBadge issueType={task.issueType} />
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} overdue={task.isOverdue} />
                    </div>
                  </div>
                  <div className="task-chip-row">
                    {task.labels.map((label) => <span className="mini-pill" key={label}>{label}</span>)}
                    <span className="mini-pill">{task.storyPoints} pts</span>
                  </div>
                  <div className="planning-task-meta">
                    <span>{task.assignmentLabel}</span>
                    <span>Reporter {task.createdBy.name}</span>
                    <span>Due {formatDate(task.dueDate)}</span>
                  </div>
                  {onSelectTask ? <Button type="button" variant="secondary" onClick={() => onSelectTask(task)}>Open issue</Button> : null}
                  {canManage ? (
                    <div className="planning-task-actions">
                      <select className="input compact" value={task.sprintId ?? "BACKLOG"} onChange={(event) => void onAssignTask(task.id, event.target.value === "BACKLOG" ? null : event.target.value)}>
                        <option value="BACKLOG">Backlog</option>
                        {orderedSprints.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                      </select>
                      <Button type="button" variant="secondary" disabled={pending || index === 0} onClick={() => void onMoveTask(task.id, sprint.id, "up")}>Move up</Button>
                      <Button type="button" variant="secondary" disabled={pending || index === sprintTasks.length - 1} onClick={() => void onMoveTask(task.id, sprint.id, "down")}>Move down</Button>
                      <Button type="button" variant="secondary" disabled={pending} onClick={() => void onAssignTask(task.id, null)}>Move to backlog</Button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}