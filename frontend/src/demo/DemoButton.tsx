import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { enableDemoMode } from "./demoApi";
import { useAuth } from "../state/auth";

export function DemoButton() {
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleClick() {
    enableDemoMode();
    await login({ email: "demo@teamflow.local", password: "demo-workspace" });
    navigate("/dashboard");
  }

  return (
    <Button type="button" variant="secondary" onClick={() => void handleClick()}>
      Open demo workspace
    </Button>
  );
}