import { FolderKanban, LayoutDashboard, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../state/auth";

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-panel">
          <div className="brand-mark">TF</div>
          <div>
            <div className="brand">TeamFlow</div>
            <p>Delivery cockpit for role-driven teams.</p>
          </div>
        </div>
        <nav className="nav-list" aria-label="Primary">
          <NavLink to="/dashboard"><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink to="/projects"><FolderKanban size={18} /> Projects</NavLink>
        </nav>
        <div className="sidebar-card">
          <span className="eyebrow">Workspace mode</span>
          <strong>{user?.role === "ADMIN" ? "Admin control" : "Project contributor"}</strong>
          <p>Create workspaces, delegate by role, and review time-tracking in one flow.</p>
        </div>
        <div className="user-panel">
          <div className="user-identity">
            <div className="avatar-badge">{user?.name?.slice(0, 1) ?? "T"}</div>
            <div>
              <strong>{user?.name}</strong>
              <span><ShieldCheck size={14} /> {user?.role}</span>
            </div>
          </div>
          <div className="sidebar-tip"><Sparkles size={14} /> Multi-view planning enabled</div>
          <Button variant="secondary" onClick={() => void logout()} title="Log out">
            <LogOut size={16} /> Log out
          </Button>
        </div>
      </aside>
      <main className="content-frame">
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
