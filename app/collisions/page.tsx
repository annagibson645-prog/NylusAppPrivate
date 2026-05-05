"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import type { VaultNode, GraphData } from "@/lib/types";

// ─── Domain config ────────────────────────────────────────────────────────────
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

function cleanTitle(t: string) {
  return t.replace(/^Collision:\s*/i, "");
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function Pips({ score, color }: { score: number; color: string }) {
  const total = 10;
  const filled = Math.min(Math.max(Math.round((score / 14) * 10), 1), total);
  return (
    <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%",
          background: i < filled ? color : "rgba(255,255,255,0.08)",
          display: "inline-block", flexShrink: 0,
        }} />
      ))}
    </span>
  );
}

function CraterMap({
  collisions, activeDomains, onHover, hovered,
}: {
  collisions: VaultNode[];
  activeDomains: Set<string>;
  onHover: (id: string | null) => void;
  hovered: string | null;
}) {
  const W = 500; const H = 420;
  const CX = W / 2; const CY = H / 2;
  const MAX_R = 195;

  const mapNodes = useMemo(
    () => collisions.filter((c) => (c.pressure_score ?? 0) >= 8),
    [collisions]
  );

  const placed = useMemo(() => {
    const positions: { id: string; x: number; y: number; r: number; node: VaultNode }[] = [];
    mapNodes.forEach((node, i) => {
      const rng = seededRand(i * 73 + 11);
      const score = node.pressure_score ?? 8;
      const craterR = 4 + (score / 14) * 10;
      let bestX = CX, bestY = CY;
      for (let attempt = 0; attempt < 100; attempt++) {
        const angle = rng() * Math.PI * 2;
        const dist = 18 + rng() * (MAX_R - craterR - 10);
        const px = CX + Math.cos(angle) * dist;
        const py = CY + Math.sin(angle) * dist;
        const ok = positions.every(
          (p) => Math.hypot(px - p.x, py - p.y) > p.r + craterR + 3
        );
        if (ok || attempt === 99) { bestX = px; bestY = py; break; }
      }
      positions.push({ id: node.id, x: bestX, y: bestY, r: craterR, node });
    });
    return positions;
  }, [mapNodes]);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", maxWidth: "100%" }}>
      {[55, 105, 155, 200].map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r}
          fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
      ))}
      {placed.map(({ id, x, y, r, node }) => {
        const col = node.color || DOMAIN_COLOR[node.domain] || "#8b5cf6";
        const isActive = activeDomains.size === 0 || activeDomains.has(node.domain);
        const isHov = hovered === id;
        return (
          <g key={id}>
            {isHov && <circle cx={x} cy={y} r={r + 7} fill={col} opacity={0.1} />}
            <circle cx={x} cy={y} r={r} fill="none"
              stroke={isActive ? col : "rgba(255,255,255,0.07)"}
              strokeWidth={isHov ? 1.5 : 1}
              opacity={isActive ? (isHov ? 1 : 0.55) : 0.12} />
            <circle cx={x} cy={y} r={r * 0.5} fill="none"
              stroke={isActive ? col : "rgba(255,255,255,0.04)"}
              strokeWidth={0.7}
              opacity={isActive ? 0.35 : 0.08} />
            <circle cx={x} cy={y} r={1.8}
              fill={isActive ? col : "rgba(255,255,255,0.08)"}
              opacity={isActive ? (isHov ? 1 : 0.65) : 0.12} />
            {isHov && isActive && (
              <>
                <line x1={x} y1={y - r - 2} x2={x} y2={y - r - 12}
                  stroke={col} strokeWidth={0.8} opacity={0.5} />
                <text x={x} y={y - r - 16}
                  textAnchor="middle" fill={col}
                  fontSize={10} fontFamily="'JetBrains Mono', monospace">
                  {cleanTitle(node.title).slice(0, 32)}
                  {cleanTitle(node.title).length > 32 ? "…" : ""}
                </text>
              </>
            )}
            <circle cx={x} cy={y} r={Math.max(r + 5, 10)} fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => onHover(id)}
              onMouseLeave={() => onHover(null)} />
          </g>
        );
      })}
    </svg>
  );
}

export default function CollisionsPage() {
  const [collisions, setCollisions] = useState<VaultNode[]>([]);
  const [activeDomains, setActiveDomains] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<"pressure" | "recent" | "domain">("pressure");
  const [search, setSearch] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/graph.json")
      .then((r) => r.json())
      .then((d: GraphData) => {
        setCollisions(
          d.nodes.filter((n) => n.type === "collision")
            .sort((a, b) => (b.pressure_score ?? 0) - (a.pressure_score ?? 0))
        );
      });
  }, []);

  useEffect(() => {
    if (!hovered || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-id="${hovered}"]`) as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [hovered]);

  const domains = useMemo(() => {
    const map: Record<string, number> = {};
    collisions.forEach((c) => { map[c.domain] = (map[c.domain] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [collisions]);

  const toggleDomain = (d: string) =>
    setActiveDomains((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });

  const filtered = useMemo(() => {
    let list = collisions;
    if (activeDomains.size > 0) list = list.filter((c) => activeDomains.has(c.domain));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.excerpt?.toLowerCase().includes(q)
      );
    }
    if (sort === "pressure") return [...list].sort((a, b) => (b.pressure_score ?? 0) - (a.pressure_score ?? 0));
    if (sort === "recent")   return [...list].sort((a, b) => b.created.localeCompare(a.created));
    if (sort === "domain")   return [...list].sort((a, b) => a.domain.localeCompare(b.domain));
    return list;
  }, [collisions, activeDomains, search, sort]);

  const FF  = "var(--font-fraunces, 'Fraunces', serif)";
  const FN  = "var(--font-newsreader, 'Newsreader', serif)";
  const FM  = "var(--font-jetbrains, 'JetBrains Mono', monospace)";

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d14", color: "#e8e3f0", fontFamily: FN }}>

      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "0 28px", height: 52,
        borderBottom: "1px solid #1c1828",
        background: "#0a0912",
        position: "sticky", top: 0, zIndex: 100,
        overflowX: "auto",
      }}>
        <Link href="/" style={{
          fontFamily: FF, fontStyle: "italic", fontWeight: 300,
          fontSize: 17, color: "#e8e3f0", textDecoration: "none",
          letterSpacing: "-.01em", flexShrink: 0,
        }}>NylusS</Link>

        <span style={{ fontFamily: FM, fontSize: 11, color: "#4a4468", letterSpacing: ".06em", flexShrink: 0 }}>
          {collisions.length} collisions
        </span>

        <span style={{ color: "#2a2540", fontSize: 16, flexShrink: 0 }}>|</span>

        {/* Domain dots */}
        {domains.map(([domain, count]) => {
          const col = DOMAIN_COLOR[domain] || "#8b5cf6";
          const active = activeDomains.has(domain);
          const faded = activeDomains.size > 0 && !active;
          return (
            <button key={domain} onClick={() => toggleDomain(domain)} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              padding: "3px 0", opacity: faded ? 0.25 : 1,
              transition: "opacity 0.15s", flexShrink: 0,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: col,
                display: "inline-block", flexShrink: 0,
                boxShadow: active ? `0 0 6px ${col}90` : "none",
                transition: "box-shadow 0.15s",
              }} />
              <span style={{
                fontFamily: FM, fontSize: 10,
                color: active ? col : "#4a4468",
                letterSpacing: ".08em", textTransform: "uppercase",
                transition: "color 0.15s",
              }}>{DOMAIN_LABEL[domain] || domain} {count}</span>
            </button>
          );
        })}

        <span style={{ color: "#2a2540", fontSize: 16, marginLeft: "auto", flexShrink: 0 }}>|</span>

        {/* Sort */}
        {(["pressure", "recent", "domain"] as const).map((s) => (
          <button key={s} onClick={() => setSort(s)} style={{
            fontFamily: FM, fontSize: 10, letterSpacing: ".08em",
            textTransform: "uppercase",
            color: sort === s ? "#c9b8e8" : "#4a4468",
            background: sort === s ? "rgba(201,184,232,0.08)" : "none",
            border: sort === s ? "1px solid rgba(201,184,232,0.18)" : "1px solid transparent",
            borderRadius: 3, padding: "3px 8px", cursor: "pointer",
            transition: "all 0.15s", flexShrink: 0,
          }}>{s}</button>
        ))}
      </nav>

      {/* BODY */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "540px 1fr",
        minHeight: "calc(100vh - 52px)",
      }}>

        {/* LEFT — Crater Map */}
        <div style={{
          borderRight: "1px solid #1c1828",
          padding: "28px 20px 28px 28px",
          position: "sticky", top: 52,
          height: "calc(100vh - 52px)",
          display: "flex", flexDirection: "column", gap: 16,
          overflow: "hidden",
        }}>
          <div>
            <div style={{ fontFamily: FM, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#2a2540", marginBottom: 3 }}>
              Pressure Map — p8+
            </div>
            <div style={{ fontFamily: FN, fontStyle: "italic", fontSize: 13, color: "#3a3460" }}>
              {collisions.filter((c) => (c.pressure_score ?? 0) >= 8 && (activeDomains.size === 0 || activeDomains.has(c.domain))).length} high-pressure collisions
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
            {collisions.length > 0 && (
              <CraterMap collisions={collisions} activeDomains={activeDomains} onHover={setHovered} hovered={hovered} />
            )}
          </div>

          <div style={{ borderTop: "1px solid #1c1828", paddingTop: 12, minHeight: 52 }}>
            {hovered ? (() => {
              const node = collisions.find((c) => c.id === hovered);
              if (!node) return null;
              const col = node.color || DOMAIN_COLOR[node.domain] || "#8b5cf6";
              return (
                <div>
                  <div style={{ fontFamily: FF, fontStyle: "italic", fontWeight: 300, fontSize: 15, color: "#e8e3f0", lineHeight: 1.25, marginBottom: 5 }}>
                    {cleanTitle(node.title)}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontFamily: FM, fontSize: 10, color: col, letterSpacing: ".1em", textTransform: "uppercase" }}>
                      {DOMAIN_LABEL[node.domain] || node.domain}
                    </span>
                    <Pips score={node.pressure_score ?? 0} color={col} />
                  </div>
                </div>
              );
            })() : (
              <div style={{ fontFamily: FM, fontSize: 10, color: "#2a2540", letterSpacing: ".08em" }}>
                hover crater to inspect
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — List */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Search */}
          <div style={{
            padding: "14px 28px",
            borderBottom: "1px solid #1c1828",
            position: "sticky", top: 52,
            background: "#0e0d14", zIndex: 10,
          }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search collisions…"
              style={{
                width: "100%", background: "#12111f",
                border: "1px solid #1c1828", borderRadius: 4,
                padding: "9px 14px", fontFamily: FM,
                fontSize: 12, color: "#8c84b0", outline: "none",
                letterSpacing: ".04em",
              }}
            />
          </div>

          <div ref={listRef} style={{ flex: 1 }}>
            {filtered.length === 0 && (
              <div style={{ padding: "60px 28px", fontFamily: FM, fontSize: 11, color: "#3a3460", letterSpacing: ".1em" }}>
                no collisions match
              </div>
            )}
            {filtered.map((node) => {
              const col = node.color || DOMAIN_COLOR[node.domain] || "#8b5cf6";
              const isHov = hovered === node.id;
              const score = node.pressure_score ?? 0;
              return (
                <Link
                  key={node.id}
                  href={`/collision/${node.id}`}
                  data-id={node.id}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: "block",
                    padding: "16px 28px",
                    borderBottom: "1px solid #1c1828",
                    borderLeft: `2px solid ${isHov ? col : "transparent"}`,
                    background: isHov ? "rgba(255,255,255,0.018)" : "transparent",
                    textDecoration: "none",
                    transition: "background 0.1s, border-left-color 0.1s",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    {/* Pressure bar */}
                    <div style={{
                      flexShrink: 0, width: 3, height: 44,
                      background: `rgba(${hexToRgb(col)}, 0.12)`,
                      borderRadius: 2, marginTop: 2, position: "relative", overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute", bottom: 0, width: "100%",
                        height: `${(score / 14) * 100}%`,
                        background: col, borderRadius: 2,
                        opacity: isHov ? 0.9 : 0.4, transition: "opacity 0.15s",
                      }} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ fontFamily: FM, fontSize: 10, color: col, letterSpacing: ".1em", textTransform: "uppercase" }}>
                          {DOMAIN_LABEL[node.domain] || node.domain}
                        </span>
                        <Pips score={score} color={col} />
                        <span style={{ fontFamily: FM, fontSize: 10, color: "#3a3460", marginLeft: "auto" }}>
                          {node.created}
                        </span>
                      </div>

                      <div style={{
                        fontFamily: FF, fontStyle: "italic", fontWeight: 300,
                        fontSize: 19, color: isHov ? "#e8e3f0" : "#c4bdd8",
                        lineHeight: 1.2, letterSpacing: "-.01em", marginBottom: 6,
                        transition: "color 0.15s",
                      }}>{cleanTitle(node.title)}</div>

                      <div style={{
                        fontFamily: FN, fontSize: 14, color: "#4a4468", lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>{node.excerpt}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
