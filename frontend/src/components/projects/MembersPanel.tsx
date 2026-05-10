import { Trash2 } from "lucide-react";
import { type Membership, type ProjectRole, type User } from "../../api/client";
import { Button } from "../ui/Button";
import { MemberSearch } from "./MemberSearch";

const projectRoles: ProjectRole[] = ["OWNER", "MANAGER", "MEMBER"];

export function MembersPanel({
  canManage,
  members,
  onAdd,
  onRoleChange,
  onRemove
}: {
  canManage: boolean;
  members: Membership[];
  onAdd: (user: User, role: ProjectRole) => Promise<unknown>;
  onRoleChange: (userId: string, role: ProjectRole) => Promise<unknown>;
  onRemove: (userId: string) => Promise<void>;
}) {
  return (
    <section className="panel stack">
      <div className="section-header">
        <div>
          <h2>Team roles</h2>
          <p>Owners and managers can delegate work by person or role.</p>
        </div>
      </div>
      {canManage ? <MemberSearch onSelect={onAdd} /> : null}
      <div className="list member-list">
        {members.map((membership) => (
          <div className="member-row" key={membership.id}>
            <div>
              <strong>{membership.user.name}</strong>
              <small>{membership.user.email}</small>
            </div>
            <div className="member-role-block">
              <span className={`role-pill role-${membership.role.toLowerCase()}`}>{membership.role}</span>
              {canManage ? (
                <div className="member-actions">
                  <select className="input compact" value={membership.role} onChange={(event) => void onRoleChange(membership.user.id, event.target.value as ProjectRole)}>
                    {projectRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <Button variant="secondary" onClick={() => void onRemove(membership.user.id)} title="Remove member">
                    <Trash2 size={16} /> Remove
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
