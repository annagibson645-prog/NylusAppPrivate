"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { VaultNode, IndexSection } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/types";

type SortKey = "backlinks" | "alpha" | "updated" | "sources";
type Tab = "browse" | "index";

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
  indexSections: IndexSection[];
}

export default function DomainBrowser({ nodes, hubPages, domainColor, indexSections }: Props) {
  const [tab, setTab] = useState<Tab>("browse");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("backlinks");

  const conceptNodes = nodes.filter((n) => n.type === "concept" || n.type === "thread");
  const ungrouped = useMemo(() => conceptNodes.filter((n) => !n.hub), [nodes]);

  const sortFn = (a: VaultNode, b: VaultNode) => {
    if (sort === "alpha") return a.title.localeCompare(b.title);
    if (sort === "updated") return new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime();
    if (sort === "sources") return (b.sources || 0) - (a.sources || 0);
    return (b.backlinks?.length || 0) - (a.backlinks?.length || 0);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ungrouped;
    return conceptNodes.filter((n) => n.title.toLowerCase().includes(q));
  }, [query, nodes]);

  const isSearching = query.trim().length > 0;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-10 border-b" style={{ borderColor: "var(--border)" }}>
        {(["browse", "index"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{
              color: tab === t ? "var(--text)" : "var(--text-muted)",
            }}
          >
            {t === "browse" ? "Browse" : "Full Index"}
            {tab === t && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: domainColor }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── BROWSE TAB ─────────────────────────────────────────── */}
      {tab === "browse" && (
        <div>
          {/* Hub cards — navigation only */}
          {hubPages.length > 0 && (
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

          {/* Ungrouped concepts */}
          <section>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
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
                  placeholder={isSearching ? `Searching all ${conceptNodes.length} concepts…` : `Filter ${ungrouped.length} ungrouped concepts…`}
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
              {/* Sort */}
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

            {query && (
              <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
                {filtered.length} {filtered.length === 1 ? "result" : "results"} across all concepts
              </p>
            )}

            {!isSearching && ungrouped.length > 0 && (
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
                Ungrouped
                <span className="ml-2 font-normal tabular-nums" style={{ color: "var(--text-dim)" }}>
                  {ungrouped.length}
                </span>
              </h2>
            )}

            <div className="border-t" style={{ borderColor: "var(--border)" }}>
              {[...(isSearching ? filtered : ungrouped)].sort(sortFn).map((n) => (
                <ConceptRow key={n.id} node={n} href={typeRoute(n)} domainColor={domainColor} />
              ))}
              {isSearching && filtered.length === 0 && (
                <p className="py-12 text-center text-sm" style={{ color: "var(--text-dim)" }}>
                  No concepts match "{query}"
                </p>
              )}
              {!isSearching && ungrouped.length === 0 && (
                <p className="py-8 text-center text-sm" style={{ color: "var(--text-dim)" }}>
                  All concepts are organized into hubs
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── FULL INDEX TAB ─────────────────────────────────────── */}
      {tab === "index" && (
        <DomainFullIndex sections={indexSections} domainColor={domainColor} />
      )}
    </div>
  );
}

// ── Concept row ───────────────────────────────────────────────────────────────
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
        {(n.backlinks?.length || 0) > 0 && <span>{n.backlinks.length} ↩</span>}
        {n.sources > 0 && <span>{n.sources} src</span>}
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

// ── Full Index ─────────────────────────────────────────────────────────────────
function DomainFullIndex({ sections, domainColor }: { sections: IndexSection[]; domainColor: string }) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if (sections.length === 0) {
    return (
      <p className="py-16 text-center text-sm" style={{ color: "var(--text-dim)" }}>
        No index available for this domain yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, i) => {
        const isOpen = open.has(i);
        return (
          <div
            key={i}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            {/* Section header */}
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="text-xs font-medium tabular-nums px-2 py-0.5 rounded flex-shrink-0"
                  style={{ background: domainColor + "20", color: domainColor }}
                >
                  {section.concepts.length}
                </span>
                <span
                  className="text-sm font-medium leading-snug truncate"
                  style={{ color: "var(--text)" }}
                >
                  {section.title}
                </span>
              </div>
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                className="flex-shrink-0 ml-3 transition-transform"
                style={{
                  color: "var(--text-dim)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Concept list */}
            {isOpen && (
              <div className="border-t" style={{ borderColor: "var(--border)" }}>
                {section.concepts.map((concept, j) => (
                  <Link
                    key={j}
                    href={`/concept/${concept.slug}`}
                    className="flex items-start gap-4 px-5 py-3 border-b hover:opacity-70 transition-opacity last:border-b-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                          {concept.title}
                        </span>
                        {concept.status && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize flex-shrink-0"
                            style={{
                              color: STATUS_COLORS[concept.status] || "#6b7280",
                              background: (STATUS_COLORS[concept.status] || "#6b7280") + "18",
                            }}
                          >
                            {concept.status}
                          </span>
                        )}
                      </div>
                      {concept.description && (
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
                          {concept.description}
                        </p>
                      )}
                    </div>
                    {concept.sources !== undefined && concept.sources > 0 && (
                      <span className="text-xs flex-shrink-0 mt-0.5 tabular-nums" style={{ color: "var(--text-dim)" }}>
                        {concept.sources} src
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
