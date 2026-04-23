"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SearchItem } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

function seededIndex(seed: number, max: number): number {
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
        const pool = items.filter((i) => i.type === "concept" || i.type === "hub");
        if (!pool.length) return;
        setConcept(pool[seededIndex(todaySeed(), pool.length)]);
      });
  }, []);

  if (!concept) return (
    <div className="mb-12 rounded-xl border-l-4 p-7 animate-pulse" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="h-3 w-32 rounded mb-5" style={{ background: "var(--border)" }} />
      <div className="h-8 w-3/4 rounded mb-3" style={{ background: "var(--border)" }} />
      <div className="h-4 w-1/4 rounded" style={{ background: "var(--border)" }} />
    </div>
  );

  return (
    <Link
      href={routeForItem(concept)}
      className="group block mb-12 rounded-xl border p-7 sm:p-9 hover:opacity-90 transition-opacity relative overflow-hidden"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        borderLeftColor: concept.color,
        borderLeftWidth: "4px",
      }}
    >
      {/* Subtle color wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: concept.color, opacity: 0.03 }}
      />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-center justify-between mb-5">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-dim)" }}
          >
            Concept of the Day
          </span>
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            {formatDate()}
          </span>
        </div>

        {/* Domain label */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full" style={{ background: concept.color }} />
          <span className="text-xs font-medium" style={{ color: concept.color }}>
            {DOMAIN_LABELS[concept.domain] || concept.domain}
          </span>
        </div>

        {/* Title */}
        <h2
          className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight mb-6"
          style={{ color: "var(--text)" }}
        >
          {concept.title}
        </h2>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium group-hover:opacity-70 transition-opacity"
            style={{ color: concept.color }}
          >
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}
