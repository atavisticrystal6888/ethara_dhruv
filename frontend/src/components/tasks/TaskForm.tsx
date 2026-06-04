import { FormEvent, useEffect, useState } from "react";
import type { Membership, ProjectRole, RecurrencePattern, Sprint, TaskAssignmentType, TaskIssueType, TaskPriority, TaskStatus } from "../../api/client";
import { Button } from "../ui/Button";
import { FormField, TextArea, TextInput } from "../ui/FormField";

const projectRoles: ProjectRole[] = ["OWNER", "MANAGER", "MEMBER"];
const recurrencePatterns: RecurrencePattern[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY"];
const issueTypes: TaskIssueType[] = ["EPIC", "STORY", "TASK", "BUG"];
const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function normalizeLabels(value: string) {
  return Array.from(new Set(value.split(",").map((label) => label.trim()).filter(Boolean))).slice(0, 8);
}

export function TaskForm({
  members,
  sprints,
  pending,
  defaultAssigneeId,
  onSubmit
}: {
  members: Membership[];
  sprints: Sprint[];
  pending: boolean;
  defaultAssigneeId?: string;
  onSubmit: (input: {
    title: string;
    description?: string;
    status: TaskStatus;
    issueType: TaskIssueType;
    priority: TaskPriority;
    assignmentType: TaskAssignmentType;
    assigneeId?: string;
    assigneeRole?: ProjectRole;
    dueDate: string;
    sprintId?: string | null;
    storyPoints: number;
    labels: string[];
    estimatedMinutes: number;
    recurrencePattern: RecurrencePattern;
  }) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [issueType, setIssueType] = useState<TaskIssueType>("TASK");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assignmentType, setAssignmentType] = useState<TaskAssignmentType>("USER");
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId ?? members[0]?.user.id ?? "");
  const [assigneeRole, setAssigneeRole] = useState<ProjectRole>("MEMBER");
  const [dueDate, setDueDate] = useState("");
  const [sprintId, setSprintId] = useState<string>("BACKLOG");
  const [storyPoints, setStoryPoints] = useState("3");
  const [labels, setLabels] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("1.5");
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>("NONE");

  useEffect(() => {
    if (defaultAssigneeId) {
      setAssigneeId(defaultAssigneeId);
      return;
    }

    const firstMember = members[0];
    if (firstMember && !members.some((membership) => membership.user.id === assigneeId)) {
      setAssigneeId(firstMember.user.id);
    }
  }, [assigneeId, defaultAssigneeId, members]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      title,
      description,
      status,
      issueType,
      priority,
      assignmentType,
      assigneeId: assignmentType === "USER" ? assigneeId : undefined,
      assigneeRole: assignmentType === "ROLE" ? assigneeRole : undefined,
      dueDate,
      sprintId: sprintId === "BACKLOG" ? null : sprintId,
      storyPoints: Math.max(0, Math.round(Number.parseFloat(storyPoints) || 0)),
      labels: normalizeLabels(labels),
      estimatedMinutes: Math.max(0, Math.round((Number.parseFloat(estimatedHours) || 0) * 60)),
      recurrencePattern
    });
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setIssueType("TASK");
    setPriority("MEDIUM");
    setAssignmentType("USER");
    setAssigneeId(defaultAssigneeId ?? members[0]?.user.id ?? "");
    setAssigneeRole("MEMBER");
    setDueDate("");
    setSprintId("BACKLOG");
    setStoryPoints("3");
    setLabels("");
    setEstimatedHours("1.5");
    setRecurrencePattern("NONE");
  }

  return (
    <form className="panel form-grid task-form" onSubmit={handleSubmit}>
      <div className="section-header">
        <div>
          <h2>Create issue</h2>
          <p>Capture work quickly, assign ownership, and keep triage inside the workspace.</p>
        </div>
      </div>
      <FormField label="Task title"><TextInput value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} required /></FormField>
      <FormField label="Description"><TextArea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></FormField>
      <FormField label="Status">
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </FormField>
      <FormField label="Issue type">
        <select className="input" value={issueType} onChange={(event) => setIssueType(event.target.value as TaskIssueType)}>
          {issueTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </FormField>
      <FormField label="Priority">
        <select className="input" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
          {priorities.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </FormField>
      <FormField label="Sprint">
        <select className="input" value={sprintId} onChange={(event) => setSprintId(event.target.value)}>
          <option value="BACKLOG">Backlog</option>
          {sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
        </select>
      </FormField>
      <FormField label="Assignment mode">
        <select className="input" value={assignmentType} onChange={(event) => setAssignmentType(event.target.value as TaskAssignmentType)}>
          <option value="USER">Individual owner</option>
          <option value="ROLE">Project role group</option>
        </select>
      </FormField>
      {assignmentType === "USER" ? (
        <FormField label="Assignee">
          <select className="input" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} required>
            <option value="">Select member</option>
            {members.map((membership) => <option value={membership.user.id} key={membership.user.id}>{membership.user.name} · {membership.role}</option>)}
          </select>
        </FormField>
      ) : (
        <FormField label="Delegated role">
          <select className="input" value={assigneeRole} onChange={(event) => setAssigneeRole(event.target.value as ProjectRole)}>
            {projectRoles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </FormField>
      )}
      <FormField label="Due date"><TextInput type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></FormField>
      <FormField label="Story points"><TextInput type="number" min="0" step="1" value={storyPoints} onChange={(event) => setStoryPoints(event.target.value)} required /></FormField>
      <FormField label="Labels"><TextInput value={labels} onChange={(event) => setLabels(event.target.value)} placeholder="release, content, qa" /></FormField>
      <FormField label="Estimated hours"><TextInput type="number" min="0" step="0.5" value={estimatedHours} onChange={(event) => setEstimatedHours(event.target.value)} required /></FormField>
      <FormField label="Recurrence">
        <select className="input" value={recurrencePattern} onChange={(event) => setRecurrencePattern(event.target.value as RecurrencePattern)}>
          {recurrencePatterns.map((pattern) => <option key={pattern} value={pattern}>{pattern}</option>)}
        </select>
      </FormField>
      <Button disabled={pending}>{pending ? "Saving" : "Create issue"}</Button>
    </form>
  );
}
