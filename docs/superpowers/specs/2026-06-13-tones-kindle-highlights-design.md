# Tones — Kindle highlights ("Tomes of Interest")

*Design spec · 2026-06-13 · NylusApp*

## Purpose

Add a section to the site that surfaces all the user's Kindle highlights (pulled
from Readwise) as a sortable, searchable **Ledger** — a data-dense technical
readout that scales gracefully to ~500 books / ~11k highlights. Each book is
colored and tagged by an AI-classified genre; genres that map to one of the
vault's 8 domains use that domain's color and a domain tag.

- **Nav label:** `Tones` (placed between `Sparks` and `The Council`)
- **Page title:** *Tomes of Interest*
- **Route:** `/tones`
- **Chosen layout:** Prototype 4 — "The Ledger" (sortable table)

## Architecture overview

Mirrors how the rest of the site already works (build-time JSON generation →
committed to the private repo → client pages fetch `/data/*.json`). The AI
classification is a **decoupled enrichment layer**, never a hard dependency:

1. **Layer 1 — `build-highlights.ts`** (Readwise sync): Export API → writes raw
   `public/data/highlights.json`. No AI. The page works off this alone.
2. **Layer 2 — `classify-highlights.ts`** (AI enrichment, additive): reads
   Layer 1's output, classifies only books not yet in the cache, writes the
   sidecar cache. Runs automatically after Layer 1 in `npm run sync`, but is
   independently runnable and fully skippable.
3. **Merge**: books are joined to their classification by id at build/render →
   `color` + `tag`. Missing enrichment falls back to a neutral "Unclassified".
4. **`app/tones/page.tsx`** — standalone client page (clone of the `/sparks`
   pattern: `NavG` header, fetches its JSON, void + sepia themed).
5. **Nav wiring** — add `Tones` to `NavG` (desktop), `MobileNav` (mobile,
   made horizontally scrollable), and `C2Header` (constellation dashboard).

**Layer benefits:** the Readwise pull never needs an Anthropic key; classify can
re-run alone (e.g. after a prompt tweak) without re-hitting Readwise; hand
overrides win over the AI layer.

Secrets (`READWISE_TOKEN`, `ANTHROPIC_API_KEY`) live in `.env` (already
gitignored via `.env*`). The generated JSON + classification cache are committed
(repo is private). No serverless/runtime secrets — refresh happens on the same
local `npm run sync` + git push the user already does.

---

## 1. Data pipeline — `build-highlights.ts`

Run via `npx tsx build-highlights.ts`; wired into the `parse`/`sync` npm scripts
so it runs alongside `build-vault.ts`.

### 1a. Fetch from Readwise
- Endpoint: `GET https://readwise.io/api/v2/export/`
- Auth: `Authorization: Token ${READWISE_TOKEN}`
- Paginate via `pageCursor`. Support incremental refresh with `updatedAfter`
  (store last-run ISO timestamp in the cache file) so re-runs are cheap.
- **Scope:** keep books only — `category === 'books'` (Kindle). One-line filter,
  easy to widen later.
- Per book, capture: `user_book_id`, `title`, `author`, `cover_image_url`,
  `category`, `source`, `num_highlights`, `last_highlight_at`, and the
  `highlights[]` (each: `id`, `text`, `note`, `location`, `highlighted_at`).

### 1b. AI classification (cached) — Layer 2, `classify-highlights.ts`
Separate script. Reads `highlights.json`, enriches only unseen books, runs
automatically after the sync in `npm run sync` (incremental, so cheap).
- Cache file: `public/data/highlights-classify-cache.json`, keyed by
  `user_book_id` → `{ domain: string|null, genre: string }`. Committed.
- For each book **not** already in the cache, call the Anthropic API once
  (model `claude-haiku-4-5` — cheap, fast, sufficient for classification).
  Batch books in a single prompt where practical to cut calls.
  - Prompt asks: given title + author, return JSON
    `{ domain, genre }` where `domain` is exactly one of the 8 vault domain
    slugs **or** `null`, and `genre` is a short human label (e.g. "Stoic
    Philosophy", "Biography", "Hard Sci-Fi").
- Manual override file: `public/data/highlights-overrides.json`, keyed by
  `user_book_id` → `{ domain?, genre? }`. Applied **after** cache, so the user
  can correct any miss without re-running classification.
- Resolver writes a `tag` (display label) and `color`:
  - If `domain` ∈ the 8 domain slugs → `color = DOMAIN_COLORS[domain]`,
    `tag = DOMAIN_LABEL[domain]`, `kind = 'domain'`.
  - Else → `color` = stable hash of `genre` into a **secondary genre palette**
    (a fixed list of ~10 hexes distinct from the domain hues),
    `tag = genre`, `kind = 'genre'`.

**Canonical domain colors** (from `build-vault.ts` `DOMAIN_COLORS` — the source
of truth for the vault graph):

| Domain slug | Color | Label |
|---|---|---|
| history | `#e6c068` | History |
| eastern-spirituality | `#dc2626` | Eastern Spirituality |
| psychology | `#f59e0b` | Psychology |
| behavioral-mechanics | `#a78bfa` | Behavioral Mechanics |
| cross-domain | `#38bdf8` | Cross-Domain |
| creative-practice | `#14b8a6` | Creative Practice |
| african-spirituality | `#34d399` | African Spirituality |
| business | `#e879a0` | Business |

### 1c. Output — `public/data/highlights.json`
Array of books, sorted by `numHighlights` desc:
```jsonc
{
  "id": "12345",
  "title": "Meditations",
  "author": "Marcus Aurelius",
  "cover": "https://…",
  "numHighlights": 142,
  "lastHighlightedAt": "2026-06-02",
  "kind": "domain",                 // "domain" | "genre"
  "domain": "eastern-spirituality", // slug or null
  "tag": "Eastern Spirituality",    // display label (domain label or genre)
  "color": "#dc2626",
  "activity": [0,2,1,...],          // ~12 weekly buckets over 90d, from highlighted_at
  "highlights": [
    { "id": "h1", "text": "…", "note": "", "location": 420, "at": "2026-05-30" }
  ]
}
```

### 1d. Resilience
- If `READWISE_TOKEN` is missing → log a warning, skip, leave any existing
  `highlights.json` untouched (so other machines / CI never break the build).
- If `ANTHROPIC_API_KEY` is missing → skip classification, emit books with
  `kind: 'genre'`, `tag: 'Unclassified'`, neutral color; still renders.
- Network/partial failures: keep already-cached classifications; never discard
  the prior `highlights.json` on error.

---

## 2. Page — `app/tones/page.tsx`

Standalone `"use client"` page modeled on `app/sparks/page.tsx`:
- `<NavG active="Tones" count={{ value: bookCount, label: 'tomes', color: '#5dcca5' }} />`
- `fetch('/data/highlights.json')` on mount; loading + empty states.
- Void theme + `html[data-theme="sepia"]` overrides; fonts Fraunces (display
  italic) / JetBrains Mono (labels) / Newsreader (body); grain + glow ambiance.

### The Ledger table
Columns:
1. `#` — index (tabular-nums, dim)
2. `Title` — Fraunces italic
3. `Author` — mono, dim
4. `Tag` — colored pill using the book's `color` + `tag` (domain or genre)
5. `Highlights` — count, accent, right-aligned tabular
6. `Last seen` — date
7. `Density` — hairline bar, width ∝ count / max
8. `90-day` — sparkline from `activity[]`

Behaviors:
- **Sortable headers** — click to sort (toggle asc/desc); default Highlights desc.
- **Search/grep** — filters title + author + (optionally) highlight text.
- **Filter chips** — by domain/genre tag (multi-select OR), matching the Sparks
  rail interaction model.
- **Row click** — expands the book's highlights inline (accordion), or opens a
  side/bottom reader panel listing each highlight (quote + location).
- **Scale** — render in pages of 120 with a "show more" button (Sparks pattern);
  the table body scrolls within a max-height. No virtualization needed at 500.
- Numbers use `font-variant-numeric: tabular-nums`; respect
  `prefers-reduced-motion`.

---

## 3. Nav wiring

- **`components/NavG.tsx`** — insert `{ label: "Tones", idx: "07", href: "/tones" }`
  between Sparks (06) and The Council; renumber Council to 08. (Desktop nav
  already has `overflowX: auto`.)
- **`components/MobileNav.tsx`** — add a `Tones` tab between Sparks and Council
  with an icon; **make the tab bar horizontally scrollable** (so all tabs +
  theme toggle fit on a phone) — `overflow-x: auto`, `flex-wrap: nowrap`,
  hidden scrollbar, `scroll-snap` optional. Add an `IconTones`.
- **`components/ConstellationV2.tsx`** — add
  `{ n: 'Tones', idx: '07', route: '/tones' }` to the `C2Header` `items` array
  between Sparks and Council (renumber Council).

---

## Out of scope (for now)
- Non-book Readwise sources (articles, tweets) — books-only filter; widen later.
- Live/runtime refresh — build-time only, by design.
- Per-highlight tagging/notes editing — read-only display.

## Files touched
- **new** `build-highlights.ts` (Layer 1 — Readwise sync)
- **new** `classify-highlights.ts` (Layer 2 — AI enrichment)
- **new** `app/tones/page.tsx`
- **new** `public/data/highlights.json` (generated, committed)
- **new** `public/data/highlights-classify-cache.json` (generated, committed)
- **new** `public/data/highlights-overrides.json` (user-editable)
- **edit** `package.json` (scripts), `.env` (local secrets)
- **edit** `components/NavG.tsx`, `components/MobileNav.tsx`, `components/ConstellationV2.tsx`
