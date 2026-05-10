import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { FormField, TextInput } from "../components/ui/FormField";
import { useAuth } from "../state/auth";

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signup({ name, email, password });
      navigate("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={handleSubmit}>
        <h1>Sign up</h1>
        {error ? <ErrorAlert message={error} /> : null}
        <FormField label="Name">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
        </FormField>
        <FormField label="Email">
          <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </FormField>
        <FormField label="Password">
          <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        </FormField>
        <Button disabled={submitting}>{submitting ? "Creating" : "Create account"}</Button>
        <Link to="/login">Use existing account</Link>
      </form>
    </main>
  );
}
