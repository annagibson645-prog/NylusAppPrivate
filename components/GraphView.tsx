"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { VaultNode, GraphData } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

interface DomainBlock {
  domain: string;
  label: string;
  color: string;
  count: number;
  nodes: VaultNode[];
  x: number;
  y: number;
  w: number;
  h: number;
}

function typeRoute(n: VaultNode) {
  if (n.type === "spark") return `/spark/${n.id}`;
  if (n.type === "collision") return `/collision/${n.id}`;
  if (n.type === "source") return `/source/${n.id}`;
  return `/concept/${n.id}`;
}

// Squarified treemap layout
function treemap(items: { id: string; value: number }[], x: number, y: number, w: number, h: number) {
  if (items.length === 0) return [];
  const total = items.reduce((s, i) => s + i.value, 0);
  const results: { id: string; x: number; y: number; w: number; h: number }[] = [];

  function layout(items: { id: string; value: number }[], x: number, y: number, w: number, h: number) {
    if (items.length === 0) return;
    if (items.length === 1) {
      results.push({ id: items[0].id, x, y, w, h });
      return;
    }
    const half = items.reduce((s, i) => s + i.value, 0) / 2;
    let sum = 0;
    let splitIdx = 0;
    for (let i = 0; i < items.length; i++) {
      sum += items[i].value;
      if (sum >= half) { splitIdx = i + 1; break; }
    }
    const a = items.slice(0, splitIdx);
    const b = items.slice(splitIdx);
    const aSum = a.reduce((s, i) => s + i.value, 0);
    const ratio = aSum / (aSum + b.reduce((s, i) => s + i.value, 0));
    if (w >= h) {
      const splitX = x + w * ratio;
      layout(a, x, y, w * ratio, h);
      layout(b, splitX, y, w * (1 - ratio), h);
    } else {
      const splitY = y + h * ratio;
      layout(a, x, y, w, h * ratio);
      layout(b, x, splitY, w, h * (1 - ratio));
    }
  }

  layout(items, x, y, w, h);
  return results;
}

export default function GraphView() {
  const router = useRouter();
  const [data, setData] = useState<GraphData | null>(null);
  const [selected, setSelected] = useState<VaultNode | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [drillDomain, setDrillDomain] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    fetch("/data/graph.json").then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    function measure() {
      setDims({ w: window.innerWidth, h: window.innerHeight });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (!data || dims.w === 0) return (
    <div className="flex items-center justify-center h-[calc(100vh-3rem)] text-sm" style={{ color: "var(--text-muted)" }}>
      Loading…
    </div>
  );

  const GAP = 3;
  const SIDEBAR_W = 220;
  const canvasW = dims.w - SIDEBAR_W;
  const canvasH = dims.h - 48;

  // Build domain blocks
  const domainMap = new Map<string, VaultNode[]>();
  for (const n of data.nodes) {
    if (n.type === "source" || !n.domain || n.domain === "unknown") continue;
    if (!domainMap.has(n.domain)) domainMap.set(n.domain, []);
    domainMap.get(n.domain)!.push(n);
  }

  const domainItems = [...domainMap.entries()]
    .map(([d, nodes]) => ({ id: d, value: nodes.length }))
    .sort((a, b) => b.value - a.value);

  const layout = treemap(domainItems, GAP, GAP, canvasW - GAP * 2, canvasH - GAP * 2);

  const blocks: DomainBlock[] = layout.map((cell) => {
    const nodes = domainMap.get(cell.id) || [];
    const color = nodes[0]?.color || "#6b7280";
    return {
      domain: cell.id,
      label: DOMAIN_LABELS[cell.id] || cell.id,
      color,
      count: nodes.length,
      nodes,
      x: cell.x,
      y: cell.y,
      w: cell.w - GAP,
      h: cell.h - GAP,
    };
  });

  // Drill-down: show concept nodes within a domain
  const drillBlock = drillDomain ? blocks.find((b) => b.domain === drillDomain) : null;
  const drillNodes = drillBlock ? [...drillBlock.nodes].sort((a, b) => (b.backlinks?.length || 0) - (a.backlinks?.length || 0)) : [];

  // Mini treemap for drilled domain
  const conceptCells = drillBlock
    ? treemap(
        drillNodes.map((n) => ({ id: n.id, value: Math.max(1, (n.backlinks?.length || 0) + 1) })),
        drillBlock.x + GAP,
        drillBlock.y + 36,
        drillBlock.w - GAP * 2,
        drillBlock.h - 42
      )
    : [];
  const conceptCellMap = new Map(conceptCells.map((c) => [c.id, c]));

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* Treemap canvas */}
      <div className="flex-1 relative overflow-hidden">
        <svg width={canvasW} height={canvasH} style={{ display: "block" }}>
          {blocks.map((b) => {
            const isDrilled = drillDomain === b.domain;
            const isHovered = hoveredDomain === b.domain;
            const isDimmed = drillDomain && !isDrilled;

            return (
              <g key={b.domain}>
                {/* Domain block */}
                <rect
                  x={b.x} y={b.y} width={b.w} height={b.h}
                  rx={6}
                  fill={b.color}
                  fillOpacity={isDimmed ? 0.08 : isDrilled ? 0.25 : isHovered ? 0.2 : 0.12}
                  stroke={b.color}
                  strokeOpacity={isDimmed ? 0.15 : isDrilled ? 0.9 : isHovered ? 0.7 : 0.35}
                  strokeWidth={isDrilled ? 2 : 1}
                  style={{ cursor: "pointer", transition: "fill-opacity 0.15s, stroke-opacity 0.15s" }}
                  onClick={() => setDrillDomain(isDrilled ? null : b.domain)}
                  onMouseEnter={() => setHoveredDomain(b.domain)}
                  onMouseLeave={() => setHoveredDomain(null)}
                />

                {/* Domain label */}
                {b.w > 60 && b.h > 30 && !isDimmed && (
                  <>
                    <text
                      x={b.x + 12} y={b.y + 20}
                      fontSize={Math.min(14, Math.max(10, b.w / 10))}
                      fontWeight="600"
                      fill={b.color}
                      fillOpacity={0.95}
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {b.label}
                    </text>
                    {b.h > 44 && (
                      <text
                        x={b.x + 12} y={b.y + 36}
                        fontSize={10}
                        fill={b.color}
                        fillOpacity={0.6}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {b.count} concepts
                      </text>
                    )}
                  </>
                )}

                {/* Concept nodes inside drilled domain */}
                {isDrilled && conceptCells.map((cell) => {
                  const node = drillNodes.find((n) => n.id === cell.id);
                  if (!node) return null;
                  const cw = cell.w - GAP;
                  const ch = cell.h - GAP;
                  const isSelected = selected?.id === node.id;
                  if (cw < 4 || ch < 4) return null;
                  return (
                    <g key={node.id}>
                      <rect
                        x={cell.x} y={cell.y} width={cw} height={ch}
                        rx={4}
                        fill={b.color}
                        fillOpacity={isSelected ? 0.45 : 0.18}
                        stroke={b.color}
                        strokeOpacity={isSelected ? 1 : 0.4}
                        strokeWidth={isSelected ? 1.5 : 0.5}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : node); }}
                      />
                      {cw > 40 && ch > 18 && (
                        <text
                          x={cell.x + 6} y={cell.y + 13}
                          fontSize={Math.min(11, Math.max(8, cw / 8))}
                          fill={b.color}
                          fillOpacity={0.9}
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          {node.title.slice(0, Math.floor(cw / 6))}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Click-outside to close drill */}
        {drillDomain && (
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={() => { setDrillDomain(null); setSelected(null); }}
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              ← All domains
            </button>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div
        className="w-56 flex-shrink-0 border-l flex flex-col overflow-y-auto"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {selected ? (
          <div className="px-5 py-6 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: selected.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
                  {selected.type}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs hover:opacity-70" style={{ color: "var(--text-dim)" }}>✕</button>
            </div>
            <h3 className="text-sm font-semibold mb-2 leading-snug" style={{ color: "var(--text)" }}>{selected.title}</h3>
            {selected.excerpt && (
              <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>{selected.excerpt}</p>
            )}
            <div className="space-y-2 text-xs mb-6" style={{ color: "var(--text-dim)" }}>
              {[
                ["Status", selected.status],
                ...(selected.sources > 0 ? [["Sources", String(selected.sources)]] : []),
                ["Backlinks", String(selected.backlinks?.length || 0)],
                ["Age", `${selected.age_days}d`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="capitalize" style={{ color: "var(--text-muted)" }}>{v}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push(typeRoute(selected))}
              className="mt-auto w-full text-sm py-2.5 rounded-lg border font-medium hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface-2)" }}
            >
              Open →
            </button>
          </div>
        ) : (
          <div className="px-5 py-6 space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-dim)" }}>
                {drillDomain ? (DOMAIN_LABELS[drillDomain] || drillDomain) : "Knowledge Map"}
              </p>
              {drillDomain ? (
                <div className="space-y-2">
                  {drillNodes.slice(0, 20).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelected(n)}
                      className="w-full text-left text-xs leading-snug hover:opacity-70 transition-opacity"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {n.title}
                    </button>
                  ))}
                  {drillNodes.length > 20 && (
                    <p className="text-[10px]" style={{ color: "var(--text-dim)" }}>+{drillNodes.length - 20} more</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.map((b) => (
                    <button
                      key={b.domain}
                      onClick={() => setDrillDomain(b.domain)}
                      className="w-full text-left flex items-center gap-2.5 hover:opacity-70 transition-opacity"
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                      <span className="text-xs flex-1 min-w-0 truncate" style={{ color: "var(--text-muted)" }}>{b.label}</span>
                      <span className="text-xs tabular-nums flex-shrink-0" style={{ color: "var(--text-dim)" }}>{b.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t text-[10px] space-y-1" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
              <div>Click domain to drill in</div>
              <div>Click concept to inspect</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
