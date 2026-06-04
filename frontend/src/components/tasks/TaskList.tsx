import { Clock3, Play, Square } from "lucide-react";
import type { ProjectRole, Task, TaskStatus } from "../../api/client";
import { Button } from "../ui/Button";
import { IssueTypeBadge } from "./IssueTypeBadge";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

function formatDueDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskList({
  tasks,
  canManage,
  currentUserId,
  currentProjectRole,
  onSelectTask,
  onStatusChange,
  onTimerAction,
  onLogTime,
  onDelete
}: {
  tasks: Task[];
  canManage: boolean;
  currentUserId?: string;
  currentProjectRole?: ProjectRole | null;
  onSelectTask?: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onTimerAction: (taskId: string, action: "START" | "STOP") => Promise<unknown>;
  onLogTime: (taskId: string, minutes: number) => Promise<unknown>;
  onDelete: (taskId: string) => Promise<unknown>;
}) {
  const canOperateTask = (task: Task) =>
    canManage || task.assignee?.id === currentUserId || (task.assignmentType === "ROLE" && task.assigneeRole === currentProjectRole);

  return (
    <div className="task-list-grid">
      {tasks.map((task) => (
        <article className="task-card task-row" key={task.id}>
          <div className="task-card-head">
            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
            </div>
            <div className="task-card-badges">
              <IssueTypeBadge issueType={task.issueType} />
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} overdue={task.isOverdue} />
              {task.recurrencePattern !== "NONE" ? <span className="mini-pill">{task.recurrencePattern}</span> : null}
            </div>
          </div>
          <div className="task-chip-row">
            {task.labels.map((label) => <span className="mini-pill" key={label}>{label}</span>)}
            <span className="mini-pill">{task.storyPoints} pts</span>
          </div>
          <div className="task-meta-row">
            <span>{task.assignmentLabel}</span>
            <span>Reporter {task.createdBy.name}</span>
            <span>Due {formatDueDate(task.dueDate)}</span>
            <span>{formatHours(task.trackedMinutes)} tracked / {formatHours(task.estimatedMinutes)} planned</span>
            {task.timerStartedAt ? <span>Timer live</span> : null}
          </div>
          <div className="task-actions">
            {onSelectTask ? <Button variant="secondary" type="button" onClick={() => onSelectTask(task)}>Open issue</Button> : null}
            <select className="input compact" value={task.status} disabled={!canOperateTask(task)} onChange={(event) => void onStatusChange(task.id, event.target.value as TaskStatus)}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            <Button
              variant="secondary"
              type="button"
              disabled={task.timerStartedAt ? !canManage && task.timerUserId !== currentUserId : !canOperateTask(task)}
              onClick={() => void onTimerAction(task.id, task.timerStartedAt ? "STOP" : "START")}
            >
              {task.timerStartedAt ? <Square size={16} /> : <Play size={16} />}
              {task.timerStartedAt ? "Stop timer" : "Start timer"}
            </Button>
            <Button variant="secondary" type="button" disabled={!canOperateTask(task)} onClick={() => void onLogTime(task.id, 15)}>
              <Clock3 size={16} /> +15 min
            </Button>
            {canManage ? <Button variant="danger" type="button" onClick={() => void onDelete(task.id)}>Delete</Button> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
