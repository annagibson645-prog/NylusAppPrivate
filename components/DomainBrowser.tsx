"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { VaultNode } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/types";

type SortKey = "backlinks" | "alpha" | "updated" | "sources";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "backlinks", label: "Most linked" },
  { key: "alpha", label: "A–Z" },
  { key: "updated", label: "Newest" },
  { key: "sources", label: "Most sourced" },
];

function typeRoute(n: VaultNode) {
  if (n.type === "spark") return `/spark/${n.id}`;
  if (n.type === "collision") return `/collision/${n.id}`;
  if (n.type === "source") return `/source/${n.id}`;
  return `/concept/${n.id}`;
}

interface Props {
  nodes: VaultNode[];
  hubPages: VaultNode[];
  domainColor: string;
}

export default function DomainBrowser({ nodes, hubPages, domainColor }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("backlinks");

  const conceptNodes = nodes.filter((n) => n.type === "concept" || n.type === "thread");

  // Build hub groups for unfiltered view
  const hubMap = useMemo(() => {
    const m = new Map<string, VaultNode[]>();
    const loose: VaultNode[] = [];
    for (const n of conceptNodes) {
      if (n.hub) {
        if (!m.has(n.hub)) m.set(n.hub, []);
        m.get(n.hub)!.push(n);
      } else {
        loose.push(n);
      }
    }
    return { groups: m, loose };
  }, [nodes]);

  const sortFn = (a: VaultNode, b: VaultNode) => {
    if (sort === "alpha") return a.title.localeCompare(b.title);
    if (sort === "updated") return new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime();
    if (sort === "sources") return (b.sources || 0) - (a.sources || 0);
    return (b.backlinks?.length || 0) - (a.backlinks?.length || 0);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conceptNodes;
    return conceptNodes.filter((n) => n.title.toLowerCase().includes(q));
  }, [query, nodes]);

  const isFiltering = query.trim().length > 0 || sort !== "backlinks";

  return (
    <div>
      {/* Filter + sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        {/* Search input */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ color: "var(--text-dim)" }}
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${conceptNodes.length} concepts…`}
            className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs hover:opacity-70"
              style={{ color: "var(--text-dim)" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {SORTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className="text-xs px-3 py-2 rounded-lg border transition-colors"
              style={{
                borderColor: sort === key ? "var(--text-muted)" : "var(--border)",
                color: sort === key ? "var(--text)" : "var(--text-muted)",
                background: sort === key ? "var(--surface-2)" : "transparent",
                fontWeight: sort === key ? 500 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count when filtering */}
      {query && (
        <p className="text-xs mb-6" style={{ color: "var(--text-dim)" }}>
          {filtered.length} {filtered.length === 1 ? "result" : "results"} for "{query}"
        </p>
      )}

      {/* Hub pages */}
      {!isFiltering && hubPages.length > 0 && (
        <section className="mb-14">
          <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text)" }}>Hubs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hubPages.map((hub) => (
              <Link
                key={hub.id}
                href={`/concept/${hub.id}`}
                className="group block p-5 rounded-xl border hover:opacity-80 transition-opacity"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  borderLeftColor: domainColor,
                  borderLeftWidth: "3px",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
                    {hub.title.replace(/ Hub$/, "").replace(/ — Map of Content$/, "")}
                  </span>
                  <span
                    className="text-xs tabular-nums flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                    style={{ background: domainColor + "20", color: domainColor }}
                  >
                    {hub.links.length}
                  </span>
                </div>
                {hub.excerpt && (
                  <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {hub.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Grouped by hub — only when not filtering/sorting */}
      {!isFiltering && (
        <>
          {Array.from(hubMap.groups.entries()).map(([hubId, members]) => (
            <section key={hubId} className="mb-10">
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-sm font-semibold capitalize" style={{ color: "var(--text)" }}>
                  {hubId.replace(/-hub$/, "").replace(/-/g, " ")}
                </h2>
                <span className="text-xs tabular-nums" style={{ color: "var(--text-dim)" }}>{members.length}</span>
              </div>
              <div className="border-t" style={{ borderColor: "var(--border)" }}>
                {[...members].sort(sortFn).map((n) => (
                  <ConceptRow key={n.id} node={n} href={typeRoute(n)} domainColor={domainColor} />
                ))}
              </div>
            </section>
          ))}

          {hubMap.loose.length > 0 && (
            <section className="mb-10">
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {hubMap.groups.size > 0 ? "Ungrouped" : "All concepts"}
                </h2>
                <span className="text-xs tabular-nums" style={{ color: "var(--text-dim)" }}>{hubMap.loose.length}</span>
              </div>
              <div className="border-t" style={{ borderColor: "var(--border)" }}>
                {[...hubMap.loose].sort(sortFn).map((n) => (
                  <ConceptRow key={n.id} node={n} href={typeRoute(n)} domainColor={domainColor} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Flat sorted list — when filtering or non-default sort */}
      {isFiltering && (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {[...filtered].sort(sortFn).map((n) => (
            <ConceptRow key={n.id} node={n} href={typeRoute(n)} domainColor={domainColor} />
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm" style={{ color: "var(--text-dim)" }}>
              No concepts match "{query}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ConceptRow({ node: n, href, domainColor }: { node: VaultNode; href: string; domainColor: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 py-3.5 border-b hover:opacity-70 transition-opacity"
      style={{ borderColor: "var(--border)" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: STATUS_COLORS[n.status] || "#6b7280" }}
      />
      <span className="flex-1 min-w-0 text-sm leading-snug" style={{ color: "var(--text)" }}>
        {n.title}
      </span>
      <div className="flex items-center gap-3 flex-shrink-0 text-xs" style={{ color: "var(--text-dim)" }}>
        {(n.backlinks?.length || 0) > 0 && (
          <span>{n.backlinks.length} ↩</span>
        )}
        {n.sources > 0 && (
          <span>{n.sources} src</span>
        )}
        <span
          className="capitalize px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            color: STATUS_COLORS[n.status] || "#6b7280",
            background: (STATUS_COLORS[n.status] || "#6b7280") + "18",
          }}
        >
          {n.status}
        </span>
      </div>
    </Link>
  );
}
