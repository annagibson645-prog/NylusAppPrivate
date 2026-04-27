import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const APP_PATH = path.dirname(fileURLToPath(import.meta.url));

const status = execSync("git status --porcelain", { cwd: APP_PATH }).toString().trim();
if (!status) {
  console.log("Nothing to commit — already up to date.");
  process.exit(0);
}

const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
execSync("git add -A", { cwd: APP_PATH });
execSync(`git commit -m "Manual sync — ${timestamp}"`, { cwd: APP_PATH, stdio: "inherit" });
console.log("Pushing to GitHub...");
execSync("git push origin main", { cwd: APP_PATH, stdio: "inherit" });
console.log("Done. Vercel is rebuilding — live in ~2 min.");
