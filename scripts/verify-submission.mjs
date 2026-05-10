import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "README.md",
  "infra/railway/deployment-notes.md",
  "infra/railway/smoke-test.md",
  "docs/demo-script.md",
  "docs/submission-checklist.md"
];

const missing = requiredFiles.filter((file) => !existsSync(resolve(root, file)));
if (missing.length > 0) {
  console.error(`Missing submission files: ${missing.join(", ")}`);
  process.exit(1);
}

const readme = readFileSync(resolve(root, "README.md"), "utf8").toLowerCase();
const requiredSections = ["overview", "local setup", "environment", "database", "railway", "live url", "demo video"];
const missingSections = requiredSections.filter((section) => !readme.includes(section));
if (missingSections.length > 0) {
  console.error(`README is missing sections: ${missingSections.join(", ")}`);
  process.exit(1);
}

console.log("Submission artifacts are present and README sections are covered.");
