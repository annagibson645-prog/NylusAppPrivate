// lib/vault-json.ts
// Memoized reader for the generated JSON in public/data.
//
// Why this exists: the [slug] routes are statically prerendered, and each page
// render used to re-read and re-parse its data files from disk. graph.json
// alone is ~23MB, so prerendering ~2,000 pages meant parsing tens of gigabytes.
// One parse per file per build worker instead.
//
// Safe to cache for the whole process: these files are written by `npm run
// parse` before the build starts and never change while it runs.
//
// The body shards are the exception, and caching them was actively harmful.
// A build runs one worker per core; each holds its own cache, and a worker
// rendering concept pages walks slugs in vault order while shards are keyed by
// a hash of the slug (lib/shard.ts), so consecutive pages land in unrelated
// shards. Every worker therefore drifted toward holding all 512 of them —
// 218MB of JSON, several times that once parsed into objects — and the build
// died of memory exhaustion partway through page generation.
//
// Nothing is lost by dropping them: a shard is opened for one page and, given
// the hashing, is almost never wanted again by the same worker. Re-reading
// ~430KB per page costs about a minute across the whole vault and keeps the
// footprint flat as the vault grows.

import { readFileSync, readdirSync } from "fs";
import path from "path";

const cache = new Map<string, unknown>();

/** Small enough to be irrelevant to peak memory, large enough that a page
 *  reading its own shard twice pays for it once. */
const BODY_CACHE_MAX = 4;
const bodyCache = new Map<string, unknown>();
const isBodyShard = (file: string) => /^body-\d+\.json$/.test(file);

export function loadVaultJSON<T>(file: string): T {
  const store = isBodyShard(file) ? bodyCache : cache;
  if (store.has(file)) return store.get(file) as T;
  const parsed = JSON.parse(
    readFileSync(path.join(process.cwd(), "public/data", file), "utf-8")
  ) as T;
  store.set(file, parsed);
  // Map iterates in insertion order, so the first key is the oldest.
  if (store === bodyCache && store.size > BODY_CACHE_MAX) {
    store.delete(store.keys().next().value as string);
  }
  return parsed;
}

/** Ids of every graph node of a given type — used for generateStaticParams. */
export function idsOfType(type: string): string[] {
  const { nodes } = loadVaultJSON<{ nodes: { id: string; type: string }[] }>(
    "graph.json"
  );
  return nodes.filter((n) => n.type === type).map((n) => n.id);
}

/** Domain slugs, from the domain-*.json files parse emitted. */
export function domainNames(): string[] {
  return readdirSync(path.join(process.cwd(), "public/data"))
    .filter((f) => f.startsWith("domain-") && !f.startsWith("domain-index-"))
    .map((f) => f.slice("domain-".length, -".json".length));
}

/** Ids from a flat list file (sparks.json, research.json, …). */
export function idsOfFile(file: string): string[] {
  try {
    const rows = loadVaultJSON<{ id?: string }[]>(file);
    return Array.isArray(rows)
      ? rows.map((r) => r?.id).filter((id): id is string => Boolean(id))
      : [];
  } catch {
    return [];
  }
}
