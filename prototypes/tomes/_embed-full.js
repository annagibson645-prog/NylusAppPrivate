// One-off: regenerate the 16 sample books with ALL their highlights and splice
// the array into a prototype HTML file. Usage: node _embed-full.js <file.html>
const fs = require("path") && require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const all = JSON.parse(fs.readFileSync(path.join(root, "public/data/highlights.json"), "utf8"));

// Embed ALL books from the real catalog (set EMBED_ALL=0 to use the 16-sample).
const pick = [
  "The Strategist Code", "The Laws of Human Nature", "The Great Mental Models",
  "Manjushri", "On the Warrior's Path", "The Way and the Power",
  "How to Think Like Leonardo Da Vinci", "The Great Work of Your Life",
  "The Artisan Author", "The Path of the Warrior-Mystic", "Introduction to Tantra",
  "The Complete Shiva Purana", "Decoding Greatness", "Accelerated Learning for Expertise",
  "The Simulation Hypothesis", "Subtle Activism",
];
const source = process.env.EMBED_ALL === "0"
  ? pick.map((t) => all.find((x) => x.title === t)).filter(Boolean)
  : all;

const full = source.map((b) => {
  return {
    title: b.title, author: b.author, tag: b.tag, color: b.color, kind: b.kind,
    numHighlights: b.numHighlights, last: b.lastHighlightedAt, activity: b.activity,
    highlights: b.highlights.map((h) => ({
      text: h.text, note: h.note || "", location: h.location, at: (h.at || "").slice(0, 10),
    })),
  };
});

const counts = full.map((b) => b.highlights.length);
console.log("books", full.length, "embedded highlights", counts.reduce((a, b) => a + b, 0), counts.join(","));

const target = process.argv[2] || path.join(__dirname, "A-index.html");
let html = fs.readFileSync(target, "utf8");
const si = html.indexOf("const BOOKS");
const bracketStart = html.indexOf("[", si);
let depth = 0, inStr = false, esc = false, end = -1;
for (let i = bracketStart; i < html.length; i++) {
  const c = html[i];
  if (inStr) {
    if (esc) esc = false;
    else if (c === "\\") esc = true;
    else if (c === '"') inStr = false;
    continue;
  }
  if (c === '"') { inStr = true; continue; }
  if (c === "[") depth++;
  else if (c === "]") { depth--; if (depth === 0) { end = i; break; } }
}
if (end < 0) { console.error("array end not found"); process.exit(1); }
const out = html.slice(0, bracketStart) + JSON.stringify(full) + html.slice(end + 1);
fs.writeFileSync(target, out);
console.log("spliced", path.basename(target), "-> bytes", fs.statSync(target).size);
