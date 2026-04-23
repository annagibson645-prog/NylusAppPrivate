"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SearchItem } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

function pickThreeFromDifferentDomains(items: SearchItem[]): SearchItem[] {
  const byDomain = new Map<string, SearchItem[]>();
  for (const item of items) {
    if (!byDomain.has(item.domain)) byDomain.set(item.domain, []);
    byDomain.get(item.domain)!.push(item);
  }

  const domains = Array.from(byDomain.keys());
  // Shuffle domains
  for (let i = domains.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [domains[i], domains[j]] = [domains[j], domains[i]];
  }

  const picks: SearchItem[] = [];
  for (const domain of domains) {
    if (picks.length >= 3) break;
    const pool = byDomain.get(domain)!;
    picks.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return picks;
}

function routeForItem(item: SearchItem): string {
  if (item.type === "spark") return `/spark/${item.id}`;
  if (item.type === "collision") return `/collision/${item.id}`;
  if (item.type === "source") return `/source/${item.id}`;
  return `/concept/${item.id}`;
}

const TYPE_LABEL: Record<string, string> = {
  concept: "concept",
  hub: "hub",
  spark: "spark",
  collision: "collision",
  source: "source",
};

export default function VaultDiscovery() {
  const [picks, setPicks] = useState<SearchItem[]>([]);

  useEffect(() => {
    fetch("/data/search-index.json")
      .then((r) => r.json())
      .then((items: SearchItem[]) => {
        const pool = items.filter((i) =>
          ["concept", "hub", "spark", "collision"].includes(i.type)
        );
        setPicks(pickThreeFromDifferentDomains(pool));
      });
  }, []);

  if (!picks.length) return null;

  return (
    <div className="mb-14 sm:mb-20">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          From the Vault
        </h2>
        <button
          onClick={() => {
            fetch("/data/search-index.json")
              .then((r) => r.json())
              .then((items: SearchItem[]) => {
                const pool = items.filter((i) =>
                  ["concept", "hub", "spark", "collision"].includes(i.type)
                );
                setPicks(pickThreeFromDifferentDomains(pool));
              });
          }}
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: "var(--text-dim)" }}
        >
          Shuffle ↺
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {picks.map((item) => (
          <Link
            key={item.id}
            href={routeForItem(item)}
            className="block rounded-lg border p-4 hover:opacity-80 transition-opacity"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-xs" style={{ color: item.color }}>
                {DOMAIN_LABELS[item.domain] || item.domain}
              </span>
              <span className="text-[10px] ml-auto" style={{ color: "var(--text-dim)" }}>
                {TYPE_LABEL[item.type] || item.type}
              </span>
            </div>
            <h3 className="text-sm font-medium leading-snug mb-2" style={{ color: "var(--text)" }}>
              {item.title}
            </h3>
            {item.excerpt && (
              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
                {item.excerpt}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
