"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SearchItem } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

function seededIndex(seed: number, max: number): number {
  // Simple deterministic hash — same date always picks same concept
  let h = seed;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return Math.abs(h) % max;
}

function todaySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function routeForItem(item: SearchItem): string {
  if (item.type === "spark") return `/spark/${item.id}`;
  if (item.type === "collision") return `/collision/${item.id}`;
  if (item.type === "source") return `/source/${item.id}`;
  return `/concept/${item.id}`;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function ConceptOfTheDay() {
  const [concept, setConcept] = useState<SearchItem | null>(null);

  useEffect(() => {
    fetch("/data/search-index.json")
      .then((r) => r.json())
      .then((items: SearchItem[]) => {
        // Only pick from concepts and hubs — not sparks/collisions for "concept of the day"
        const pool = items.filter((i) => i.type === "concept" || i.type === "hub");
        if (!pool.length) return;
        const idx = seededIndex(todaySeed(), pool.length);
        setConcept(pool[idx]);
      });
  }, []);

  if (!concept) return (
    <div
      className="rounded-xl border p-6 sm:p-8 mb-12 animate-pulse"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="h-3 w-24 rounded mb-4" style={{ background: "var(--border)" }} />
      <div className="h-6 w-2/3 rounded mb-3" style={{ background: "var(--border)" }} />
      <div className="h-4 w-full rounded" style={{ background: "var(--border)" }} />
    </div>
  );

  return (
    <Link
      href={routeForItem(concept)}
      className="block rounded-xl border p-6 sm:p-8 mb-12 hover:opacity-80 transition-opacity group"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "var(--text-dim)" }}
          >
            Concept of the Day
          </span>
        </div>
        <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
          {formatDate()}
        </span>
      </div>

      {/* Domain */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: concept.color }}
        />
        <span className="text-xs" style={{ color: concept.color }}>
          {DOMAIN_LABELS[concept.domain] || concept.domain}
        </span>
      </div>

      {/* Title */}
      <h2
        className="text-xl sm:text-2xl font-semibold leading-snug mb-3 group-hover:opacity-80 transition-opacity"
        style={{ color: "var(--text)" }}
      >
        {concept.title}
      </h2>

      {/* Excerpt */}
      {concept.excerpt && (
        <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--text-muted)" }}>
          {concept.excerpt}
        </p>
      )}

      <span className="inline-block mt-4 text-sm" style={{ color: concept.color }}>
        Read →
      </span>
    </Link>
  );
}
