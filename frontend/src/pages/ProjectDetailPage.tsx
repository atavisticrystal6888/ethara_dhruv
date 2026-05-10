import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api, type TaskStatus, type User } from "../api/client";
import { MembersPanel } from "../components/projects/MembersPanel";
import { TaskForm } from "../components/tasks/TaskForm";
import { TaskList } from "../components/tasks/TaskList";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../state/auth";

export function ProjectDetailPage() {
  const { projectId = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => api.getProject(projectId), enabled: Boolean(projectId) });
  const refreshProject = () => queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  const addMember = useMutation({ mutationFn: (selectedUser: User) => api.addMembership(projectId, selectedUser.id), onSuccess: refreshProject });
  const removeMember = useMutation({ mutationFn: (userId: string) => api.removeMembership(projectId, userId), onSuccess: refreshProject });
  const createTask = useMutation({ mutationFn: (input: Parameters<typeof api.createTask>[1]) => api.createTask(projectId, input), onSuccess: refreshProject });
  const updateTask = useMutation({ mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) => api.updateTask(projectId, taskId, { status }), onSuccess: refreshProject });
  const deleteTask = useMutation({ mutationFn: (taskId: string) => api.deleteTask(projectId, taskId), onSuccess: refreshProject });
  const admin = user?.role === "ADMIN";

  if (projectQuery.isLoading) return <LoadingState label="Loading project" />;
  if (projectQuery.error || !projectQuery.data) return <ErrorAlert message="Project could not be loaded" />;

  const project = projectQuery.data;

  return (
    <div className="page detail-grid">
      <section className="stack">
        <div className="page-header"><div><h1>{project.name}</h1><p>{project.description}</p></div></div>
        {admin ? <TaskForm members={project.members} pending={createTask.isPending} onSubmit={(input) => createTask.mutateAsync(input)} /> : null}
        {createTask.error ? <ErrorAlert message="Task could not be saved" /> : null}
        {project.tasks.length === 0 ? <EmptyState title="No tasks yet" /> : <TaskList tasks={project.tasks} canDelete={admin} onStatusChange={(taskId, status) => updateTask.mutateAsync({ taskId, status })} onDelete={(taskId) => deleteTask.mutateAsync(taskId)} />}
      </section>
      <MembersPanel admin={admin} members={project.members} onAdd={(selectedUser) => addMember.mutateAsync(selectedUser)} onRemove={(memberId) => removeMember.mutateAsync(memberId)} />
      {addMember.error || removeMember.error ? <ErrorAlert message="Membership change was not saved" /> : null}
    </div>
  );
}
