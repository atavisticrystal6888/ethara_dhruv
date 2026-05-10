import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { FormField, TextInput } from "../components/ui/FormField";
import { useAuth } from "../state/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <div className="auth-showcase">
          <div className="eyebrow">TeamFlow MVP</div>
          <h1>Login</h1>
          <p>Role-based delegation, recurring work, multi-view planning, and time tracking in one assignment-ready workspace.</p>
          <div className="demo-credentials">
            <strong>Seeded demo access</strong>
            <small>avery@teamflow.demo / TeamFlow2026!</small>
            <small>maya@teamflow.demo / TeamFlow2026!</small>
          </div>
        </div>
        <form className="auth-panel" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          {error ? <ErrorAlert message={error} /> : null}
          <FormField label="Email">
            <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </FormField>
          <FormField label="Password">
            <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </FormField>
          <Button disabled={submitting}>{submitting ? "Signing in" : "Sign in"}</Button>
          <Link to="/signup">Create account</Link>
        </form>
      </section>
    </main>
  );
}
