import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, unlinkSync } from "fs";

const APP_PATH = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE = path.join(APP_PATH, ".agent-lock");

// Clear agent lock if present
if (existsSync(LOCK_FILE)) {
  unlinkSync(LOCK_FILE);
  console.log("Agent lock cleared.");
}

const status = execSync("git status --porcelain", { cwd: APP_PATH }).toString().trim();
if (!status) {
  console.log("Nothing to commit — already up to date.");
  process.exit(0);
}

const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
execSync("git add -A", { cwd: APP_PATH });
execSync(`git commit -m "Manual sync — ${timestamp}"`, { cwd: APP_PATH, stdio: "inherit" });
// Push, retrying on the HTTP 408 / disconnect failures that big packs hit.
// Each retry resumes cheaply — GitHub keeps the objects that already landed.
const ATTEMPTS = 4;
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  console.log(attempt === 1 ? "Pushing to GitHub..." : `Retrying push (${attempt}/${ATTEMPTS})...`);
  try {
    execSync("git push origin main", { cwd: APP_PATH, stdio: "inherit" });
    console.log("Done. Vercel is rebuilding — live in ~2 min.");
    process.exit(0);
  } catch {
    // A push can fail *after* the ref moved — fetch first so the check is honest.
    try {
      execSync("git fetch origin main", { cwd: APP_PATH, stdio: "ignore" });
      const ahead = execSync("git rev-list --count origin/main..main", { cwd: APP_PATH }).toString().trim();
      if (ahead === "0") {
        console.log("Push landed despite the error. Vercel is rebuilding — live in ~2 min.");
        process.exit(0);
      }
    } catch {
      // Fetch failed too — connection is down. Fall through and retry.
    }
    if (attempt < ATTEMPTS) {
      const wait = attempt * 10;
      console.log(`Push failed. Waiting ${wait}s...`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait * 1000);
    }
  }
}

console.error(`\nPush failed after ${ATTEMPTS} attempts. Your work IS committed locally — nothing is lost.`);
console.error("Run `git push origin main` again when the connection is better.");
process.exit(1);
