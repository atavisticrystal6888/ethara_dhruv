import { FolderKanban, LayoutDashboard, ListTodo, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../state/auth";
import { TopBar } from "./TopBar";

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-panel">
          <div className="brand-mark">TF</div>
          <div>
            <div className="brand">TeamFlow</div>
            <p>Delivery workspace for issue triage, ownership, and execution.</p>
          </div>
        </div>
        <div className="nav-section">
          <span className="nav-label">Workspace</span>
          <nav className="nav-list" aria-label="Primary">
            <NavLink to="/dashboard"><LayoutDashboard size={18} /> Dashboard</NavLink>
            <NavLink to="/your-work"><ListTodo size={18} /> Your work</NavLink>
            <NavLink to="/projects"><FolderKanban size={18} /> Projects</NavLink>
          </nav>
        </div>
        <div className="sidebar-card">
          <span className="eyebrow">Delivery mode</span>
          <strong>{user?.role === "ADMIN" ? "Workspace owner" : "Project contributor"}</strong>
          <p>Move between your queue, project boards, and team coverage from one shell.</p>
        </div>
        <div className="user-panel">
          <div className="user-identity">
            <div className="avatar-badge">{user?.name?.slice(0, 1) ?? "T"}</div>
            <div>
              <strong>{user?.name}</strong>
              <span><ShieldCheck size={14} /> {user?.role}</span>
            </div>
          </div>
          <div className="sidebar-tip"><Sparkles size={14} /> Personal queue, board, timeline, calendar, and team views</div>
          <Button variant="secondary" onClick={() => void logout()} title="Log out">
            <LogOut size={16} /> Log out
          </Button>
        </div>
      </aside>
      <main className="content-frame">
        <div className="content-inner shell-content">
          <TopBar />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
