# Kindle Highlights → VRC Research Bridge

*Design spec · 2026-06-14*

## Goal

Let the Vault Research Console (VRC) draw on the user's Kindle highlights — synced
daily from Readwise — as **(a)** a grounded evidence layer cited inside research
reports and **(b)** a discovery feed that flags un-ingested books worth turning into
vault pages. Do this **without ripping quotes out of context**, and without making
the user do any ongoing work.

## Background — the two systems today

- **The vault** (`NylusS/`, Obsidian markdown) is the knowledge source of truth.
  VRC reads *only* vault markdown (`ARCHIVES/index.md` → domain-indexes → hubs →
  concept pages) and files reports to `The Platform/Research/`.
- **The website** (`nyluss-app/`, Next.js, git) runs the daily sync:
  `npm run sync` = `parse` (vault → site JSON) → `highlights` (Readwise →
  `public/data/highlights.json`) → `classify` (AI domain/genre tags) →
  `sync-once.mjs` (commit + push → Vercel).
- **The gap:** the Kindle highlights exist only as JSON in the website repo. The
  vault has never seen them, so VRC cannot synthesize from them.

The highlights JSON is rich per book: `title`, `author`, AI-assigned `tag`
(one of the 8 vault domains, or a genre, or "Unclassified"), `kind`,
`numHighlights`, `lastHighlightedAt`, and `highlights[]` of `{ text, note,
location, at }`. ~221 books / ~5,267 highlights today.

## Approach (chosen)

**Approach C — per-book markdown stubs in the vault — plus a two-stage retrieval
protocol in VRC.** Highlights become first-class, leaf-node vault objects that VRC
can grep, read in full, cite, and wiki-link. Generation is automated into the
existing daily sync, so the user does no ongoing work.

Rejected alternatives:
- **A — vault-local JSON mirror + grep index.** Robust and light, but highlights
  stay an opaque blob, not citable vault objects. (We keep its *index* idea inside C.)
- **B — cross-repo read** of `nyluss-app/public/data/highlights.json`. Fragile:
  depends on the vault session being able to see the website folder; breaks VRC's
  "everything I need is in the vault" assumption.

## Architecture

```
Readwise API
   │  build-highlights.ts        (existing)
   ▼
public/data/highlights.json      (existing, in nyluss-app)
   │  classify-highlights.ts     (existing — domain/genre tags)
   ▼
highlights.json (classified)
   │  build-highlight-stubs.ts   (NEW — writes into the vault)
   ▼
NylusS/RAW/kindle/
   ├── <slug>.md          one stub per book (leaf node, auto-generated)
   ├── _index.jsonl       one line per highlight  (cheap retrieval layer)
   └── _books.md          one line per book catalog (book-level browse)
   │
   ▼  VRC reads these during research
The Platform/Research/<report>.md   (evidence cited + ingest candidates flagged)
```

### Component 1 — `build-highlight-stubs.ts` (generator)

- Lives in `nyluss-app/` next to `build-highlights.ts`. Run with `npx tsx`.
- **One job:** read the classified `public/data/highlights.json`, write the vault's
  `RAW/kindle/` tree. No network, no AI.
- **Vault path:** reuse however `build-vault.ts` already locates the vault (env var
  / relative path). Single source of truth for the path.
- **Idempotent + self-pruning:** regenerate the full `RAW/kindle/` set each run;
  delete stubs for books no longer present in `highlights.json` so removed books
  don't linger.
- **Slugging:** stable, collision-safe slug from `title` (+ short id suffix on
  collision). Same book → same filename across runs.
- Writes `_index.jsonl` and `_books.md` in the same pass.

### Component 2 — `RAW/kindle/` (the data home)

**Per-book stub `RAW/kindle/<slug>.md`:**

```markdown
---
type: kindle-stub
source: kindle-readwise
title: "The Strategist Code"
author: "Johnny Welch"
tag: "Business"          # AI-assigned: one of 8 domains | genre | Unclassified
domain_kind: domain      # domain | genre | unclassified
highlights: 373
last_highlighted: 2025-05-08
generated: true          # AUTO-GENERATED — do not edit; overwritten every sync
---

> **AUTO-GENERATED from Readwise. Do not edit — regenerated every `npm run sync`.**
> These are reader-selected excerpts, not the author's full argument.

## Highlights

### loc 194 · 2025-03-25
In fact, Carteaux, who had been hastily promoted, had no strategy at all…
**Note:** <user note if present>

### loc 203 · 2025-03-25
…
```

- **Leaf node:** no outbound wiki-links (same rule as source stubs). Concept pages
  and VRC reports may link *to* a stub; the stub links to nothing.
- Highlights in `location` order; each carries `loc`, date, text, and the user note.

**`_index.jsonl`** — one JSON object per highlight, for fast `grep`:

```
{"slug":"the-strategist-code","title":"The Strategist Code","author":"Johnny Welch","tag":"Business","loc":194,"note":false,"text":"In fact, Carteaux, who had been hastily promoted, had no strategy at all…"}
```

Substring `grep` over this file is the cheap retrieval layer (~5,267 lines).

**`_books.md`** — one line per book (title · author · tag · count · slug) for
book-level browsing and the shortlist step.

### Component 3 — VRC skill: the "Kindle Highlights Layer"

A new section added to `NylusS/.claude/skills/vault-research-console/SKILL.md`
defining the protocol. Key rules:

**Two-stage retrieval (the context-fidelity guard):**
1. **Retrieve (cheap):** `grep` `RAW/kindle/_index.jsonl` (and `_books.md`) for the
   topic's keywords → a **shortlist of ≤6 books** + which lines matched. No quoting yet.
2. **Read in full (the guard):** for each shortlisted book, open its **entire** stub
   and read the whole highlight set *before* any quote is used. A line is only
   citable once its siblings have been read. Budget note: even the largest book
   (~373 highlights) is ~15K tokens; a 3–6 book shortlist is ~20–60K tokens.

**Fidelity rules (mandatory):**
- Highlights are **reader-selected excerpts.** Cite as *"a passage you marked in
  [Title]"* — never *"the book argues X"* (the surrounding prose isn't available).
- The **`note`** on a highlight is first-class intent signal — treat it as the
  user's own gloss, never noise.
- **Never quote a lone matched line** without the context of the book's other
  highlights. Preserve contradictions; don't smooth them.
- A single highlight is **weak corroboration** — tag confidence accordingly; it does
  not override vault scholarship. Highlights are supplementary evidence + discovery,
  not authority.

**Output integration (the "Both" behaviour):**
- **Evidence:** reports gain a *"From your Kindle highlights"* subsection in the
  coverage map — relevant marked passages cited with book + `loc`, optionally
  wiki-linked to the stub `[[RAW/kindle/<slug>|Title — Kindle highlights]]`.
- **Discovery:** a *"Worth ingesting"* flag — when a shortlisted book has rich,
  relevant highlights but **no** corresponding vault concept/source page, VRC names
  it as an ingest candidate (title + why relevant + the un-ingested quotes that
  matter). This is the Readwise → vault bridge.

### Component 4 — sync wiring

`package.json` `sync` script gains one step **after** classify:

```
"sync": "npm run parse && npm run highlights && npm run classify && npm run stubs && node sync-once.mjs",
"stubs": "npx tsx build-highlight-stubs.ts"
```

Stubs write into the vault (not the website repo), so `sync-once.mjs` (which commits
the website repo) ignores them — no git noise. The user keeps running `npm run sync`;
nothing else changes for them.

## Data flow (end to end)

Readwise → `highlights.json` → classify (tags) → `build-highlight-stubs.ts` →
`RAW/kindle/{stubs, _index.jsonl, _books.md}` → VRC (grep index → read shortlisted
stubs in full → synthesize) → report in `The Platform/Research/` with cited
passages and ingest candidates.

## Edge cases & decisions

- **Unclassified books** still get a stub (`tag: Unclassified`).
- **Removed books** are pruned from `RAW/kindle/` each run (self-healing).
- **Graph clutter:** `RAW/kindle/` is leaf-node only; recommend excluding it from the
  Obsidian graph view (a one-time filter, documented for the user).
- **Stub edits:** stubs are regenerated each sync — the "do not edit" banner makes
  this explicit; the user's own thoughts continue to go in real concept pages.
- **Index format:** JSONL (not TSV) so highlight text with tabs/quotes is safe;
  substring `grep` still works on the raw line.

## Out of scope (YAGNI)

- No semantic/vector search — keyword `grep` over the shortlist is enough at this
  scale and keeps everything inspectable.
- No automatic ingestion — VRC *flags* ingest candidates; turning a book into vault
  pages stays a deliberate, user-invoked DEEP INGEST.
- No website changes — `/tones` already renders highlights from `highlights.json`;
  the stubs are purely a vault-side research input.
- No edits to the existing `build-highlights.ts` / `classify-highlights.ts`.

## Success criteria

1. After `npm run sync`, `RAW/kindle/` contains one stub per current book plus
   `_index.jsonl` and `_books.md`, and stale stubs are gone.
2. A VRC research run on a topic can: grep the index, read the shortlisted books'
   full highlights, cite relevant marked passages with correct book + `loc`, and
   flag at least one ingest candidate when a relevant book has no vault page.
3. No highlight is ever cited as the author's voice; every cited passage is framed
   as a reader-selected excerpt with its note preserved.
4. The user's only step remains `npm run sync`.
