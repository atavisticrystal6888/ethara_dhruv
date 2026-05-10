import { FolderKanban, LayoutDashboard, LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../state/auth";

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Team Task Manager</div>
        <nav className="nav-list" aria-label="Primary">
          <NavLink to="/dashboard"><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink to="/projects"><FolderKanban size={18} /> Projects</NavLink>
        </nav>
        <div className="user-panel">
          <strong>{user?.name}</strong>
          <span>{user?.role}</span>
          <Button variant="secondary" onClick={() => void logout()} title="Log out">
            <LogOut size={16} /> Log out
          </Button>
        </div>
      </aside>
      <main className="content-frame">
        <Outlet />
      </main>
    </div>
  );
}
