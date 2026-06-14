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
