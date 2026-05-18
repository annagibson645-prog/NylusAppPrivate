// lint-hubs.mjs
// Scans all hub files for truncated wikilinks — lines that open [[ but never
// close with ]]. Run with: npm run lint-hubs
// Also runs automatically at the top of every `npm run sync` via build-vault.ts.
//
// Exit code: 0 = clean, 1 = errors found.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HUBS_DIR = path.resolve(__dirname, "../NylusS/ARCHIVES/concepts/hubs");

// A line has a truncated link if it contains [[ but no closing ]] on the same line
const TRUNCATED = /\[\[[^\]]*$/;

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(full));
    else if (entry.name.endsWith(".md")) results.push(full);
  }
  return results;
}

let errorCount = 0;

if (!fs.existsSync(HUBS_DIR)) {
  console.error("Hubs directory not found:", HUBS_DIR);
  process.exit(1);
}

for (const hubFile of walkDir(HUBS_DIR)) {
  const relFile = path.relative(HUBS_DIR, hubFile);
  const lines = fs.readFileSync(hubFile, "utf-8").split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (TRUNCATED.test(lines[i])) {
      const preview = lines[i].trim().slice(0, 90);
      console.warn(`⚠️  ${relFile}  line ${i + 1}`);
      console.warn(`   → ${preview}…`);
      errorCount++;
    }
  }
}

if (errorCount === 0) {
  console.log(`✅ All hub files clean — no truncated wikilinks.`);
  process.exit(0);
} else {
  console.warn(`\n⛔ ${errorCount} truncated wikilink(s) found.`);
  console.warn(`   Concepts on those lines will be orphaned (hub=undefined) in graph.json.`);
  console.warn(`   Fix them, then re-run: npm run sync\n`);
  process.exit(1);
}
