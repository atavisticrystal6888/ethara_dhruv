import { FormEvent, useEffect, useState } from "react";
import type { Membership, ProjectRole, RecurrencePattern, TaskAssignmentType, TaskStatus } from "../../api/client";
import { Button } from "../ui/Button";
import { FormField, TextArea, TextInput } from "../ui/FormField";

const projectRoles: ProjectRole[] = ["OWNER", "MANAGER", "MEMBER"];
const recurrencePatterns: RecurrencePattern[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY"];

export function TaskForm({
  members,
  pending,
  defaultAssigneeId,
  onSubmit
}: {
  members: Membership[];
  pending: boolean;
  defaultAssigneeId?: string;
  onSubmit: (input: {
    title: string;
    description?: string;
    status: TaskStatus;
    assignmentType: TaskAssignmentType;
    assigneeId?: string;
    assigneeRole?: ProjectRole;
    dueDate: string;
    estimatedMinutes: number;
    recurrencePattern: RecurrencePattern;
  }) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [assignmentType, setAssignmentType] = useState<TaskAssignmentType>("USER");
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId ?? members[0]?.user.id ?? "");
  const [assigneeRole, setAssigneeRole] = useState<ProjectRole>("MEMBER");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("1.5");
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>("NONE");

  useEffect(() => {
    if (defaultAssigneeId) {
      setAssigneeId(defaultAssigneeId);
      return;
    }

    if (members.length > 0 && !members.some((membership) => membership.user.id === assigneeId)) {
      setAssigneeId(members[0].user.id);
    }
  }, [assigneeId, defaultAssigneeId, members]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      title,
      description,
      status,
      assignmentType,
      assigneeId: assignmentType === "USER" ? assigneeId : undefined,
      assigneeRole: assignmentType === "ROLE" ? assigneeRole : undefined,
      dueDate,
      estimatedMinutes: Math.max(0, Math.round((Number.parseFloat(estimatedHours) || 0) * 60)),
      recurrencePattern
    });
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setAssignmentType("USER");
    setAssigneeId(defaultAssigneeId ?? members[0]?.user.id ?? "");
    setAssigneeRole("MEMBER");
    setDueDate("");
    setEstimatedHours("1.5");
    setRecurrencePattern("NONE");
  }

  return (
    <form className="panel form-grid task-form" onSubmit={handleSubmit}>
      <div className="section-header">
        <div>
          <h2>Create task</h2>
          <p>Assign work to one person or delegate it to a project role.</p>
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
      <FormField label="Estimated hours"><TextInput type="number" min="0" step="0.5" value={estimatedHours} onChange={(event) => setEstimatedHours(event.target.value)} required /></FormField>
      <FormField label="Recurrence">
        <select className="input" value={recurrencePattern} onChange={(event) => setRecurrencePattern(event.target.value as RecurrencePattern)}>
          {recurrencePatterns.map((pattern) => <option key={pattern} value={pattern}>{pattern}</option>)}
        </select>
      </FormField>
      <Button disabled={pending}>{pending ? "Saving" : "Create task"}</Button>
    </form>
  );
}
