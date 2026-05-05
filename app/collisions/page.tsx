"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import type { VaultNode, GraphData } from "@/lib/types";

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
          display: "inline-block",
          flexShrink: 0,
        }} />
      ))}
    </span>
  );
}

interface CraterMapProps {
  nodes: VaultNode[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

function CraterMap({ nodes, hoveredId, onHover }: CraterMapProps) {
  const W = 400, H = 520;
  const rand = seededRand(42);
  const placed: Array<{ x: number; y: number; r: number; node: VaultNode }> = [];

  for (const node of nodes) {
    const r = 4 + (node.pressure_score ?? 0) * 1.1;
    let x = 0, y = 0, tries = 0;
    do {
      x = r + rand() * (W - 2 * r);
      y = r + rand() * (H - 2 * r);
      tries++;
    } while (
      tries < 30 &&
      placed.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + r + 3)
    );
    placed.push({ x, y, r, node });
  }

  return (
    <svg
      width={W} height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {placed.map(({ x, y, r, node }) => {
        const col = node.color || DOMAIN_COLOR[node.domain] || "#8b5cf6";
        const isHov = hoveredId === node.id;
        return (
          <g key={node.id}
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={x} cy={y} r={r + (isHov ? 3 : 0)}
              fill={col}
              opacity={isHov ? 0.95 : 0.55}
              style={{ transition: "all 0.15s" }}
            />
            <circle
              cx={x} cy={y} r={r * 0.45}
              fill="rgba(0,0,0,0.35)"
            />
            {isHov && (
              <circle
                cx={x} cy={y} r={r + 7}
                fill="none"
                stroke={col}
                strokeWidth={1}
                opacity={0.5}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

const FF = "var(--font-fraunces, 'Fraunces', serif)";
const FN = "var(--font-newsreader, 'Newsreader', serif)";
const FM = "var(--font-jetbrains, 'JetBrains Mono', monospace)";

export default function CollisionsPage() {
  const [allNodes, setAllNodes] = useState<VaultNode[]>([]);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"pressure" | "date" | "alpha">("pressure");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch("/data/graph.json")
      .then((r) => r.json())
      .then((data: GraphData) => {
        const cols = data.nodes.filter((n) => n.type === "collision");
        setAllNodes(cols);
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
    if (sortBy === "pressure") list = [...list].sort((a, b) => (b.pressure_score ?? 0) - (a.pressure_score ?? 0));
    else if (sortBy === "alpha") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "date") list = [...list].sort((a, b) => (b.created || "").localeCompare(a.created || ""));
    return list;
  }, [allNodes, search, domainFilter, sortBy]);

  const craterNodes = useMemo(
    () => allNodes.filter((n) => (n.pressure_score ?? 0) >= 8),
    [allNodes]
  );

  function handleHover(id: string | null) {
    setHoveredId(id);
    if (id && listItemRefs.current[id]) {
      listItemRefs.current[id]!.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d14", color: "#e8e3f0", fontFamily: FN }}>

      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 28px", height: 52,
        borderBottom: "1px solid #1c1828",
        background: "#0a0912",
        position: "sticky", top: 0, zIndex: 100,
        flexWrap: "wrap",
      }}>
        <Link href="/" style={{
          fontFamily: FF, fontStyle: "italic", fontWeight: 300,
          fontSize: 17, color: "#e8e3f0", textDecoration: "none",
          letterSpacing: "-.01em",
        }}>NylusS</Link>
        <span style={{ color: "#2a2540", fontSize: 16 }}>|</span>
        <span style={{ fontFamily: FM, fontSize: 11, color: "#4a4468", letterSpacing: ".08em", textTransform: "uppercase" }}>
          collisions
        </span>
        <span style={{ fontFamily: FM, fontSize: 11, color: "#2a2540", letterSpacing: ".04em" }}>
          {allNodes.length > 0 ? `${allNodes.length}` : "—"}
        </span>
        <span style={{ color: "#2a2540", fontSize: 16, marginLeft: 4 }}>|</span>

        {/* Domain dots */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {domains.map((d) => {
            const col = DOMAIN_COLOR[d] || "#8b5cf6";
            const active = domainFilter === d;
            return (
              <button key={d} onClick={() => setDomainFilter(active ? "all" : d)}
                title={DOMAIN_LABEL[d] || d}
                style={{
                  width: 9, height: 9, borderRadius: "50%",
                  background: col,
                  opacity: domainFilter === "all" ? 0.6 : active ? 1 : 0.2,
                  border: "none", cursor: "pointer", padding: 0,
                  boxShadow: active ? `0 0 8px ${col}` : "none",
                  transition: "all 0.15s",
                }}
              />
            );
          })}
        </div>

        <span style={{ color: "#2a2540", fontSize: 16 }}>|</span>

        {/* Sort */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["pressure", "date", "alpha"] as const).map((s) => (
            <button key={s} onClick={() => setSortBy(s)}
              style={{
                fontFamily: FM, fontSize: 10, letterSpacing: ".08em",
                textTransform: "uppercase", padding: "3px 8px",
                background: sortBy === s ? "#1c1828" : "transparent",
                border: `1px solid ${sortBy === s ? "#2a2540" : "transparent"}`,
                borderRadius: 2, color: sortBy === s ? "#8c84b0" : "#3a3460",
                cursor: "pointer",
              }}
            >{s}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginLeft: "auto" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search…"
            style={{
              background: "transparent",
              border: "1px solid #1c1828",
              borderRadius: 2,
              padding: "4px 10px",
              fontFamily: FM, fontSize: 11,
              color: "#8c84b0",
              outline: "none",
              width: 140,
            }}
          />
        </div>
      </nav>

      {/* BODY */}
      <div style={{ display: "flex", maxWidth: 1280, margin: "0 auto" }}>

        {/* LEFT — Crater Map */}
        <div style={{
          width: 440, flexShrink: 0,
          padding: "40px 24px 40px 32px",
          position: "sticky", top: 52, height: "calc(100vh - 52px)",
          overflow: "hidden",
          borderRight: "1px solid #1c1828",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ fontFamily: FM, fontSize: 11, color: "#2a2540", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 16 }}>
            pressure ≥ 8 · {craterNodes.length} collisions
          </div>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "flex-start" }}>
            <CraterMap nodes={craterNodes} hoveredId={hoveredId} onHover={handleHover} />
          </div>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 16 }}>
            {Object.entries(DOMAIN_COLOR).map(([d, col]) => (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, display: "inline-block" }} />
                <span style={{ fontFamily: FM, fontSize: 9, color: "#3a3460", letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {DOMAIN_LABEL[d]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — List */}
        <div style={{ flex: 1, padding: "40px 32px 80px", minWidth: 0 }}>
          {filtered.length === 0 && (
            <div style={{ fontFamily: FM, fontSize: 12, color: "#2a2540", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 40, textAlign: "center" }}>
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
                  padding: "22px 0",
                  background: isHov ? `rgba(${hexToRgb(col)},0.04)` : "transparent",
                  transition: "background 0.15s",
                  paddingLeft: isHov ? 12 : 0,
                  borderLeft: isHov ? `2px solid ${col}` : "2px solid transparent",
                }}
              >
                <Link href={`/collision/${node.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: col, display: "inline-block", flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: FM, fontSize: 10, color: col,
                      letterSpacing: ".1em", textTransform: "uppercase",
                    }}>{DOMAIN_LABEL[node.domain] || node.domain}</span>
                    <span style={{ fontFamily: FM, fontSize: 10, color: "#2a2540", marginLeft: "auto" }}>
                      {node.created}
                    </span>
                  </div>
                  <h2 style={{
                    fontFamily: FF, fontStyle: "italic", fontWeight: 200,
                    fontSize: 22, color: isHov ? "#e8e3f0" : "#c9b8e8",
                    letterSpacing: "-.01em", marginBottom: 6, lineHeight: 1.2,
                    transition: "color 0.15s",
                  }}>{cleanTitle(node.title)}</h2>
                  {node.excerpt && (
                    <p style={{
                      fontFamily: FN, fontSize: 14, color: "#6c6490",
                      lineHeight: 1.6, marginBottom: 10,
                    }}>{node.excerpt}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Pips score={score} color={col} />
                    <span style={{ fontFamily: FM, fontSize: 11, color: "#3a3460", letterSpacing: ".06em" }}>
                      {score}
                    </span>
                    <span style={{ fontFamily: FM, fontSize: 10, color: "#2a2540", letterSpacing: ".08em", textTransform: "uppercase", marginLeft: 8 }}>
                      {node.status}
                    </span>
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
