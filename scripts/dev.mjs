import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const backendEnvPath = resolve(rootDir, "backend", ".env");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function readEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return env;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

function startWorkspace(workspace, extraEnv = {}) {
  const options = {
    cwd: rootDir,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv }
  };

  if (process.platform === "win32") {
    return spawn(`npm run dev --workspace ${workspace}`, {
      ...options,
      shell: true
    });
  }

  return spawn(npmCommand, ["run", "dev", "--workspace", workspace], options);
}

function stopChild(child) {
  if (!child.pid || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }

  child.kill("SIGTERM");
}

const backendEnv = readEnvFile(backendEnvPath);
const backend = startWorkspace("backend", backendEnv);
const frontend = startWorkspace("frontend");
const children = [backend, frontend];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    stopChild(child);
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 200);
}

for (const child of children) {
  child.on("exit", (code) => {
    shutdown(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(error);
    shutdown(1);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));