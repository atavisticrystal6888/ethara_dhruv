import type { TaskIssueType } from "../../api/client";

const labels: Record<TaskIssueType, string> = {
  EPIC: "Epic",
  STORY: "Story",
  TASK: "Task",
  BUG: "Bug"
};

export function IssueTypeBadge({ issueType }: { issueType: TaskIssueType }) {
  return <span className={`issue-type issue-type-${issueType.toLowerCase()}`}>{labels[issueType]}</span>;
}