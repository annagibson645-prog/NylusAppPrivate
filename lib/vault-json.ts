// lib/vault-json.ts
// Memoized reader for the generated JSON in public/data.
//
// Why this exists: the [slug] routes are statically prerendered, and each page
// render used to re-read and re-parse its data files from disk. graph.json
// alone is ~20MB, so prerendering ~2,000 pages meant parsing tens of gigabytes.
// One parse per file per build worker instead.
//
// Safe to cache for the whole process: these files are written by `npm run
// parse` before the build starts and never change while it runs.

import { readFileSync, readdirSync } from "fs";
import path from "path";

const cache = new Map<string, unknown>();

export function loadVaultJSON<T>(file: string): T {
  if (cache.has(file)) return cache.get(file) as T;
  const parsed = JSON.parse(
    readFileSync(path.join(process.cwd(), "public/data", file), "utf-8")
  ) as T;
  cache.set(file, parsed);
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
