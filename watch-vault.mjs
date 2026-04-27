import chokidar from "chokidar";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, writeFileSync, unlinkSync } from "fs";

const VAULT_PATH = "C:/Users/apgib/Desktop/NylusS";
const APP_PATH = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE = path.join(APP_PATH, ".agent-lock");
const DEBOUNCE_MS = 60000;

let debounceTimer = null;
let running = false;

function log(msg) {
  const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  console.log(`[${time}] ${msg}`);
}

function isLocked() {
  return existsSync(LOCK_FILE);
}

function run() {
  if (running) return;

  // Check for agent lock — log loudly so it's never silent
  if (isLocked()) {
    log("⚠️  Agent lock active — skipping sync. Run `npm run sync` when the agent finishes to clear it.");
    return;
  }

  running = true;
  log("Vault changed — parsing...");

  try {
    execSync("npm run parse", { cwd: APP_PATH, stdio: "inherit" });
    log("Parse done. Committing...");

    const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");

    execSync("git add -A", { cwd: APP_PATH });

    const status = execSync("git status --porcelain", { cwd: APP_PATH }).toString().trim();
    if (!status) {
      log("No changes detected — skipping commit.");
      running = false;
      return;
    }

    execSync(`git commit -m "Auto-sync vault — ${timestamp}"`, { cwd: APP_PATH });
    log("Pushing to GitHub...");
    execSync("git push origin main", { cwd: APP_PATH });
    log("Done. Vercel is rebuilding — live in ~2 min.");
  } catch (err) {
    console.error("Error during sync:", err.message);
  }

  running = false;
}

function schedule() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(run, DEBOUNCE_MS);
}

const watcher = chokidar.watch(VAULT_PATH, {
  ignored: [
    /(^|[\/\\])\../,  // dotfiles
    /\.obsidian/,     // Obsidian config
    /\.trash/,        // Obsidian trash
    /\.git/,
  ],
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 },
});

watcher
  .on("add",    (p) => { log(`New file: ${path.relative(VAULT_PATH, p)}`); schedule(); })
  .on("change", (p) => { log(`Changed: ${path.relative(VAULT_PATH, p)}`); schedule(); })
  .on("unlink", (p) => { log(`Deleted: ${path.relative(VAULT_PATH, p)}`); schedule(); });

log(`Watching vault at ${VAULT_PATH}`);
if (isLocked()) log("⚠️  Agent lock is currently active — auto-sync paused. Run `npm run sync` to clear.");
log(`Changes will sync after ${DEBOUNCE_MS / 1000}s of inactivity (then ~2min Vercel build).`);
log("Press Ctrl+C to stop.\n");
