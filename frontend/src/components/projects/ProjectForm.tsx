import { FormEvent, useState } from "react";
import { Button } from "../ui/Button";
import { FormField, TextArea, TextInput } from "../ui/FormField";

export function ProjectForm({ onSubmit, pending }: { onSubmit: (input: { name: string; description?: string }) => Promise<unknown>; pending: boolean }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ name, description });
    setName("");
    setDescription("");
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <FormField label="Project name">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} minLength={3} required />
      </FormField>
      <FormField label="Description">
        <TextArea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
      </FormField>
      <Button disabled={pending}>{pending ? "Saving" : "Create project"}</Button>
    </form>
  );
}
