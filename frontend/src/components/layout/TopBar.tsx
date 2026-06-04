import { FolderKanban, LayoutDashboard, ListTodo } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function getTopBarMeta(pathname: string) {
  if (pathname === "/dashboard") {
    return {
      eyebrow: "Workspace",
      title: "Daily delivery desk",
      description: "Review at-risk work, personal ownership, and the projects that need a decision next."
    };
  }

  if (pathname === "/projects") {
    return {
      eyebrow: "Workspace",
      title: "Project index",
      description: "Open the right board, inspect the team, and move from overview to execution quickly."
    };
  }

  if (pathname === "/your-work") {
    return {
      eyebrow: "Workspace",
      title: "Personal work surface",
      description: "See your queue, role-delegated work, and active timers before diving into a project board."
    };
  }

  if (pathname.startsWith("/projects/")) {
    return {
      eyebrow: "Workspace",
      title: "Project operations",
      description: "Switch tabs, filter issues, and keep triage in one place instead of bouncing between screens."
    };
  }

  return {
    eyebrow: "Workspace",
    title: "TeamFlow",
    description: "Move from planning to execution with a denser, work-first delivery shell."
  };
}

export function TopBar() {
  const { pathname } = useLocation();
  const meta = getTopBarMeta(pathname);

  return (
    <section className="panel topbar">
      <div className="topbar-copy">
        <span className="eyebrow">{meta.eyebrow}</span>
        <strong className="topbar-title">{meta.title}</strong>
        <p>{meta.description}</p>
      </div>
      <div className="topbar-actions">
        <Link className="button button-secondary" to="/dashboard">
          <LayoutDashboard size={16} /> Dashboard
        </Link>
        <Link className="button button-secondary" to="/your-work">
          <ListTodo size={16} /> Your work
        </Link>
        <Link className="button button-secondary" to="/projects">
          <FolderKanban size={16} /> Projects
        </Link>
      </div>
    </section>
  );
}