import chokidar from "chokidar";
import { execSync, exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const VAULT_PATH = "C:/Users/apgib/Desktop/NylusS";
const APP_PATH = path.dirname(fileURLToPath(import.meta.url));
const DEBOUNCE_MS = 5000;

let debounceTimer = null;
let running = false;

function log(msg) {
  const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  console.log(`[${time}] ${msg}`);
}

function run() {
  if (running) return;
  running = true;

  log("Vault changed — parsing...");

  try {
    execSync("npm run parse", { cwd: APP_PATH, stdio: "inherit" });
    log("Parse done. Committing...");

    const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    execSync(`git add public/data/`, { cwd: APP_PATH });

    // Check if there's actually anything to commit
    const status = execSync("git status --porcelain public/data/", { cwd: APP_PATH }).toString().trim();
    if (!status) {
      log("No data changes detected — skipping commit.");
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
    /(^|[\/\\])\../, // dotfiles
    /\.obsidian/,    // Obsidian config
    /\.trash/,       // Obsidian trash
    /\.git/,
  ],
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 },
});

watcher
  .on("add", (p) => { log(`New file: ${path.relative(VAULT_PATH, p)}`); schedule(); })
  .on("change", (p) => { log(`Changed: ${path.relative(VAULT_PATH, p)}`); schedule(); })
  .on("unlink", (p) => { log(`Deleted: ${path.relative(VAULT_PATH, p)}`); schedule(); });

log(`Watching vault at ${VAULT_PATH}`);
log(`Changes will sync after ${DEBOUNCE_MS / 1000}s of inactivity.`);
log("Press Ctrl+C to stop.\n");
