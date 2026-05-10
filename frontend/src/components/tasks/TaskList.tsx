import type { Task, TaskStatus } from "../../api/client";
import { Button } from "../ui/Button";
import { StatusBadge } from "./StatusBadge";

export function TaskList({
  tasks,
  canDelete,
  onStatusChange,
  onDelete
}: {
  tasks: Task[];
  canDelete: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<unknown>;
  onDelete: (taskId: string) => Promise<unknown>;
}) {
  return (
    <div className="list">
      {tasks.map((task) => (
        <article className="task-row" key={task.id}>
          <div>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <small>{task.assignee.name} · due {task.dueDate}</small>
          </div>
          <StatusBadge status={task.status} overdue={task.isOverdue} />
          <select className="input compact" value={task.status} onChange={(event) => void onStatusChange(task.id, event.target.value as TaskStatus)}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          {canDelete ? <Button variant="danger" onClick={() => void onDelete(task.id)}>Delete</Button> : null}
        </article>
      ))}
    </div>
  );
}
