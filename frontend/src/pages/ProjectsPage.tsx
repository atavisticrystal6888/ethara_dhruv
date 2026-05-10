import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ProjectForm } from "../components/projects/ProjectForm";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../state/auth";

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const createProject = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  return (
    <div className="page stack">
      <div className="page-header">
        <div><h1>Projects</h1><p>{projectsQuery.data?.length ?? 0} visible workspaces</p></div>
      </div>
      {user?.role === "ADMIN" ? <ProjectForm pending={createProject.isPending} onSubmit={(input) => createProject.mutateAsync(input)} /> : null}
      {createProject.error ? <ErrorAlert message="Project could not be created" /> : null}
      {projectsQuery.isLoading ? <LoadingState label="Loading projects" /> : null}
      {projectsQuery.error ? <ErrorAlert message="Projects could not be loaded" /> : null}
      {projectsQuery.data?.length === 0 ? <EmptyState title="No projects yet" /> : null}
      <div className="project-grid">
        {projectsQuery.data?.map((project) => (
          <Link className="project-card" to={`/projects/${project.id}`} key={project.id}>
            <h2>{project.name}</h2>
            <p>{project.description}</p>
            <span>{project.memberCount} members</span>
            <span>{project.taskCount} tasks</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
