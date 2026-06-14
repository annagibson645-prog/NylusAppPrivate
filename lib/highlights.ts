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
