import { useState } from "react";
import type { TaskDetail } from "../../api/client";
import { Button } from "../ui/Button";
import { ErrorAlert } from "../ui/ErrorAlert";
import { LoadingState } from "../ui/LoadingState";
import { FormField, TextArea } from "../ui/FormField";
import { IssueTypeBadge } from "./IssueTypeBadge";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

export function TaskDetailPanel({
  task,
  isLoading,
  error,
  pendingComment,
  onClose,
  onCommentSubmit
}: {
  task: TaskDetail | null;
  isLoading: boolean;
  error: boolean;
  pendingComment: boolean;
  onClose: () => void;
  onCommentSubmit: (taskId: string, body: string) => Promise<unknown>;
}) {
  const [commentBody, setCommentBody] = useState("");

  async function handleSubmit() {
    if (!task || !commentBody.trim()) return;
    await onCommentSubmit(task.id, commentBody.trim());
    setCommentBody("");
  }

  return (
    <section className="panel stack issue-detail-panel">
      <div className="section-header">
        <div>
          <h2>Issue detail</h2>
          <p>Discussion, history, and delivery context without leaving the workspace.</p>
        </div>
        <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
      </div>

      {isLoading ? <LoadingState label="Loading issue" /> : null}
      {!isLoading && error ? <ErrorAlert message="Issue detail could not be loaded" /> : null}
      {!isLoading && !error && !task ? <p className="muted-copy">Select an issue from the board, list, or backlog to inspect its conversation and activity.</p> : null}

      {!isLoading && !error && task ? (
        <>
          <div className="stack issue-detail-copy">
            <div className="task-card-badges">
              <IssueTypeBadge issueType={task.issueType} />
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} overdue={task.isOverdue} />
            </div>
            <div>
              <h3>{task.title}</h3>
              <p>{task.description || "No description yet."}</p>
            </div>
          </div>

          <div className="detail-meta-grid">
            <div className="detail-meta-item"><span>Assignee</span><strong>{task.assignmentLabel}</strong></div>
            <div className="detail-meta-item"><span>Reporter</span><strong>{task.createdBy.name}</strong></div>
            <div className="detail-meta-item"><span>Due date</span><strong>{formatDate(task.dueDate)}</strong></div>
            <div className="detail-meta-item"><span>Sprint</span><strong>{task.sprintId ?? "Backlog"}</strong></div>
            <div className="detail-meta-item"><span>Story points</span><strong>{task.storyPoints}</strong></div>
            <div className="detail-meta-item"><span>Tracked / planned</span><strong>{formatHours(task.trackedMinutes)} / {formatHours(task.estimatedMinutes)}</strong></div>
          </div>

          <section className="stack issue-detail-section">
            <div className="section-header">
              <div>
                <h3>Comments</h3>
                <p>{task.comments.length} discussion items</p>
              </div>
            </div>

            <FormField label="Add comment">
              <TextArea rows={3} value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Share an update, blocker, or decision" />
            </FormField>
            <Button type="button" disabled={pendingComment || commentBody.trim().length === 0} onClick={() => void handleSubmit()}>
              {pendingComment ? "Posting" : "Post comment"}
            </Button>

            <div className="detail-list">
              {task.comments.length === 0 ? <p className="muted-copy">No comments yet.</p> : null}
              {task.comments.map((comment) => (
                <article className="comment-card" key={comment.id}>
                  <div className="issue-line">
                    <strong>{comment.author.name}</strong>
                    <span>{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p>{comment.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="stack issue-detail-section">
            <div className="section-header">
              <div>
                <h3>Activity</h3>
                <p>{task.activity.length} recent changes</p>
              </div>
            </div>
            <div className="detail-list">
              {task.activity.length === 0 ? <p className="muted-copy">No activity yet.</p> : null}
              {task.activity.map((entry) => (
                <div className="activity-row" key={entry.id}>
                  <div>
                    <strong>{entry.actor.name}</strong>
                    <p>{entry.message}</p>
                  </div>
                  <span>{formatDateTime(entry.createdAt)}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}