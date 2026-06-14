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
import { writeFileRetry } from "./write-retry";

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
    writeFileRetry(CACHE, JSON.stringify(cache, null, 2));
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

  writeFileRetry(HL, JSON.stringify(books, null, 2));
  console.log(`[classify] Merged classification into ${books.length} book(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
