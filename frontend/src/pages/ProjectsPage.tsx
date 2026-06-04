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
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    ])
  });

  return (
    <div className="page stack projects-page">
      <section className="panel page-hero">
        <div>
          <div className="eyebrow">Workspace index</div>
          <h1>Projects</h1>
          <p>{user?.name}, jump straight into boards, ownership, and delivery context without hunting through broad overview pages.</p>
        </div>
        <div className="hero-metrics">
          <div className="hero-stat"><span>Visible workspaces</span><strong>{projectsQuery.data?.length ?? 0}</strong></div>
          <div className="hero-stat"><span>Your access</span><strong>{user?.role}</strong></div>
        </div>
      </section>
      <ProjectForm pending={createProject.isPending} onSubmit={(input) => createProject.mutateAsync(input)} />
      {createProject.error ? <ErrorAlert message="Project could not be created" /> : null}
      {projectsQuery.isLoading ? <LoadingState label="Loading projects" /> : null}
      {projectsQuery.error ? <ErrorAlert message="Projects could not be loaded" /> : null}
      {projectsQuery.data?.length === 0 ? <EmptyState title="No projects yet" /> : null}
      <div className="project-grid">
        {projectsQuery.data?.map((project) => (
          <Link className="project-card interactive-card" to={`/projects/${project.id}`} key={project.id}>
            <div className="project-card-top">
              <h2>{project.name}</h2>
              <span className="mini-pill">{project.memberCount} people</span>
            </div>
            <p>{project.description || "No description yet. Open the workspace to manage issues, people, and delivery pace."}</p>
            <div className="project-card-metrics">
              <span>{project.taskCount} tasks</span>
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <span className="project-card-link">Open workspace</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
