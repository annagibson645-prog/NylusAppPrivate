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
