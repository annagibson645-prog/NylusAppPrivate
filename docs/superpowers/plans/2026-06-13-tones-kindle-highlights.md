# Tones — Kindle Highlights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/tones` page ("Tomes of Interest") that shows all Kindle highlights from Readwise as a sortable, searchable Ledger, with each book colored/tagged by an AI-classified vault domain or genre.

**Architecture:** Two decoupled build-time layers + a client page. Layer 1 (`build-highlights.ts`) pulls books from the Readwise Export API and writes raw `public/data/highlights.json`. Layer 2 (`classify-highlights.ts`) is an additive enrichment pass that classifies only unseen books with the Anthropic API, caches results, and merges color/tag back into the JSON. The page (`app/tones/page.tsx`) clones the existing `/sparks` pattern (NavG header, fetch JSON, void+sepia theme). Both layers degrade gracefully: no Readwise token → sample data; no Anthropic key → books render "Unclassified".

**Tech Stack:** Next.js 16 (App Router, RSC + client components), TypeScript, `npx tsx` for build scripts, `@anthropic-ai/sdk`, `dotenv`. Pure helper functions tested with `node:test` via `npx tsx --test` (no new test-runner dependency).

---

### Task 1: Dependencies + environment scaffolding

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Modify: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Install the two build-only dependencies**

Run:
```bash
npm install --save-dev @anthropic-ai/sdk dotenv
```
Expected: `package.json` devDependencies now include `@anthropic-ai/sdk` and `dotenv`; no errors.

- [ ] **Step 2: Add the highlights/classify/sync scripts to `package.json`**

In `package.json`, replace the `scripts` block's `sync` line and add two new scripts so the block reads:
```json
  "scripts": {
    "parse": "npx tsx build-vault.ts",
    "dev": "npm run parse && next dev",
    "build": "next build",
    "start": "next start",
    "watch": "node watch-vault.mjs",
    "agent-start": "node -e \"require('fs').writeFileSync('.agent-lock','')\" && echo Agent lock set — watcher paused.",
    "lint-hubs": "node lint-hubs.mjs",
    "highlights": "npx tsx build-highlights.ts",
    "classify": "npx tsx classify-highlights.ts",
    "sync": "npm run parse && npm run highlights && npm run classify && node sync-once.mjs"
  },
```

- [ ] **Step 3: Allow `.env.example` through gitignore**

The `.gitignore` already has `.env*` (ignores everything). Add an exception immediately after that line so the example template is committable. Find:
```
# env files (can opt-in for committing if needed)
.env*
```
and change to:
```
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

- [ ] **Step 4: Create `.env.example`**

Create `.env.example`:
```
# Readwise Export API token — https://readwise.io/access_token
READWISE_TOKEN=

# Anthropic API key for the highlights classification layer — https://console.anthropic.com/
ANTHROPIC_API_KEY=
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example
git commit -m "chore: add anthropic+dotenv deps and tones build scripts"
```

---

### Task 2: Shared types + pure resolvers (`lib/highlights.ts`)

**Files:**
- Create: `lib/highlights.ts`
- Test: `lib/highlights.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/highlights.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveTag, bucketActivity, hashIndex, DOMAIN_COLORS } from "./highlights";

test("resolveTag: known domain → domain color + label", () => {
  const r = resolveTag("eastern-spirituality", null);
  assert.equal(r.kind, "domain");
  assert.equal(r.tag, "Eastern Spirituality");
  assert.equal(r.color, DOMAIN_COLORS["eastern-spirituality"]);
});

test("resolveTag: genre (no domain) → genre tag + palette color", () => {
  const r = resolveTag(null, "Science Fiction");
  assert.equal(r.kind, "genre");
  assert.equal(r.tag, "Science Fiction");
  assert.match(r.color, /^#[0-9a-f]{6}$/i);
});

test("resolveTag: same genre always maps to same color (stable hash)", () => {
  assert.equal(resolveTag(null, "Biography").color, resolveTag(null, "Biography").color);
});

test("resolveTag: nothing → unclassified", () => {
  const r = resolveTag(null, null);
  assert.equal(r.kind, "unclassified");
  assert.equal(r.tag, "Unclassified");
});

test("resolveTag: unknown domain string falls back to genre/unclassified", () => {
  assert.equal(resolveTag("not-a-domain", null).kind, "unclassified");
});

test("hashIndex is deterministic and in range", () => {
  assert.equal(hashIndex("abc", 10), hashIndex("abc", 10));
  assert.ok(hashIndex("abc", 10) >= 0 && hashIndex("abc", 10) < 10);
});

test("bucketActivity: counts dates into the correct weekly buckets", () => {
  const now = new Date("2026-06-13T00:00:00Z");
  const week = 7 * 24 * 3600 * 1000;
  const dates = [
    "2026-06-12T00:00:00Z",                       // this week → last bucket
    new Date(now.getTime() - week).toISOString(), // last bucket-1
    "2020-01-01T00:00:00Z",                       // far past → dropped
  ];
  const out = bucketActivity(dates, now, 12);
  assert.equal(out.length, 12);
  assert.equal(out[11], 1);
  assert.equal(out[10], 1);
  assert.equal(out.reduce((a, b) => a + b, 0), 2);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test lib/highlights.test.ts`
Expected: FAIL — cannot find module `./highlights`.

- [ ] **Step 3: Write `lib/highlights.ts`**

Create `lib/highlights.ts`:
```ts
// lib/highlights.ts — shared types + pure resolvers for the Tones (Kindle
// highlights) section. Used by build-highlights.ts, classify-highlights.ts,
// and app/tones/page.tsx so the color/tag rules live in exactly one place.

// Canonical domain colors — mirror build-vault.ts DOMAIN_COLORS (vault graph
// source of truth).
export const DOMAIN_COLORS: Record<string, string> = {
  history: "#e6c068",
  "eastern-spirituality": "#dc2626",
  psychology: "#f59e0b",
  "behavioral-mechanics": "#a78bfa",
  "cross-domain": "#38bdf8",
  "creative-practice": "#14b8a6",
  "african-spirituality": "#34d399",
  business: "#e879a0",
};

export const DOMAIN_LABELS: Record<string, string> = {
  history: "History",
  "eastern-spirituality": "Eastern Spirituality",
  psychology: "Psychology",
  "behavioral-mechanics": "Behavioral Mechanics",
  "cross-domain": "Cross-Domain",
  "creative-practice": "Creative Practice",
  "african-spirituality": "African Spirituality",
  business: "Business",
};

export const DOMAIN_SLUGS = Object.keys(DOMAIN_COLORS);

// Secondary palette for non-domain genres — muted tones, visually distinct from
// the vivid domain hues so domain books still pop.
export const GENRE_PALETTE = [
  "#b5916a", "#7b8aa8", "#8a9a7b", "#a87b8a", "#7b9aa8",
  "#9a8ab5", "#a89a6a", "#6a9a8a", "#b08552", "#8a7b9a",
];

export const UNCLASSIFIED_COLOR = "#9aa0a6";

export type BookKind = "domain" | "genre" | "unclassified";

export interface RawHighlight {
  id: string;
  text: string;
  note: string;
  location: number;
  at: string; // ISO date of highlighted_at (or "")
}

export interface ClassifiedBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  numHighlights: number;
  lastHighlightedAt: string;
  kind: BookKind;
  domain: string | null;
  genre: string | null;
  tag: string;
  color: string;
  activity: number[];
  highlights: RawHighlight[];
}

// Deterministic string → [0, mod) hash for stable genre color assignment.
export function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

export function resolveTag(
  domain: string | null,
  genre: string | null,
): { kind: BookKind; tag: string; color: string } {
  if (domain && DOMAIN_COLORS[domain]) {
    return { kind: "domain", tag: DOMAIN_LABELS[domain], color: DOMAIN_COLORS[domain] };
  }
  const g = (genre || "").trim();
  if (g) {
    return { kind: "genre", tag: g, color: GENRE_PALETTE[hashIndex(g.toLowerCase(), GENRE_PALETTE.length)] };
  }
  return { kind: "unclassified", tag: "Unclassified", color: UNCLASSIFIED_COLOR };
}

// Bucket ISO highlight dates into `buckets` weekly counts ending at `now`.
export function bucketActivity(
  dates: string[],
  now: Date,
  buckets = 12,
  msPerBucket = 7 * 24 * 3600 * 1000,
): number[] {
  const out = new Array(buckets).fill(0);
  const end = now.getTime();
  for (const d of dates) {
    const t = Date.parse(d);
    if (Number.isNaN(t)) continue;
    const ago = end - t;
    if (ago < 0) continue;
    const idx = buckets - 1 - Math.floor(ago / msPerBucket);
    if (idx >= 0 && idx < buckets) out[idx]++;
  }
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx --test lib/highlights.test.ts`
Expected: PASS — all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/highlights.ts lib/highlights.test.ts
git commit -m "feat: shared types + pure color/tag/activity resolvers for tones"
```

---

### Task 3: Layer 1 — Readwise sync (`build-highlights.ts`)

**Files:**
- Create: `build-highlights.ts`
- Output: `public/data/highlights.json` (generated, committed)

- [ ] **Step 1: Write `build-highlights.ts`**

Create `build-highlights.ts`:
```ts
// build-highlights.ts — Layer 1 of the Tones section.
// Pulls Kindle books + highlights from the Readwise Export API and writes the
// RAW public/data/highlights.json. No AI here. If READWISE_TOKEN is absent we
// write a small sample so /tones still renders during local dev.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import {
  bucketActivity,
  resolveTag,
  type ClassifiedBook,
  type RawHighlight,
} from "./lib/highlights";

const OUT = path.resolve(__dirname, "public/data/highlights.json");
const TOKEN = process.env.READWISE_TOKEN;

interface RWHighlight {
  id: number; text: string; note: string | null; location: number | null;
  highlighted_at: string | null;
}
interface RWBook {
  user_book_id: number; title: string; author: string | null;
  cover_image_url: string | null; category: string; num_highlights: number;
  last_highlight_at: string | null; highlights: RWHighlight[];
}

async function fetchAll(): Promise<RWBook[]> {
  const books: RWBook[] = [];
  let cursor: string | null = null;
  do {
    const url = new URL("https://readwise.io/api/v2/export/");
    if (cursor) url.searchParams.set("pageCursor", cursor);
    const res = await fetch(url, { headers: { Authorization: `Token ${TOKEN}` } });
    if (!res.ok) throw new Error(`Readwise ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { results: RWBook[]; nextPageCursor: string | null };
    books.push(...json.results);
    cursor = json.nextPageCursor;
  } while (cursor);
  return books;
}

function toClassifiedBook(b: RWBook, now: Date): ClassifiedBook {
  const highlights: RawHighlight[] = (b.highlights || []).map((h) => ({
    id: String(h.id),
    text: h.text || "",
    note: h.note || "",
    location: h.location ?? 0,
    at: h.highlighted_at || "",
  }));
  // Layer 1 leaves classification empty → "Unclassified" until Layer 2 runs.
  const { kind, tag, color } = resolveTag(null, null);
  return {
    id: String(b.user_book_id),
    title: b.title || "Untitled",
    author: b.author || "Unknown",
    cover: b.cover_image_url || "",
    numHighlights: b.num_highlights ?? highlights.length,
    lastHighlightedAt: (b.last_highlight_at || "").slice(0, 10),
    kind, domain: null, genre: null, tag, color,
    activity: bucketActivity(highlights.map((h) => h.at), now),
    highlights,
  };
}

function sampleBooks(): ClassifiedBook[] {
  const now = new Date();
  const mk = (
    id: string, title: string, author: string,
    domain: string | null, genre: string | null, n: number, last: string,
    quotes: string[],
  ): ClassifiedBook => {
    const { kind, tag, color } = resolveTag(domain, genre);
    return {
      id, title, author, cover: "", numHighlights: n, lastHighlightedAt: last,
      kind, domain, genre, tag, color,
      activity: Array.from({ length: 12 }, (_, i) => Math.round(Math.abs(Math.sin(n * 0.7 + i)) * 3)),
      highlights: quotes.map((q, i) => ({ id: `${id}-${i}`, text: q, note: "", location: 380 + i * 157, at: last })),
    };
  };
  return [
    mk("s1", "Tantra Illuminated", "Christopher Wallis", "eastern-spirituality", null, 412, "2026-06-04",
      ["The mala is not a substance to be removed but ignorance to be seen through.", "Modern yoga descends from Tantra, not from Patañjali."]),
    mk("s2", "The Rasputin File", "Edvard Radzinsky", "history", null, 188, "2026-06-13",
      ["The watch outlived the confession.", "The File testimony was eighty percent unmined."]),
    mk("s3", "The 48 Laws of Power", "Robert Greene", "behavioral-mechanics", null, 204, "2026-04-19",
      ["Never outshine the master.", "Conceal your intentions."]),
    mk("s4", "Trauma and the Soul", "Donald Kalsched", "psychology", null, 97, "2026-05-31",
      ["The self-care system becomes the very thing that imprisons the soul it set out to protect."]),
    mk("s5", "The New Model of Selling", "Acuff & Miner", "business", null, 166, "2026-05-27",
      ["In the post-trust era, the old playbook actively repels the buyer."]),
    mk("s6", "The War of Art", "Steven Pressfield", "creative-practice", null, 73, "2026-03-22",
      ["Resistance is the most toxic force on the planet."]),
    mk("s7", "Meditations", "Marcus Aurelius", null, "Stoic Philosophy", 142, "2026-06-02",
      ["You have power over your mind — not outside events. Realize this, and you will find strength.", "Waste no more time arguing about what a good man should be. Be one."]),
    mk("s8", "Dune", "Frank Herbert", null, "Science Fiction", 58, "2026-02-14",
      ["Fear is the mind-killer."]),
  ];
}

async function main() {
  const dir = path.dirname(OUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!TOKEN) {
    if (fs.existsSync(OUT)) {
      console.warn("[highlights] No READWISE_TOKEN — keeping existing highlights.json.");
      return;
    }
    console.warn("[highlights] No READWISE_TOKEN — writing sample data.");
    fs.writeFileSync(OUT, JSON.stringify(sampleBooks(), null, 2));
    return;
  }

  const now = new Date();
  const raw = await fetchAll();
  const books = raw
    .filter((b) => b.category === "books")
    .map((b) => toClassifiedBook(b, now))
    .sort((a, b) => b.numHighlights - a.numHighlights);

  // Preserve any existing classification (Layer 2 output) across re-syncs by
  // merging tag/color/domain/genre from the prior file by id.
  if (fs.existsSync(OUT)) {
    try {
      const prior = JSON.parse(fs.readFileSync(OUT, "utf8")) as ClassifiedBook[];
      const byId = new Map(prior.map((p) => [p.id, p]));
      for (const b of books) {
        const p = byId.get(b.id);
        if (p && p.kind !== "unclassified") {
          b.kind = p.kind; b.domain = p.domain; b.genre = p.genre; b.tag = p.tag; b.color = p.color;
        }
      }
    } catch { /* ignore malformed prior file */ }
  }

  fs.writeFileSync(OUT, JSON.stringify(books, null, 2));
  console.log(`[highlights] Wrote ${books.length} books to ${path.relative(__dirname, OUT)}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run it (no token path → sample data)**

Run: `npx tsx build-highlights.ts`
Expected: logs `No READWISE_TOKEN — writing sample data.` and creates `public/data/highlights.json` containing 8 sample books. Verify:
```bash
node -e "const d=require('./public/data/highlights.json');console.log(d.length, d[0].title, d[0].tag, d[0].color)"
```
Expected: `8 Tantra Illuminated 'Eastern Spirituality' #dc2626` (sorted by highlight count).

- [ ] **Step 3: Commit**

```bash
git add build-highlights.ts public/data/highlights.json
git commit -m "feat: layer 1 — readwise sync writes raw highlights.json (sample fallback)"
```

---

### Task 4: Layer 2 — AI classification (`classify-highlights.ts`)

**Files:**
- Create: `classify-highlights.ts`
- Output: `public/data/highlights-classify-cache.json` (generated, committed)
- Output (user-editable): `public/data/highlights-overrides.json`

- [ ] **Step 1: Create the empty overrides file**

Create `public/data/highlights-overrides.json`:
```json
{}
```
(Keyed later by book id → `{ "domain": "history" }` or `{ "genre": "Biography" }` for manual corrections.)

- [ ] **Step 2: Write `classify-highlights.ts`**

Create `classify-highlights.ts`:
```ts
// classify-highlights.ts — Layer 2 of the Tones section (additive AI enrichment).
// Reads public/data/highlights.json, classifies only books not already in the
// cache, writes the cache, and merges domain/genre → tag/color back into the
// highlights file. Skips silently if ANTHROPIC_API_KEY is absent.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import {
  DOMAIN_SLUGS, resolveTag, type ClassifiedBook,
} from "./lib/highlights";

const DATA = path.resolve(__dirname, "public/data");
const HL = path.join(DATA, "highlights.json");
const CACHE = path.join(DATA, "highlights-classify-cache.json");
const OVERRIDES = path.join(DATA, "highlights-overrides.json");
const KEY = process.env.ANTHROPIC_API_KEY;
const BATCH = 20;

type Cache = Record<string, { domain: string | null; genre: string }>;
type Overrides = Record<string, { domain?: string; genre?: string }>;

function readJSON<T>(p: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(p, "utf8")) as T; } catch { return fallback; }
}

async function classifyBatch(client: Anthropic, books: ClassifiedBook[]): Promise<Cache> {
  const list = books.map((b, i) => `${i + 1}. "${b.title}" by ${b.author}`).join("\n");
  const prompt =
    `Classify each book into the reader's knowledge-vault taxonomy.\n` +
    `For each book return its best-fit "domain" (EXACTLY one of: ${DOMAIN_SLUGS.join(", ")}) ` +
    `if it clearly belongs to one, otherwise "domain": null. Always return a short human "genre" ` +
    `label (e.g. "Stoic Philosophy", "Biography", "Hard Science Fiction").\n` +
    `Reply with ONLY a JSON array, one object per book in order, like ` +
    `[{"n":1,"domain":"history","genre":"Medieval History"}, ...]. No prose.\n\nBooks:\n${list}`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
  const arr = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)) as
    { n: number; domain: string | null; genre: string }[];

  const out: Cache = {};
  for (const r of arr) {
    const b = books[r.n - 1];
    if (!b) continue;
    const domain = r.domain && DOMAIN_SLUGS.includes(r.domain) ? r.domain : null;
    out[b.id] = { domain, genre: (r.genre || "").trim() };
  }
  return out;
}

async function main() {
  if (!fs.existsSync(HL)) { console.warn("[classify] No highlights.json — run `npm run highlights` first."); return; }
  const books = readJSON<ClassifiedBook[]>(HL, []);
  const cache = readJSON<Cache>(CACHE, {});
  const overrides = readJSON<Overrides>(OVERRIDES, {});

  const todo = books.filter((b) => b.kind === "unclassified" && !cache[b.id] && !overrides[b.id]);

  if (todo.length && !KEY) {
    console.warn(`[classify] No ANTHROPIC_API_KEY — leaving ${todo.length} book(s) unclassified.`);
  } else if (todo.length) {
    const client = new Anthropic({ apiKey: KEY });
    for (let i = 0; i < todo.length; i += BATCH) {
      const slice = todo.slice(i, i + BATCH);
      try {
        Object.assign(cache, await classifyBatch(client, slice));
        console.log(`[classify] Classified ${Math.min(i + BATCH, todo.length)}/${todo.length}.`);
      } catch (e) {
        console.warn(`[classify] Batch ${i / BATCH + 1} failed, skipping:`, (e as Error).message);
      }
    }
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  }

  // Merge: overrides win over cache; re-resolve tag/color for every book.
  for (const b of books) {
    const src = overrides[b.id] ?? cache[b.id];
    if (!src) continue;
    const domain = src.domain && DOMAIN_SLUGS.includes(src.domain) ? src.domain : null;
    const genre = src.genre ?? null;
    const { kind, tag, color } = resolveTag(domain, genre);
    b.domain = domain; b.genre = genre; b.kind = kind; b.tag = tag; b.color = color;
  }

  fs.writeFileSync(HL, JSON.stringify(books, null, 2));
  console.log(`[classify] Merged classification into ${books.length} book(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Run it (no key path → leaves sample classified, others unclassified)**

Run: `npx tsx classify-highlights.ts`
Expected: since the sample books already have `kind !== "unclassified"`, `todo` is empty; logs `Merged classification into 8 book(s).` and `highlights.json` is unchanged in shape. No crash without a key.

- [ ] **Step 4: Commit**

```bash
git add classify-highlights.ts public/data/highlights-classify-cache.json public/data/highlights-overrides.json public/data/highlights.json
git commit -m "feat: layer 2 — additive AI classification with cache + overrides"
```

---

### Task 5: The Tones page (`app/tones/page.tsx`)

**Files:**
- Create: `app/tones/page.tsx`

- [ ] **Step 1: Write `app/tones/page.tsx`**

Create `app/tones/page.tsx`:
```tsx
"use client";

// app/tones/page.tsx — "Tomes of Interest": the Kindle-highlights Ledger.
// Sortable, grep-searchable, tag-filterable table of books; click a row to
// expand its highlights inline. Reads /data/highlights.json (built by
// build-highlights.ts + classify-highlights.ts). Mirrors the /sparks pattern.
import { useEffect, useMemo, useState } from "react";
import NavG from "@/components/NavG";

type Highlight = { id: string; text: string; note: string; location: number; at: string };
type Book = {
  id: string; title: string; author: string; cover: string;
  numHighlights: number; lastHighlightedAt: string;
  kind: "domain" | "genre" | "unclassified";
  tag: string; color: string; activity: number[]; highlights: Highlight[];
};

type SortKey = "i" | "title" | "author" | "tag" | "numHighlights" | "lastHighlightedAt";
const PAGE_SIZE = 120;
const ACCENT = "#5dcca5";

export default function TonesPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [grep, setGrep] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortK, setSortK] = useState<SortKey>("numHighlights");
  const [asc, setAsc] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    let alive = true;
    fetch("/data/highlights.json")
      .then((r) => r.json())
      .then((raw: Book[]) => { if (alive) { setBooks(Array.isArray(raw) ? raw : []); setLoaded(true); } })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const totalHighlights = useMemo(() => books.reduce((s, b) => s + b.numHighlights, 0), [books]);
  const maxN = useMemo(() => books.reduce((m, b) => Math.max(m, b.numHighlights), 1), [books]);
  const tags = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of books) if (!seen.has(b.tag)) seen.set(b.tag, b.color);
    return [...seen.entries()];
  }, [books]);

  const filtered = useMemo(() => {
    const q = grep.trim().toLowerCase();
    const rows = books.filter((b) => {
      if (activeTag && b.tag !== activeTag) return false;
      if (q) {
        const hay = (b.title + " " + b.author + " " + b.highlights.map((h) => h.text).join(" ")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir = asc ? 1 : -1;
    rows.sort((a, b) => {
      switch (sortK) {
        case "title": return dir * a.title.localeCompare(b.title);
        case "author": return dir * a.author.localeCompare(b.author);
        case "tag": return dir * a.tag.localeCompare(b.tag);
        case "lastHighlightedAt": return dir * (a.lastHighlightedAt || "").localeCompare(b.lastHighlightedAt || "");
        default: return dir * (a.numHighlights - b.numHighlights);
      }
    });
    return rows;
  }, [books, grep, activeTag, sortK, asc]);

  const shown = filtered.slice(0, limit);

  function sortBy(k: SortKey) {
    if (sortK === k) setAsc((v) => !v);
    else { setSortK(k); setAsc(k === "title" || k === "author" || k === "tag"); }
  }
  function toggleRow(id: string) {
    setOpen((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  const arrow = (k: SortKey) => (sortK === k ? (asc ? " ▲" : " ▼") : "");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavG active="Tones" count={{ value: books.length || "—", label: books.length ? "tomes" : "loading", color: ACCENT }} />

      <main className="tns-root">
        <div className="tns-glow" aria-hidden />
        <div className="tns-grain" aria-hidden />

        <div className="tns-inner">
          <header className="tns-head">
            <p className="tns-eyebrow">⌖ the margins, indexed</p>
            <h1 className="tns-title">Tomes of Interest</h1>
            <p className="tns-sub">
              {loaded ? <>{books.length} books · {totalHighlights.toLocaleString()} highlights from Kindle</> : "loading the ledger…"}
            </p>
          </header>

          <div className="tns-tools">
            <div className="tns-searchwrap">
              <span className="tns-searchicon" aria-hidden>⌕</span>
              <input className="tns-search" type="search" value={grep} placeholder="grep highlights…"
                aria-label="Search highlights" onChange={(e) => { setGrep(e.target.value); setLimit(PAGE_SIZE); }} />
            </div>
            <div className="tns-chips" role="group" aria-label="Filter by tag">
              <button className={`tns-chip${activeTag === null ? " on" : ""}`} onClick={() => setActiveTag(null)}>All</button>
              {tags.map(([t, c]) => (
                <button key={t} className={`tns-chip${activeTag === t ? " on" : ""}`} onClick={() => setActiveTag((v) => (v === t ? null : t))}>
                  <i style={{ background: c }} aria-hidden /> {t}
                </button>
              ))}
            </div>
          </div>

          <div className="tns-tablewrap">
            <table className="tns-table">
              <thead>
                <tr>
                  <th className="tns-num" style={{ width: 30 }}>#</th>
                  <th onClick={() => sortBy("title")}>Title{arrow("title")}</th>
                  <th onClick={() => sortBy("author")}>Author{arrow("author")}</th>
                  <th onClick={() => sortBy("tag")}>Tag{arrow("tag")}</th>
                  <th className="tns-num" onClick={() => sortBy("numHighlights")}>Highlights{arrow("numHighlights")}</th>
                  <th onClick={() => sortBy("lastHighlightedAt")}>Last seen{arrow("lastHighlightedAt")}</th>
                  <th>Density</th>
                  <th>90-day</th>
                </tr>
              </thead>
              <tbody>
                {loaded && filtered.length === 0 && (
                  <tr><td colSpan={8} className="tns-empty">No tomes match.</td></tr>
                )}
                {shown.map((b, i) => {
                  const isOpen = open.has(b.id);
                  return (
                    <BookRow key={b.id} b={b} i={i} isOpen={isOpen} maxN={maxN} onToggle={() => toggleRow(b.id)} />
                  );
                })}
              </tbody>
            </table>
          </div>

          {loaded && filtered.length > limit && (
            <button className="tns-more" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              show {Math.min(PAGE_SIZE, filtered.length - limit)} more · {filtered.length - limit} remaining
            </button>
          )}
        </div>
      </main>
    </>
  );
}

function BookRow({ b, i, isOpen, maxN, onToggle }: {
  b: Book; i: number; isOpen: boolean; maxN: number; onToggle: () => void;
}) {
  const maxA = Math.max(1, ...b.activity);
  return (
    <>
      <tr className={`tns-bk${isOpen ? " open" : ""}`} onClick={onToggle}>
        <td className="tns-num tns-dim">{String(i + 1).padStart(2, "0")}</td>
        <td><span className="tns-ti">{b.title}</span></td>
        <td className="tns-au">{b.author}</td>
        <td>
          <span className="tns-pill" style={{ color: b.color, borderColor: `${b.color}55`, background: `${b.color}14` }}>
            <i style={{ background: b.color }} aria-hidden /> {b.tag}
          </span>
        </td>
        <td className="tns-num" style={{ color: ACCENT }}>{b.numHighlights}</td>
        <td className="tns-date">{b.lastHighlightedAt || "—"}</td>
        <td><div className="tns-track"><div className="tns-fill" style={{ width: `${Math.round((b.numHighlights / maxN) * 100)}%`, background: b.color }} /></div></td>
        <td>
          <div className="tns-spark" aria-hidden>
            {b.activity.map((v, j) => <i key={j} style={{ height: `${4 + (v / maxA) * 12}px`, background: b.color }} />)}
          </div>
        </td>
      </tr>
      <tr className="tns-det">
        <td colSpan={8}>
          <div className={`tns-detin${isOpen ? " open" : ""}`}>
            <div className="tns-detpad">
              <div className="tns-detlbl" style={{ color: b.color }}>{b.tag} · {b.numHighlights} highlights</div>
              {b.highlights.slice(0, 12).map((h) => (
                <div key={h.id} className="tns-q" style={{ borderLeftColor: b.color }}>
                  {h.text}
                  {h.note && <div className="tns-note">— {h.note}</div>}
                  <div className="tns-loc">Location {h.location}{h.at ? ` · ${h.at.slice(0, 10)}` : ""}</div>
                </div>
              ))}
              {b.highlights.length > 12 && <div className="tns-loc" style={{ paddingLeft: 15 }}>+ {b.highlights.length - 12} more</div>}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

const CSS = `
  .tns-root{
    --ac:${ACCENT}; --ac-rgb:93,204,165;
    --ink:#eae6f5; --muted:#8a849a; --dim:#5a546b; --dim2:#494456;
    --hair:rgba(255,255,255,0.08); --panel:rgba(255,255,255,0.022); --bg3:#1c1a26;
    min-height:calc(100vh - 80px); background:#0e0d14; color:var(--ink);
    position:relative; overflow-x:hidden; font-family:var(--font-jetbrains),monospace;
  }
  html[data-theme="sepia"] .tns-root{
    --ac:#246a55; --ac-rgb:36,106,85; --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a; --dim2:#b8a988;
    --hair:rgba(44,31,14,0.13); --panel:rgba(44,31,14,0.03); --bg3:#e6dcc8; background:#f0ead8;
  }
  .tns-glow{ position:fixed; top:40px; left:50%; width:1000px; height:560px; transform:translateX(-50%);
    background:radial-gradient(ellipse at center, rgba(var(--ac-rgb),0.09), transparent 68%); pointer-events:none; z-index:0; }
  .tns-grain{ position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.04; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  .tns-inner{ position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:0 32px 96px; }
  .tns-head{ padding:44px 0 8px; }
  .tns-eyebrow{ font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:var(--ac); opacity:0.85; margin:0 0 14px; }
  .tns-title{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400;
    font-size:clamp(36px,5vw,52px); line-height:1; letter-spacing:-0.02em; margin:0; }
  .tns-sub{ font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:var(--muted); margin:12px 0 0; font-variant-numeric:tabular-nums; }

  .tns-tools{ display:flex; align-items:center; gap:12px; margin:24px 0 14px; flex-wrap:wrap; }
  .tns-searchwrap{ position:relative; display:flex; align-items:center; }
  .tns-searchicon{ position:absolute; left:12px; color:var(--dim); font-size:14px; pointer-events:none; }
  .tns-search{ width:180px; font-size:12px; background:var(--panel); border:1px solid var(--hair); border-radius:8px;
    padding:9px 12px 9px 32px; color:var(--ac); outline:none; transition:border-color .2s; }
  .tns-search::placeholder{ color:var(--dim); }
  .tns-search::-webkit-search-cancel-button{ display:none; }
  .tns-search:focus{ border-color:rgba(var(--ac-rgb),0.5); }
  .tns-chips{ display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; flex:1; }
  .tns-chips::-webkit-scrollbar{ display:none; }
  .tns-chip{ flex-shrink:0; background:transparent; border:1px solid var(--hair); color:var(--muted);
    font-family:inherit; font-size:9px; letter-spacing:0.08em; text-transform:uppercase; padding:6px 11px;
    border-radius:20px; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:6px; transition:all .2s; }
  .tns-chip:hover{ color:var(--ink); }
  .tns-chip.on{ color:var(--ink); background:var(--panel); border-color:var(--dim2); }
  .tns-chip i{ width:7px; height:7px; border-radius:50%; display:block; }

  .tns-tablewrap{ max-height:62vh; overflow-y:auto; border:1px solid var(--hair); border-radius:10px; }
  .tns-table{ width:100%; border-collapse:collapse; font-size:12px; }
  .tns-table th{ font-size:8.5px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); text-align:left;
    padding:11px 14px; border-bottom:1px solid var(--hair); cursor:pointer; user-select:none; white-space:nowrap;
    position:sticky; top:0; background:#15131c; }
  html[data-theme="sepia"] .tns-table th{ background:#ede6d4; }
  .tns-table th:hover{ color:var(--ac); }
  .tns-table td{ padding:11px 14px; border-bottom:1px solid var(--hair); vertical-align:middle; }
  .tns-num{ font-variant-numeric:tabular-nums; text-align:right; }
  .tns-dim{ color:var(--dim2); }
  .tns-bk{ cursor:pointer; transition:background .2s; }
  .tns-bk:hover td{ background:var(--panel); }
  .tns-bk.open td{ background:rgba(var(--ac-rgb),0.06); }
  .tns-ti{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-size:14.5px; color:var(--ink); }
  .tns-au{ color:var(--muted); font-size:10px; }
  .tns-date{ color:var(--dim); font-size:10px; font-variant-numeric:tabular-nums; }
  .tns-pill{ display:inline-flex; align-items:center; gap:6px; font-size:8.5px; letter-spacing:0.08em;
    text-transform:uppercase; padding:4px 9px; border-radius:20px; white-space:nowrap; border:1px solid; }
  .tns-pill i{ width:6px; height:6px; border-radius:50%; display:block; }
  .tns-track{ height:4px; background:var(--bg3); border-radius:2px; overflow:hidden; width:60px; }
  .tns-fill{ height:100%; border-radius:2px; }
  .tns-spark{ display:flex; gap:1.5px; align-items:flex-end; height:16px; }
  .tns-spark i{ width:2.5px; display:block; border-radius:1px; opacity:0.7; }

  .tns-det td{ padding:0; }
  .tns-detin{ max-height:0; overflow:hidden; transition:max-height .4s cubic-bezier(0.16,1,0.3,1); }
  .tns-detin.open{ max-height:420px; overflow-y:auto; }
  .tns-detpad{ padding:8px 24px 18px 56px; }
  .tns-detlbl{ font-size:9px; letter-spacing:0.16em; text-transform:uppercase; margin-bottom:6px; }
  .tns-q{ font-family:var(--font-newsreader),Georgia,serif; font-size:14px; line-height:1.55; color:var(--ink);
    padding:10px 0 10px 15px; border-left:2px solid; margin:9px 0; }
  .tns-note{ font-style:italic; color:var(--muted); font-size:13px; margin-top:4px; }
  .tns-loc{ font-family:var(--font-jetbrains),monospace; font-size:8px; color:var(--dim2); letter-spacing:0.12em;
    margin-top:6px; text-transform:uppercase; }
  .tns-empty{ text-align:center; color:var(--muted); font-style:italic; padding:40px 0; font-family:var(--font-newsreader),serif; }
  .tns-more{ display:block; margin:24px auto 0; padding:12px 26px; background:transparent; border:1px solid var(--hair);
    border-radius:6px; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.2em;
    text-transform:uppercase; color:var(--muted); cursor:pointer; transition:border-color .25s, color .25s; }
  .tns-more:hover{ border-color:rgba(var(--ac-rgb),0.5); color:var(--ac); }

  @media (max-width:767px){
    .tns-inner{ padding:0 16px 96px; }
    .tns-tablewrap{ overflow-x:auto; }
    .tns-table{ min-width:680px; }
  }
  @media (prefers-reduced-motion:reduce){ .tns-detin{ transition:none; } }
`;
```

- [ ] **Step 2: Type-check the page**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/tones/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/tones/page.tsx
git commit -m "feat: /tones 'Tomes of Interest' ledger page"
```

---

### Task 6: Nav wiring (desktop, constellation header, mobile)

**Files:**
- Modify: `components/NavG.tsx:11-18`
- Modify: `components/ConstellationV2.tsx:179-187`
- Modify: `components/MobileNav.tsx:7-14`, `:171-176`, plus a new `IconTones`
- Modify: `app/globals.css:1244-1275`

- [ ] **Step 1: Add Tones to the desktop NavG**

In `components/NavG.tsx`, replace the `NAV_ITEMS` array (lines 11-19) so Tones sits between Sparks and The Council and Council renumbers to 08:
```ts
const NAV_ITEMS = [
  { label: "Dashboard",  idx: "01", href: "/"           },
  { label: "Hubs",       idx: "02", href: "/hubs"       },
  { label: "Research",   idx: "03", href: "/research"   },
  { label: "Essays",     idx: "04", href: "/essays"     },
  { label: "Collisions", idx: "05", href: "/collisions" },
  { label: "Sparks",     idx: "06", href: "/sparks"     },
  { label: "Tones",      idx: "07", href: "/tones"      },
  { label: "The Council", idx: "08", href: "/council"   },
];
```

- [ ] **Step 2: Add Tones to the constellation header**

In `components/ConstellationV2.tsx`, in the `C2Header` `items` array (lines 179-187), insert Tones before Council and renumber Council to 08:
```ts
  const items: { n: string; idx: string; route?: string }[] = [
    { n: 'Dashboard', idx: '01' },
    { n: 'Hubs',      idx: '02', route: '/hubs' },
    { n: 'Research',  idx: '03', route: '/research' },
    { n: 'Essays',    idx: '04', route: '/essays' },
    { n: 'Collisions',idx: '05', route: '/collisions' },
    { n: 'Sparks',    idx: '06', route: '/sparks' },
    { n: 'Tones',     idx: '07', route: '/tones' },
    { n: 'Council',   idx: '08', route: '/council' },
  ];
```

- [ ] **Step 3: Add an `IconTones` component to MobileNav**

In `components/MobileNav.tsx`, add this function right after `IconCouncil` (after line 112):
```tsx
function IconTones({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {/* three book spines */}
      <rect x="2.5" y="3" width="3.2" height="12" rx="1"
        fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" opacity={active ? 1 : 0.7}/>
      <rect x="7.4" y="3" width="3.2" height="12" rx="1"
        fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" opacity={active ? 0.85 : 0.6}/>
      <rect x="12" y="4.5" width="3.5" height="10.5" rx="1" transform="rotate(9 13.7 9.7)"
        fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" opacity={active ? 0.7 : 0.5}/>
    </svg>
  );
}
```

- [ ] **Step 4: Add the Tones tab + render its icon**

In `components/MobileNav.tsx`, update `TABS` (lines 7-14) to insert Tones before Council:
```tsx
const TABS = [
  { href: '/',           label: 'Dashboard'  },
  { href: '/hubs',       label: 'Hubs'       },
  { href: '/research',   label: 'Research'   },
  { href: '/collisions', label: 'Collisions' },
  { href: '/sparks',     label: 'Sparks'     },
  { href: '/tones',      label: 'Tones'      },
  { href: '/council',    label: 'Council'    },
] as const;
```
Then in the icon map (lines 171-176), add the Tones case:
```tsx
              {label === 'Dashboard'  && <IconDomains    active={isActive} />}
              {label === 'Sparks'     && <IconSparks     active={isActive} />}
              {label === 'Collisions' && <IconCollisions active={isActive} />}
              {label === 'Hubs'       && <IconHubs       active={isActive} />}
              {label === 'Research'   && <IconResearch   active={isActive} />}
              {label === 'Tones'      && <IconTones      active={isActive} />}
              {label === 'Council'    && <IconCouncil    active={isActive} />}
```

- [ ] **Step 5: Make the mobile tab bar horizontally scrollable**

In `app/globals.css`, replace the `.mnav` rule inside `@media (max-width: 767px)` (lines 1244-1258) and the `.mnav-tab` rule (lines 1260-1275) so the bar scrolls left-to-right and tabs keep a minimum width:
```css
  /* ── Show the bottom tab bar (horizontally scrollable) ── */
  .mnav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 68px;
    background: var(--mnav-bg);
    border-top: 1px solid var(--mnav-border);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 200;
    align-items: stretch;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .mnav::-webkit-scrollbar { display: none; }

  .mnav-tab {
    flex: 0 0 auto;
    min-width: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--mnav-text);
    padding: 6px 12px 10px;
    transition: color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
```

- [ ] **Step 6: Commit**

```bash
git add components/NavG.tsx components/ConstellationV2.tsx components/MobileNav.tsx app/globals.css
git commit -m "feat: add Tones nav entry (desktop, constellation, scrollable mobile)"
```

---

### Task 7: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Rebuild the highlights data**

Run: `npm run highlights && npm run classify`
Expected: `public/data/highlights.json` present with the 8 sample books, no errors.

- [ ] **Step 2: Start the dev server via the preview tool**

Use `preview_start` (the project dev command). The home page builds the vault then runs `next dev`.

- [ ] **Step 3: Load `/tones` and confirm it renders**

Navigate the preview to `/tones`. Use `preview_snapshot` and confirm: the "Tomes of Interest" header, the Ledger table with 8 rows, colored tag pills (Tantra Illuminated = Eastern red `#dc2626`, Meditations = "Stoic Philosophy" in the genre palette), density bars, and sparklines.

- [ ] **Step 4: Verify interactions**

- `preview_click` a book row → its highlights expand inline (accordion).
- `preview_fill` the grep box with a word from a sample highlight (e.g. "mind") → table filters.
- `preview_click` a column header (e.g. Title) → rows re-sort.
- `preview_click` a tag chip → filters to that tag.
- `preview_console_logs` → confirm no errors.

- [ ] **Step 5: Verify the nav entry + mobile scroll**

- Confirm `Tones` appears in the top nav between Sparks and Council (`preview_snapshot`).
- `preview_resize` to a phone width (~390px) and confirm the bottom tab bar scrolls horizontally and shows the Tones tab.
- `preview_screenshot` the final `/tones` page (desktop) to share with the user.

- [ ] **Step 6: Commit any fixes**

If verification surfaced issues, fix the relevant source file, re-verify from Step 3, and commit:
```bash
git add -A
git commit -m "fix: tones verification adjustments"
```

---

## Notes for the implementer

- **Secrets:** real data needs `READWISE_TOKEN` + `ANTHROPIC_API_KEY` in `.env` (copy `.env.example`). Everything works without them via sample data — that's intended for the first build.
- **Refresh flow (after keys are in):** `npm run sync` runs parse → highlights (Layer 1) → classify (Layer 2) → sync-once, then commit the regenerated `public/data/highlights.json` + `highlights-classify-cache.json` and push (private repo).
- **Reclassify a book by hand:** edit `public/data/highlights-overrides.json`, e.g. `{ "12345": { "domain": "history" } }`, then `npm run classify`.
- **Widen beyond Kindle later:** relax the `category === "books"` filter in `build-highlights.ts`.
- **`__dirname` in tsx:** the scripts use CommonJS-style `__dirname`; this matches the existing `build-vault.ts` (`path.resolve(__dirname, ...)`), so it works under `npx tsx`.
```
