"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VaultNode } from "@/lib/types";

const DOMAIN_COLOR: Record<string, string> = {
  "cross-domain":         "#14b8a6",
  "psychology":           "#3b82f6",
  "eastern-spirituality": "#8b5cf6",
  "behavioral-mechanics": "#f97316",
  "creative-practice":    "#f43f5e",
  "history":              "#f59e0b",
  "african-spirituality": "#10b981",
  "ai-collaboration":     "#06b6d4",
};
const DOMAIN_LABEL: Record<string, string> = {
  "cross-domain":         "Cross-Domain",
  "psychology":           "Psychology",
  "eastern-spirituality": "Eastern Spirituality",
  "behavioral-mechanics": "Behavioral Mechanics",
  "creative-practice":    "Creative Practice",
  "history":              "History",
  "african-spirituality": "African Spirituality",
  "ai-collaboration":     "AI Collaboration",
};

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function cleanTitle(t: string) {
  return t.replace(/^Collision:\s*/i, "");
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function Pips({ score, color }: { score: number; color: string }) {
  const total = 10;
  const filled = Math.min(Math.max(Math.round((score / 14) * 10), 1), total);
  return (
    <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%",
          background: i < filled ? color : "rgba(255,255,255,0.07)",
          display: "inline-block", flexShrink: 0,
        }} />
      ))}
    </span>
  );
}

function useWindowWidth() {
  const [width, setWidth] = useState(1400);
  useEffect(() => {
    setWidth(window.innerWidth);
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// Grid-based placement: evenly distributes nodes across the canvas
// Uses seeded shuffle so positions are deterministic but not ordered
function placeNodes(nodes: VaultNode[], W: number, H: number) {
  if (nodes.length === 0) return [];
  const rand = seededRand(42);
  const padding = 24;
  const aW = W - 2 * padding;
  const aH = H - 2 * padding;
  const n = nodes.length;

  // Calculate grid dimensions based on canvas aspect ratio
  const aspect = aW / aH;
  const cols = Math.max(2, Math.round(Math.sqrt(n * aspect)));
  const rows = Math.ceil(n / cols);
  const cellW = aW / cols;
  const cellH = aH / rows;

  // Fisher-Yates shuffle (seeded) — assigns nodes to grid cells randomly
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }

  return idx.map((nodeIdx, cellIdx) => {
    const col = cellIdx % cols;
    const row = Math.floor(cellIdx / cols);
    // Place within inner 65% of cell to avoid clumping at edges
    const x = padding + cellW * col + cellW * 0.175 + rand() * cellW * 0.65;
    const y = padding + cellH * row + cellH * 0.175 + rand() * cellH * 0.65;
    return {
      x, y,
      r: 2.5 + (nodes[nodeIdx].pressure_score ?? 0) * 0.28,
      node: nodes[nodeIdx],
    };
  });
}

const NAV_H = 76;
const FF = "var(--font-fraunces, 'Fraunces', serif)";
const FN = "var(--font-newsreader, 'Newsreader', serif)";
const FM = "var(--font-jetbrains, 'JetBrains Mono', monospace)";

interface PlacedNode { x: number; y: number; r: number; node: VaultNode }

// Diamond Cross (Proto 05) — two thin diamond polygons forming a + shape
function DiamondStar({
  x, y, s, color, opacity, glow,
}: {
  x: number; y: number; s: number; color: string; opacity: number; glow?: boolean;
}) {
  const hw = s * 0.18; // half-width of each arm
  const vPts = `${x},${y - s} ${x + hw},${y} ${x},${y + s} ${x - hw},${y}`;
  const hPts = `${x - s},${y} ${x},${y - hw} ${x + s},${y} ${x},${y + hw}`;
  return (
    <g filter={glow ? "url(#galaxy-glow)" : undefined}>
      <polygon points={vPts} fill={color} opacity={opacity} />
      <polygon points={hPts} fill={color} opacity={opacity} />
    </g>
  );
}

function GalaxyMap({
  allNodes,
  hoveredId,
  domainFilter,
  onHover,
  onSelect,
}: {
  allNodes: VaultNode[];
  hoveredId: string | null;
  domainFilter: string;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const W = 560, H = 660;

  // Positions are stable — based on ALL nodes regardless of current filter
  const placed: PlacedNode[] = useMemo(
    () => placeNodes(allNodes, W, H),
    [allNodes]
  );

  return (
    <svg
      width="100%" height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <filter id="galaxy-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {placed.map(({ x, y, r, node }) => {
        const col = node.color || DOMAIN_COLOR[node.domain] || "#8b5cf6";
        const isHov = hoveredId === node.id;
        const isDimmed = domainFilter !== "all" && node.domain !== domainFilter;
        const opacity = isDimmed ? 0.07 : isHov ? 1 : 0.65;
        const s = isHov && !isDimmed ? r + 2 : r;

        return (
          <g
            key={node.id}
            style={{ cursor: isDimmed ? "default" : "pointer" }}
            onMouseEnter={() => { if (!isDimmed) onHover(node.id); }}
            onMouseLeave={() => onHover(null)}
            onClick={() => { if (!isDimmed) onSelect(node.id); }}
          >
            {/* Outer glow halo on hover — larger, faint */}
            {isHov && !isDimmed && (
              <DiamondStar x={x} y={y} s={s + 6} color={col} opacity={0.28} glow />
            )}
            {/* Main diamond star */}
            <DiamondStar x={x} y={y} s={s} color={col} opacity={opacity} glow={isHov && !isDimmed} />
          </g>
        );
      })}
    </svg>
  );
}

export default function CollisionsPage() {
  const [allNodes, setAllNodes] = useState<VaultNode[]>([]);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"pressure" | "date" | "alpha">("pressure");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const router = useRouter();
  const winWidth = useWindowWidth();
  const isMobile = winWidth < 860;

  useEffect(() => {
    fetch("/data/collisions.json")
      .then((r) => r.json())
      .then((data: VaultNode[]) => {
        setAllNodes(data.filter((n) => n.type === "collision"));
      });
  }, []);

  const domains = useMemo(() => {
    const set = new Set(allNodes.map((n) => n.domain).filter(Boolean));
    return Array.from(set).sort();
  }, [allNodes]);

  const filtered = useMemo(() => {
    let list = allNodes;
    if (domainFilter !== "all") list = list.filter((n) => n.domain === domainFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) =>
        n.title.toLowerCase().includes(q) ||
        (n.excerpt || "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "pressure")
      list = [...list].sort((a, b) => (b.pressure_score ?? 0) - (a.pressure_score ?? 0));
    else if (sortBy === "alpha")
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else
      list = [...list].sort((a, b) => (b.created || "").localeCompare(a.created || ""));
    return list;
  }, [allNodes, search, domainFilter, sortBy]);

  function handleHover(id: string | null) {
    setHoveredId(id);
    if (id && listItemRefs.current[id]) {
      listItemRefs.current[id]!.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function handleSelect(id: string) {
    router.push(`/collision/${id}`);
  }

  const activeFilterCount = domainFilter !== "all"
    ? allNodes.filter((n) => n.domain === domainFilter).length
    : allNodes.length;

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d14", color: "#e8e3f0", fontFamily: FN }}>

      {/* ── NAV ── */}
      <nav style={{
        display: "flex", alignItems: "center",
        gap: isMobile ? 12 : 20,
        padding: `0 ${isMobile ? 20 : 48}px`,
        height: NAV_H,
        borderBottom: "1px solid #1c1828",
        background: "linear-gradient(180deg, #0d0c18 0%, #0a0912 100%)",
        position: "sticky", top: 0, zIndex: 100,
        flexShrink: 0,
      }}>
        {/* Brand */}
        <Link href="/" style={{
          fontFamily: FF, fontStyle: "italic", fontWeight: 200,
          fontSize: isMobile ? 22 : 30, color: "#ffffff",
          textDecoration: "none", letterSpacing: "-.02em", flexShrink: 0,
        }}>NylusS</Link>

        <span style={{ fontFamily: FM, fontSize: 18, color: "#2a2540", flexShrink: 0 }}>/</span>

        <span style={{
          fontFamily: FF, fontStyle: "italic", fontWeight: 200,
          fontSize: isMobile ? 20 : 26, color: "#8b5cf6",
          letterSpacing: "-.01em", flexShrink: 0,
        }}>Collisions</span>

        <span style={{
          fontFamily: FM, fontSize: 11, color: "#6c6490",
          background: "#1c1828", border: "1px solid #2a2540",
          borderRadius: 999, padding: "3px 10px", letterSpacing: ".06em",
          flexShrink: 0,
        }}>
          {allNodes.length > 0 ? `${allNodes.length} active` : "—"}
        </span>

        {/* Site nav links */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
            {[
              { href: "/", label: "Home" },
              { href: "/essays", label: "Essays" },
              { href: "/research", label: "Research" },
              { href: "/sparks", label: "Sparks" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{
                fontFamily: FM, fontSize: 11, color: "#3a3460",
                letterSpacing: ".06em", textTransform: "uppercase",
                textDecoration: "none", transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#8b5cf6")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3a3460")}
              >{label}</Link>
            ))}
          </div>
        )}

        {/* Domain filter dots */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 9, alignItems: "center", flexShrink: 0 }}>
            {domains.map((d) => {
              const col = DOMAIN_COLOR[d] || "#8b5cf6";
              const active = domainFilter === d;
              return (
                <button key={d}
                  onClick={() => setDomainFilter(active ? "all" : d)}
                  title={DOMAIN_LABEL[d] || d}
                  style={{
                    width: 13, height: 13, borderRadius: "50%",
                    background: col,
                    opacity: domainFilter === "all" ? 0.75 : active ? 1 : 0.2,
                    border: "none", cursor: "pointer", padding: 0,
                    boxShadow: active ? `0 0 12px ${col}cc, 0 0 4px ${col}` : "none",
                    outline: active ? `2px solid ${col}50` : "none",
                    outlineOffset: 2,
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Sort buttons */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {(["pressure", "date", "alpha"] as const).map((s) => {
              const label = s === "alpha" ? "A→Z" : s === "pressure" ? "PRESSURE" : "DATE";
              const active = sortBy === s;
              return (
                <button key={s} onClick={() => setSortBy(s)}
                  style={{
                    fontFamily: FM, fontSize: 11, letterSpacing: ".08em",
                    textTransform: "uppercase", padding: "5px 14px",
                    background: active ? "#1c1828" : "transparent",
                    border: `1px solid ${active ? "#3a3460" : "#1c1828"}`,
                    borderRadius: 3,
                    color: active ? "#ffffff" : "#4a4468",
                    cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                  }}
                >{label}</button>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search…"
            style={{
              background: "transparent",
              border: "1px solid #1c1828",
              borderRadius: 2,
              padding: "6px 12px",
              fontFamily: FM, fontSize: 11,
              color: "#8c84b0", outline: "none",
              width: isMobile ? 100 : 160,
            }}
          />
        </div>
      </nav>

      {/* Mobile sort + filter strip */}
      {isMobile && (
        <div style={{
          display: "flex", gap: 8, alignItems: "center",
          padding: "12px 20px", borderBottom: "1px solid #1c1828",
          overflowX: "auto",
        }}>
          {(["pressure", "date", "alpha"] as const).map((s) => {
            const label = s === "alpha" ? "A→Z" : s === "pressure" ? "PRESSURE" : "DATE";
            const active = sortBy === s;
            return (
              <button key={s} onClick={() => setSortBy(s)}
                style={{
                  fontFamily: FM, fontSize: 10, letterSpacing: ".08em",
                  textTransform: "uppercase", padding: "4px 10px",
                  background: active ? "#1c1828" : "transparent",
                  border: `1px solid ${active ? "#3a3460" : "#1c1828"}`,
                  borderRadius: 3, color: active ? "#ffffff" : "#4a4468",
                  cursor: "pointer", flexShrink: 0,
                }}
              >{label}</button>
            );
          })}
          <div style={{ display: "flex", gap: 7, marginLeft: 8 }}>
            {domains.map((d) => {
              const col = DOMAIN_COLOR[d] || "#8b5cf6";
              const active = domainFilter === d;
              return (
                <button key={d}
                  onClick={() => setDomainFilter(active ? "all" : d)}
                  title={DOMAIN_LABEL[d]}
                  style={{
                    width: 11, height: 11, borderRadius: "50%",
                    background: col,
                    opacity: domainFilter === "all" ? 0.75 : active ? 1 : 0.2,
                    border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
                    boxShadow: active ? `0 0 8px ${col}cc` : "none",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        width: "100%",
      }}>

        {/* LEFT — Galaxy Map (68%) */}
        <div style={{
          width: isMobile ? "100%" : "68%",
          flexShrink: 0,
          padding: isMobile ? "20px 16px" : "28px 24px 24px 44px",
          position: isMobile ? "relative" : "sticky",
          top: isMobile ? undefined : NAV_H,
          height: isMobile ? "55vw" : `calc(100vh - ${NAV_H}px)`,
          minHeight: isMobile ? 300 : undefined,
          overflow: "hidden",
          borderRight: isMobile ? "none" : "1px solid #1c1828",
          borderBottom: isMobile ? "1px solid #1c1828" : "none",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Status line */}
          <div style={{
            fontFamily: FM, fontSize: 10, color: "#2a2540",
            letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12,
          }}>
            {domainFilter !== "all"
              ? `${DOMAIN_LABEL[domainFilter] || domainFilter} · ${activeFilterCount} collisions`
              : `all domains · ${allNodes.length} collisions`}
          </div>

          {/* SVG map */}
          <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
            <GalaxyMap
              allNodes={allNodes}
              hoveredId={hoveredId}
              domainFilter={domainFilter}
              onHover={handleHover}
              onSelect={handleSelect}
            />
          </div>

          {/* Legend */}
          {!isMobile && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 12,
            }}>
              {Object.entries(DOMAIN_COLOR).map(([d, col]) => (
                <button
                  key={d}
                  onClick={() => setDomainFilter(domainFilter === d ? "all" : d)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    opacity: domainFilter === "all" || domainFilter === d ? 1 : 0.35,
                    transition: "opacity 0.15s",
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: col, display: "inline-block",
                    boxShadow: domainFilter === d ? `0 0 6px ${col}` : "none",
                  }} />
                  <span style={{
                    fontFamily: FM, fontSize: 9, color: domainFilter === d ? col : "#3a3460",
                    letterSpacing: ".06em", textTransform: "uppercase",
                  }}>
                    {DOMAIN_LABEL[d]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Collision list (32%) */}
        <div style={{
          width: isMobile ? "100%" : "32%",
          flexShrink: 0,
          padding: isMobile ? "24px 20px 80px" : "24px 36px 80px 20px",
          overflowY: "auto",
          height: isMobile ? "auto" : `calc(100vh - ${NAV_H}px)`,
          position: isMobile ? "relative" : "sticky",
          top: isMobile ? undefined : NAV_H,
        }}>
          {filtered.length === 0 && (
            <div style={{
              fontFamily: FM, fontSize: 11, color: "#2a2540",
              letterSpacing: ".08em", textTransform: "uppercase",
              marginTop: 40, textAlign: "center",
            }}>
              no collisions found
            </div>
          )}

          {filtered.map((node) => {
            const col = node.color || DOMAIN_COLOR[node.domain] || "#8b5cf6";
            const score = node.pressure_score ?? 0;
            const isHov = hoveredId === node.id;
            return (
              <div
                key={node.id}
                ref={(el) => { listItemRefs.current[node.id] = el; }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  borderBottom: "1px solid #1c1828",
                  padding: "18px 0",
                  background: isHov ? `rgba(${hexToRgb(col)},0.04)` : "transparent",
                  paddingLeft: isHov ? 10 : 0,
                  borderLeft: isHov ? `2px solid ${col}` : "2px solid transparent",
                  transition: "background 0.15s, padding-left 0.15s",
                }}
              >
                <Link href={`/collision/${node.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: col, display: "inline-block", flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: FM, fontSize: 9, color: col,
                      letterSpacing: ".1em", textTransform: "uppercase",
                    }}>{DOMAIN_LABEL[node.domain] || node.domain}</span>
                    <span style={{ fontFamily: FM, fontSize: 9, color: "#2a2540", marginLeft: "auto" }}>
                      {node.created}
                    </span>
                  </div>
                  <h2 style={{
                    fontFamily: FF, fontStyle: "italic", fontWeight: 200,
                    fontSize: isMobile ? 17 : 20,
                    color: isHov ? "#e8e3f0" : "#c9b8e8",
                    letterSpacing: "-.01em", marginBottom: 5, lineHeight: 1.25,
                    transition: "color 0.15s",
                  }}>{cleanTitle(node.title)}</h2>
                  {node.excerpt && (
                    <p style={{
                      fontFamily: FN, fontSize: 13, color: "#6c6490",
                      lineHeight: 1.55, marginBottom: 8,
                    }}>{node.excerpt}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Pips score={score} color={col} />
                    <span style={{ fontFamily: FM, fontSize: 10, color: "#3a3460", letterSpacing: ".06em" }}>
                      {score}
                    </span>
                    <span style={{
                      fontFamily: FM, fontSize: 9, color: "#2a2540",
                      letterSpacing: ".08em", textTransform: "uppercase", marginLeft: 6,
                    }}>{node.status}</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
