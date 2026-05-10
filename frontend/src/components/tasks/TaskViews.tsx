import type { Task, TaskStatus } from "../../api/client";
import { StatusBadge } from "./StatusBadge";

const columns: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

function asDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskBoardView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="board-grid">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column);
        return (
          <section className="panel stack board-column" key={column}>
            <div className="section-header">
              <div>
                <h2>{column === "TODO" ? "To Do" : column === "IN_PROGRESS" ? "In Progress" : "Done"}</h2>
                <p>{columnTasks.length} tasks</p>
              </div>
            </div>
            {columnTasks.length === 0 ? <p className="muted-copy">No tasks in this lane.</p> : null}
            {columnTasks.map((task) => (
              <article className="board-card" key={task.id}>
                <div className="task-card-head">
                  <strong>{task.title}</strong>
                  <StatusBadge status={task.status} overdue={task.isOverdue} />
                </div>
                <p>{task.description}</p>
                <div className="task-meta-row compact-meta">
                  <span>{task.assignmentLabel}</span>
                  <span>{formatHours(task.trackedMinutes)}</span>
                </div>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}

export function TaskTimelineView({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return null;
  }

  const starts = tasks.map((task) => asDateOnly(task.createdAt.slice(0, 10)));
  const ends = tasks.map((task) => asDateOnly(task.dueDate));
  const min = new Date(Math.min(...starts.map((date) => date.getTime())));
  const max = new Date(Math.max(...ends.map((date) => date.getTime())));
  const totalDays = Math.max(1, Math.ceil((max.getTime() - min.getTime()) / 86_400_000) + 1);

  return (
    <section className="panel stack timeline-panel">
      <div className="section-header">
        <div>
          <h2>Timeline view</h2>
          <p>Created date to due date, scaled like a lightweight Gantt.</p>
        </div>
      </div>
      <div className="timeline-scale">
        <span>{formatShortDate(min)}</span>
        <span>{formatShortDate(max)}</span>
      </div>
      <div className="timeline-list">
        {tasks.map((task) => {
          const start = asDateOnly(task.createdAt.slice(0, 10));
          const end = asDateOnly(task.dueDate);
          const left = ((start.getTime() - min.getTime()) / 86_400_000 / totalDays) * 100;
          const width = Math.max(8, (((end.getTime() - start.getTime()) / 86_400_000) + 1) / totalDays * 100);

          return (
            <div className="timeline-row" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <small>{task.assignmentLabel}</small>
              </div>
              <div className="timeline-track">
                <span className={`timeline-bar timeline-${task.status.toLowerCase()}`} style={{ left: `${left}%`, width: `${width}%` }} />
              </div>
              <b>{formatShortDate(end)}</b>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TaskCalendarView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  const startOffset = (monthStart.getUTCDay() + 6) % 7;
  const calendarStart = new Date(monthStart);
  calendarStart.setUTCDate(monthStart.getUTCDate() - startOffset);

  const tasksByDay = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.dueDate;
    const dayTasks = tasksByDay.get(key) ?? [];
    dayTasks.push(task);
    tasksByDay.set(key, dayTasks);
  }

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setUTCDate(calendarStart.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { key, date, tasks: tasksByDay.get(key) ?? [] };
  });

  return (
    <section className="panel stack calendar-panel">
      <div className="section-header">
        <div>
          <h2>Calendar view</h2>
          <p>{monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
        </div>
      </div>
      <div className="calendar-grid calendar-weekdays">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid calendar-days">
        {days.map((day) => {
          const inCurrentMonth = day.date >= monthStart && day.date <= monthEnd;
          return (
            <div className={`calendar-cell ${inCurrentMonth ? "" : "calendar-cell-muted"}`.trim()} key={day.key}>
              <strong>{day.date.getUTCDate()}</strong>
              <div className="calendar-task-list">
                {day.tasks.slice(0, 3).map((task) => (
                  <span className="calendar-task" key={task.id}>{task.title}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}