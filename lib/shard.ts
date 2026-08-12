// lib/shard.ts
// Which body-NNN.json file holds a given slug's content.
//
// This lives in one place on purpose: build-vault.ts writes the shards and
// app/concept/[slug]/page.tsx reads them, and if the two ever disagreed about
// the bucketing rule every concept page would 500 with no obvious cause.

export const SHARD_COUNT = 512;

/**
 * FNV-1a over the slug. Two properties matter here:
 *
 * 1. It depends only on the slug — never on a node's position in the vault.
 *    Index-based buckets would reshuffle on every insert, so a single new note
 *    would rewrite all 512 shards and every sync would push the whole corpus.
 * 2. It is plain integer math, so Windows and Vercel's Linux agree. Deriving
 *    shard names from slugs directly would collide on case-insensitive
 *    filesystems (two ids differing only in case) and behave differently in
 *    production than locally.
 */
export function shardOf(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % SHARD_COUNT;
}

export function shardFile(slug: string): string {
  return `body-${String(shardOf(slug)).padStart(3, "0")}.json`;
}
