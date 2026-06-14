// build-highlight-stubs.ts — Layer 3 of the Tones pipeline (vault-side).
// Reads the classified public/data/highlights.json and writes per-book Kindle
// highlight stubs into the Obsidian vault at NylusS/RAW/kindle/, plus a
// grep-friendly _index.jsonl and a _books.md catalog. Leaf nodes, auto-generated,
// regenerated (and pruned) every run. Feeds the VRC research engine.
import fs from "node:fs";
import path from "node:path";
import type { ClassifiedBook, RawHighlight } from "./lib/highlights";

const SRC = path.resolve(__dirname, "public/data/highlights.json");
const VAULT_PATH = path.resolve(__dirname, "../NylusS"); // mirror build-vault.ts
const OUT_DIR = path.join(VAULT_PATH, "RAW", "kindle");

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/['’"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}

// Stable, collision-safe slug per book id. Same book → same filename each run.
function assignSlugs(books: ClassifiedBook[]): Map<string, string> {
  const used = new Set<string>();
  const out = new Map<string, string>();
  for (const b of books) {
    let s = slugify(b.title);
    if (used.has(s)) s = `${s}-${b.id}`;
    used.add(s);
    out.set(b.id, s);
  }
  return out;
}

const fmtDate = (d: string) => (d || "").slice(0, 10);
const yamlEsc = (s: string) => (s || "").replace(/"/g, '\\"');

function renderStub(b: ClassifiedBook): string {
  const fm = [
    "---",
    "type: kindle-stub",
    "source: kindle-readwise",
    `title: "${yamlEsc(b.title)}"`,
    `author: "${yamlEsc(b.author)}"`,
    `tag: "${yamlEsc(b.tag)}"`,
    `domain_kind: ${b.kind}`,
    `highlights: ${b.highlights.length}`,
    `last_highlighted: ${fmtDate(b.lastHighlightedAt)}`,
    "generated: true",
    "---",
    "",
    "> **AUTO-GENERATED from Readwise. Do not edit — overwritten every `npm run sync`.**",
    "> These are reader-selected excerpts, not the author's full argument.",
    "",
    `# ${b.title}`,
    `*${b.author}* · ${b.tag} · ${b.highlights.length} highlights`,
    "",
    "## Highlights",
    "",
  ].join("\n");
  const body = b.highlights
    .slice()
    .sort((x, y) => (x.location || 0) - (y.location || 0))
    .map((h) => {
      const head = `### loc ${h.location}${h.at ? ` · ${fmtDate(h.at)}` : ""}`;
      const out = [head, h.text || ""];
      if (h.note) out.push("", `**Note:** ${h.note}`);
      return out.join("\n");
    })
    .join("\n\n");
  return `${fm}${body}\n`;
}

function indexLine(b: ClassifiedBook, slug: string, h: RawHighlight): string {
  return JSON.stringify({
    slug,
    title: b.title,
    author: b.author,
    tag: b.tag,
    loc: h.location,
    note: !!h.note,
    text: (h.text || "").replace(/\s+/g, " ").trim(),
  });
}

function renderCatalog(books: ClassifiedBook[], slugs: Map<string, string>): string {
  const head =
    "# Kindle Books — catalog\n\n> Auto-generated. One line per book: title · author · tag · highlights · slug.\n\n";
  const rows = books
    .slice()
    .sort((a, b) => b.numHighlights - a.numHighlights)
    .map(
      (b) =>
        `- **${b.title}** · ${b.author} · ${b.tag} · ${b.numHighlights} · \`${slugs.get(b.id)}\``,
    )
    .join("\n");
  return `${head}${rows}\n`;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`No ${SRC}. Run: npm run highlights && npm run classify first.`);
    process.exit(1);
  }
  const books = JSON.parse(fs.readFileSync(SRC, "utf8")) as ClassifiedBook[];
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const slugs = assignSlugs(books);
  const wanted = new Set<string>(["_index.jsonl", "_books.md"]);

  for (const b of books) {
    const slug = slugs.get(b.id)!;
    wanted.add(`${slug}.md`);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), renderStub(b));
  }

  const idx: string[] = [];
  for (const b of books) {
    const slug = slugs.get(b.id)!;
    for (const h of b.highlights) idx.push(indexLine(b, slug, h));
  }
  fs.writeFileSync(path.join(OUT_DIR, "_index.jsonl"), `${idx.join("\n")}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "_books.md"), renderCatalog(books, slugs));

  let pruned = 0;
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (!wanted.has(f) && (f.endsWith(".md") || f.endsWith(".jsonl"))) {
      fs.unlinkSync(path.join(OUT_DIR, f));
      pruned++;
    }
  }
  console.log(`✓ ${books.length} stubs · ${idx.length} index lines · pruned ${pruned} → ${OUT_DIR}`);
}

main();
