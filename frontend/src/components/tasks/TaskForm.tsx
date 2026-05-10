import { FormEvent, useState } from "react";
import type { Membership, TaskStatus } from "../../api/client";
import { Button } from "../ui/Button";
import { FormField, TextArea, TextInput } from "../ui/FormField";

export function TaskForm({
  members,
  pending,
  onSubmit
}: {
  members: Membership[];
  pending: boolean;
  onSubmit: (input: { title: string; description?: string; status: TaskStatus; assigneeId: string; dueDate: string }) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ title, description, status, assigneeId, dueDate });
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setAssigneeId("");
    setDueDate("");
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <FormField label="Task title"><TextInput value={title} onChange={(event) => setTitle(event.target.value)} minLength={3} required /></FormField>
      <FormField label="Description"><TextArea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></FormField>
      <FormField label="Status">
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </FormField>
      <FormField label="Assignee">
        <select className="input" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} required>
          <option value="">Select member</option>
          {members.map((membership) => <option value={membership.user.id} key={membership.user.id}>{membership.user.name}</option>)}
        </select>
      </FormField>
      <FormField label="Due date"><TextInput type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></FormField>
      <Button disabled={pending}>{pending ? "Saving" : "Create task"}</Button>
    </form>
  );
}
