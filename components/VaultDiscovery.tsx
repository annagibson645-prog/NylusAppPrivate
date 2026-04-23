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

export default function VaultDiscovery() {
  const [picks, setPicks] = useState<SearchItem[]>([]);

  const load = () =>
    fetch("/data/search-index.json")
      .then((r) => r.json())
      .then((items: SearchItem[]) => {
        const pool = items.filter((i) =>
          ["concept", "hub", "spark", "collision"].includes(i.type)
        );
        setPicks(pickThreeFromDifferentDomains(pool));
      });

  useEffect(() => { load(); }, []);

  if (!picks.length) return null;

  return (
    <div className="mb-14 sm:mb-20">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          From the Vault
        </h2>
        <button
          onClick={load}
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: "var(--text-dim)" }}
        >
          Shuffle ↺
        </button>
      </div>

      <div className="border-t" style={{ borderColor: "var(--border)" }}>
        {picks.map((item) => (
          <Link
            key={item.id}
            href={routeForItem(item)}
            className="flex items-center gap-4 py-5 border-b hover:opacity-70 transition-opacity group"
            style={{ borderColor: "var(--border)" }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: item.color }}
            />
            <div className="flex-1 min-w-0">
              <span
                className="text-base font-medium leading-snug"
                style={{ color: "var(--text)" }}
              >
                {item.title}
              </span>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-xs hidden sm:block" style={{ color: item.color }}>
                {DOMAIN_LABELS[item.domain] || item.domain}
              </span>
              <span className="text-xs capitalize" style={{ color: "var(--text-dim)" }}>
                {item.type}
              </span>
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
