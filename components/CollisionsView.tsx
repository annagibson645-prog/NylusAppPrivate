"use client";
import { useState } from "react";
import CollisionCard from "@/components/CollisionCard";
import type { VaultNode } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

interface Props {
  collisions: VaultNode[];
}

export default function CollisionsView({ collisions }: Props) {
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  const domains = [...new Set(collisions.map((c) => c.domain).filter(Boolean))].sort();
  const filtered = activeDomain ? collisions.filter((c) => c.domain === activeDomain) : collisions;

  return (
    <div className="px-5 sm:px-10 lg:px-16 py-10 sm:py-14 max-w-3xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2" style={{ color: "var(--text)" }}>
          Collisions
        </h1>
        <p className="text-base" style={{ color: "var(--text-muted)" }}>
          {collisions.length} active tensions · sorted by pressure score
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveDomain(null)}
          className="text-xs px-3 py-1.5 rounded-full border transition-colors"
          style={{
            borderColor: activeDomain === null ? "var(--text-muted)" : "var(--border)",
            color: activeDomain === null ? "var(--text)" : "var(--text-muted)",
            background: activeDomain === null ? "var(--surface-2)" : "transparent",
            fontWeight: activeDomain === null ? 500 : 400,
          }}
        >
          All · {collisions.length}
        </button>
        {domains.map((domain) => {
          const count = collisions.filter((c) => c.domain === domain).length;
          const active = activeDomain === domain;
          return (
            <button
              key={domain}
              onClick={() => setActiveDomain(active ? null : domain)}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{
                borderColor: active ? "var(--text-muted)" : "var(--border)",
                color: active ? "var(--text)" : "var(--text-muted)",
                background: active ? "var(--surface-2)" : "transparent",
                fontWeight: active ? 500 : 400,
              }}
            >
              {DOMAIN_LABELS[domain] || domain} · {count}
            </button>
          );
        })}
      </div>

      <div className="border-t" style={{ borderColor: "var(--border)" }}>
        {filtered.map((c) => <CollisionCard key={c.id} collision={c} />)}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm" style={{ color: "var(--text-dim)" }}>
          No collisions in this domain.
        </p>
      )}
    </div>
  );
}
