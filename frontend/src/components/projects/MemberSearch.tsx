import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { api, type User } from "../../api/client";
import { Button } from "../ui/Button";
import { ErrorAlert } from "../ui/ErrorAlert";
import { TextInput } from "../ui/FormField";
import { LoadingState } from "../ui/LoadingState";

export function MemberSearch({ onSelect }: { onSelect: (user: User) => Promise<unknown> }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setResults(await api.searchUsers(query));
    } catch {
      setError("User search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="member-search">
      <form className="inline-form" onSubmit={handleSearch}>
        <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email" />
        <Button type="submit" disabled={loading} title="Search users"><Search size={16} /> Search</Button>
      </form>
      {error ? <ErrorAlert message={error} /> : null}
      {loading ? <LoadingState label="Searching" /> : null}
      {results.length > 0 ? (
        <div className="result-list">
          {results.map((user) => (
            <button key={user.id} className="result-row" type="button" onClick={() => void onSelect(user)}>
              <span>{user.name}</span>
              <small>{user.email}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
