"use client";
import { useState } from "react";
import SparkCard from "@/components/SparkCard";
import type { VaultNode } from "@/lib/types";

interface Props {
  sparks: VaultNode[];
}

type FilterKey = "all" | "essay-seed" | "stale" | "resonance" | "speculative" | "question" | "contradiction";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "essay-seed", label: "Essay Seeds" },
  { key: "stale", label: "Stale" },
  { key: "resonance", label: "Resonance" },
  { key: "speculative", label: "Speculative" },
  { key: "question", label: "Questions" },
  { key: "contradiction", label: "Contradictions" },
];

export default function SparksView({ sparks }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  function getCount(key: FilterKey): number {
    if (key === "all") return sparks.length;
    if (key === "stale") return sparks.filter((s) => s.age_days > 30).length;
    return sparks.filter((s) => s.subtype === key).length;
  }

  function getFiltered(): VaultNode[] {
    if (activeFilter === "all") return sparks;
    if (activeFilter === "stale") return sparks.filter((s) => s.age_days > 30);
    return sparks.filter((s) => s.subtype === activeFilter);
  }

  const staleCount = sparks.filter((s) => s.age_days > 30).length;
  const essaySeedCount = sparks.filter((s) => s.subtype === "essay-seed").length;
  const filtered = getFiltered();

  // Only show filters that have content
  const visibleFilters = FILTERS.filter((f) => getCount(f.key) > 0);

  return (
    <div className="px-5 sm:px-10 lg:px-16 py-10 sm:py-14 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3" style={{ color: "var(--text)" }}>
          Sparks
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{sparks.length} total</span>
          {staleCount > 0 && (
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: "#ef444420", color: "#ef4444" }}
            >
              {staleCount} stale
            </span>
          )}
          {essaySeedCount > 0 && (
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: "#818cf820", color: "#818cf8" }}
            >
              {essaySeedCount} essay seeds
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {visibleFilters.map(({ key, label }) => {
          const active = activeFilter === key;
          const count = getCount(key);
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{
                borderColor: active ? "var(--text-muted)" : "var(--border)",
                color: active ? "var(--text)" : "var(--text-muted)",
                background: active ? "var(--surface-2)" : "transparent",
                fontWeight: active ? 500 : 400,
              }}
            >
              {label} · {count}
            </button>
          );
        })}
      </div>

      <div className="border-t" style={{ borderColor: "var(--border)" }}>
        {filtered.map((s) => <SparkCard key={s.id} spark={s} />)}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm" style={{ color: "var(--text-dim)" }}>
          No sparks in this category.
        </p>
      )}
    </div>
  );
}
