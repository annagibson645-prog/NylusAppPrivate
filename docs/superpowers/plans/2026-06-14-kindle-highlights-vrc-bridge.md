# Kindle Highlights → VRC Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate per-book Kindle highlight stubs (+ a grep index and catalog) into the Obsidian vault from the existing classified `highlights.json`, and teach the VRC skill to use them with a context-safe two-stage retrieval protocol.

**Architecture:** A new `build-highlight-stubs.ts` runs as a step in `npm run sync` (after `classify`). It reads `public/data/highlights.json` and writes `NylusS/RAW/kindle/` — one leaf-node stub per book, `_index.jsonl` (one line per highlight), `_books.md` (catalog) — pruning stale files each run. The VRC skill gains a "Kindle Highlights Layer" section: grep the index → shortlist ≤6 books → read each shortlisted book's full stub before quoting → cite as reader-selected excerpts + flag ingest candidates.

**Tech Stack:** TypeScript run via `tsx`, Node `fs`/`path`, existing `lib/highlights.ts` types. No new dependencies. No unit-test runner in this repo — verification is integration-style (run the generator, inspect output).

**Note on branch/side-effects:** `nyluss-app` is on `main` (per user's session workflow). The generator writes ~221 files into the live vault at `NylusS/RAW/kindle/` — that is the feature working, not a test artifact.

---

## File Structure

- **Create** `nyluss-app/build-highlight-stubs.ts` — the generator (one job: classified JSON → vault stubs + index + catalog, with pruning).
- **Modify** `nyluss-app/package.json` — add `stubs` script and chain it into `sync` after `classify`.
- **Create (generated, not hand-written)** `NylusS/RAW/kindle/<slug>.md`, `_index.jsonl`, `_books.md` — produced by running the generator.
- **Modify** `NylusS/.claude/skills/vault-research-console/SKILL.md` — add the "Kindle Highlights Layer" protocol section.

---

### Task 1: The stub generator

**Files:**
- Create: `nyluss-app/build-highlight-stubs.ts`

- [ ] **Step 1: Write the generator**

Create `nyluss-app/build-highlight-stubs.ts`:

```ts
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
    title.toLowerCase()
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
```

- [ ] **Step 2: Type-check the new file compiles**

Run: `cd /c/Users/apgib/Desktop/nyluss-app && npx tsc --noEmit build-highlight-stubs.ts 2>&1 | grep -v "\.test\.ts" | grep "error TS" ; echo DONE`
Expected: only `DONE` (no `error TS` lines referencing `build-highlight-stubs.ts`).

- [ ] **Step 3: Commit**

```bash
git add build-highlight-stubs.ts
git commit -m "feat: generate Kindle highlight stubs into the vault for VRC"
```

---

### Task 2: Wire the generator into the sync

**Files:**
- Modify: `nyluss-app/package.json` (`scripts`)

- [ ] **Step 1: Add the `stubs` script and chain it into `sync`**

In `package.json` `scripts`, add a `stubs` entry and insert `npm run stubs` into `sync` after `classify`:

```json
"stubs": "npx tsx build-highlight-stubs.ts",
"sync": "npm run parse && npm run highlights && npm run classify && npm run stubs && node sync-once.mjs",
```

- [ ] **Step 2: Verify the script is registered**

Run: `node -e "console.log(require('./package.json').scripts.stubs, '||', require('./package.json').scripts.sync)"`
Expected: prints the `stubs` command and a `sync` line containing `npm run stubs` between `classify` and `sync-once.mjs`.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: run highlight-stub generation as part of npm run sync"
```

---

### Task 3: Run the generator and verify the vault output

**Files:**
- Generated: `NylusS/RAW/kindle/*`

- [ ] **Step 1: Run the generator**

Run: `cd /c/Users/apgib/Desktop/nyluss-app && npm run stubs`
Expected: a line like `✓ 221 stubs · 5267 index lines · pruned 0 → …NylusS\RAW\kindle`.

- [ ] **Step 2: Verify files exist and counts match**

Run:
```bash
cd /c/Users/apgib/Desktop/NylusS/RAW/kindle && \
echo "stub files: $(ls *.md | grep -v '^_' | wc -l)" && \
echo "index lines: $(wc -l < _index.jsonl)" && \
echo "catalog exists: $(test -f _books.md && echo yes)"
```
Expected: `stub files: 221`, `index lines: 5267` (±, must equal the generator's report), `catalog exists: yes`.

- [ ] **Step 3: Spot-check a stub and an index line**

Run:
```bash
cd /c/Users/apgib/Desktop/NylusS/RAW/kindle && \
head -16 the-strategist-code.md && echo "---INDEX---" && \
grep -m1 "strategist" _index.jsonl | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s.split('\n')[0])))"
```
Expected: stub frontmatter shows `type: kindle-stub`, `tag: "Business"`, the "do not edit" banner, and `## Highlights`; the index line parses as JSON with `slug`, `title`, `loc`, `text`.

- [ ] **Step 4: Verify pruning works (idempotent + self-healing)**

Run:
```bash
cd /c/Users/apgib/Desktop/NylusS/RAW/kindle && touch _stale-test.md && \
cd /c/Users/apgib/Desktop/nyluss-app && npm run stubs && \
test ! -f /c/Users/apgib/Desktop/NylusS/RAW/kindle/_stale-test.md && echo "PRUNED OK"
```
Expected: `PRUNED OK` (the fake stale file was removed; report shows `pruned 1`).

No commit — these files live in the (non-git) vault.

---

### Task 4: Teach VRC the Kindle Highlights Layer

**Files:**
- Modify: `NylusS/.claude/skills/vault-research-console/SKILL.md`

- [ ] **Step 1: Insert the protocol section**

Add the following section to `SKILL.md`, immediately **before** the `## Hard Constraints (from CLAUDE.md)` section:

```markdown
## The Kindle Highlights Layer

The vault now carries the user's Kindle highlights (synced daily from Readwise) as
leaf-node stubs in `RAW/kindle/`: one `<slug>.md` per book, a grep index
`_index.jsonl` (one line per highlight), and a `_books.md` catalog. Every VRC mode
may draw on these — as **evidence** to cite and as a **discovery feed** for what's
worth ingesting — under one non-negotiable protocol.

### Two-stage retrieval (the context-fidelity guard)
1. **Retrieve (cheap).** `grep` the topic's keywords against `RAW/kindle/_index.jsonl`
   (and `_books.md` for book/author hits). Produce a **shortlist of ≤6 books** and
   note which lines matched. Do NOT quote anything yet.
2. **Read in full (the guard).** For each shortlisted book, open its **entire** stub
   `RAW/kindle/<slug>.md` and read the whole highlight set before using any quote. A
   line becomes citable only after its siblings have been read. (Budget: even a
   ~370-highlight book is ~15K tokens; a 3–6 book shortlist is ~20–60K tokens.)

### Fidelity rules (mandatory)
- Highlights are **reader-selected excerpts.** Cite as *"a passage you marked in
  [Title]"* — never *"the book argues X."* The surrounding prose is not available.
- A highlight's **note is first-class** — it is the user's own gloss on why the
  passage mattered. Treat it as intent, never noise.
- **Never quote a lone matched line** without the context of the book's other
  highlights. Preserve contradictions; do not smooth them.
- A single highlight is **weak corroboration** — tag confidence accordingly. The
  highlights layer supplements vault scholarship; it never overrides it.

### Output integration
- **Evidence.** In any report's coverage map, add a *"From your Kindle highlights"*
  subsection: relevant marked passages cited with **book + loc**, optionally
  wiki-linked to the stub `[[RAW/kindle/<slug>|Title — Kindle highlights]]`.
- **Discovery.** Add a *"Worth ingesting"* flag whenever a shortlisted book has
  rich, relevant highlights but **no** corresponding vault concept/source page —
  name the book, why it's relevant, and the specific un-ingested quotes. This is the
  Readwise → vault bridge; it flags candidates only, never auto-ingests (a DEEP
  INGEST stays user-invoked).
```

- [ ] **Step 2: Verify the section is present and well-formed**

Run: `grep -nE "Kindle Highlights Layer|Two-stage retrieval|Worth ingesting" "/c/Users/apgib/Desktop/NylusS/.claude/skills/vault-research-console/SKILL.md"`
Expected: three matching lines (the heading, the protocol subhead, the discovery flag).

No commit — the vault is not a git repo.

---

### Task 5: End-to-end smoke check

- [ ] **Step 1: Simulate a VRC retrieve on a real topic**

Run:
```bash
cd /c/Users/apgib/Desktop/NylusS/RAW/kindle && \
echo "books mentioning 'strategy':" && \
grep -i "strategy" _index.jsonl | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const b={};s.trim().split('\n').forEach(l=>{const o=JSON.parse(l);b[o.title]=(b[o.title]||0)+1});Object.entries(b).sort((a,c)=>c[1]-a[1]).slice(0,6).forEach(([t,n])=>console.log(n,t))})"
```
Expected: a ranked shortlist of ≤6 books with match counts (the "retrieve" stage working over real data) — confirming VRC can grep the index to shortlist before reading stubs in full.

- [ ] **Step 2: Confirm a shortlisted book's full stub is readable**

Run: `wc -l /c/Users/apgib/Desktop/NylusS/RAW/kindle/the-strategist-code.md`
Expected: a multi-hundred-line file (the full highlight set available for the "read in full" stage).

---

## Self-Review

- **Spec coverage:** generator (Task 1), sync wiring (Task 2), vault output incl. stubs/index/catalog/pruning (Task 3), VRC two-stage + fidelity + evidence + discovery (Task 4), retrieve-then-read smoke test (Task 5). All spec sections covered.
- **Placeholders:** none — full generator code and full SKILL.md section included.
- **Type consistency:** uses `ClassifiedBook`/`RawHighlight` from `lib/highlights.ts`; `lastHighlightedAt`, `highlights[]`, `location`, `at`, `note`, `tag`, `kind`, `numHighlights` match that type. Slug map keyed by `b.id` throughout.
- **Out of scope (per spec):** no semantic search, no auto-ingest, no website changes, no edits to `build-highlights.ts`/`classify-highlights.ts`.
