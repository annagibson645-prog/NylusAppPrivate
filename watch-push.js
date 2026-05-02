/**
 * watch-push.js — auto-commit + push on every save
 * node watch-push.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DEBOUNCE_MS = 6000;
const IGNORE = new Set(['.git', 'node_modules', '.next', '.turbo', 'watch-push.js']);

let timer = null;
let pending = false;

function log(msg) {
  const t = new Date().toLocaleTimeString();
  console.log(`[${t}] ${msg}`);
}

function push() {
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
    if (!status) { log('Nothing to push.'); return; }
    log('Committing and pushing...');
    execSync('git add -A', { cwd: ROOT });
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    execSync(`git commit -m "auto: save ${stamp}"`, { cwd: ROOT });
    execSync('git push origin main', { cwd: ROOT });
    log('✓ Pushed — Vercel is rebuilding.');
  } catch (err) {
    log('⚠ Push failed: ' + err.message.split('\n')[0]);
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  if (!pending) { pending = true; log('Change detected — settling...'); }
  timer = setTimeout(() => { pending = false; push(); }, DEBOUNCE_MS);
}

function watch(dir) {
  try {
    fs.watch(dir, { recursive: true }, (_, filename) => {
      if (!filename) return;
      const parts = filename.split(path.sep);
      if (parts.some(p => IGNORE.has(p))) return;
      if (filename.endsWith('.swp') || filename.endsWith('~')) return;
      schedule();
    });
  } catch (e) { log('Watch error: ' + e.message); }
}

log('👁  Watcher running — auto-push on save.');
log('   Leave this window open. Ctrl+C to stop.\n');

// Push any changes that existed before watcher started
const existing = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
if (existing) {
  log('Pending changes found — pushing now...');
  push();
}

watch(ROOT);
