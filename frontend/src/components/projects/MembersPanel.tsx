import { Trash2 } from "lucide-react";
import { type Membership, type User } from "../../api/client";
import { Button } from "../ui/Button";
import { MemberSearch } from "./MemberSearch";

export function MembersPanel({
  admin,
  members,
  onAdd,
  onRemove
}: {
  admin: boolean;
  members: Membership[];
  onAdd: (user: User) => Promise<unknown>;
  onRemove: (userId: string) => Promise<void>;
}) {
  return (
    <section className="panel stack">
      <div className="section-header"><h2>Members</h2></div>
      {admin ? <MemberSearch onSelect={onAdd} /> : null}
      <div className="list">
        {members.map((membership) => (
          <div className="list-row" key={membership.id}>
            <div>
              <strong>{membership.user.name}</strong>
              <small>{membership.user.email}</small>
            </div>
            {admin ? (
              <Button variant="secondary" onClick={() => void onRemove(membership.user.id)} title="Remove member">
                <Trash2 size={16} /> Remove
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
