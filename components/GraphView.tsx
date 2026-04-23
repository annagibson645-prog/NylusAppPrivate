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

function treemap(items: { id: string; value: number }[], x: number, y: number, w: number, h: number) {
  if (items.length === 0) return [];
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
      layout(a, x, y, w * ratio, h);
      layout(b, x + w * ratio, y, w * (1 - ratio), h);
    } else {
      layout(a, x, y, w, h * ratio);
      layout(b, x, y + h * ratio, w, h * (1 - ratio));
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
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
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

  const NAV_H = 48;
  const GAP = 4;
  const SIDEBAR_W = 240;
  const canvasW = dims.w - SIDEBAR_W;
  const canvasH = dims.h - NAV_H;

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

  const activeBlock = activeDomain ? blocks.find((b) => b.domain === activeDomain) : null;
  const activeNodes = activeBlock
    ? [...activeBlock.nodes].sort((a, b) => (b.backlinks?.length || 0) - (a.backlinks?.length || 0))
    : [];

  return (
    <div className="flex overflow-hidden" style={{ height: `calc(100vh - ${NAV_H}px)`, background: "var(--bg)" }}>

      {/* Treemap canvas */}
      <div className="relative overflow-hidden flex-1">
        <svg width={canvasW} height={canvasH} style={{ display: "block" }}>
          <defs>
            {blocks.map((b) => (
              <linearGradient key={`grad-${b.domain}`} id={`grad-${b.domain}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={b.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={b.color} stopOpacity="0.08" />
              </linearGradient>
            ))}
          </defs>

          {blocks.map((b) => {
            const isActive = activeDomain === b.domain;
            const isHovered = hoveredDomain === b.domain;
            const isDimmed = activeDomain && !isActive;
            const labelSize = Math.min(18, Math.max(11, Math.sqrt(b.w * b.h) / 12));
            const topConcepts = b.nodes
              .sort((a, c) => (c.backlinks?.length || 0) - (a.backlinks?.length || 0))
              .slice(0, 4)
              .map((n) => n.title);

            return (
              <g key={b.domain}>
                {/* Background fill */}
                <rect
                  x={b.x} y={b.y} width={b.w} height={b.h}
                  rx={8}
                  fill={`url(#grad-${b.domain})`}
                  fillOpacity={isDimmed ? 0.4 : 1}
                  stroke={b.color}
                  strokeOpacity={isDimmed ? 0.1 : isActive ? 0.85 : isHovered ? 0.5 : 0.2}
                  strokeWidth={isActive ? 1.5 : 1}
                  style={{ cursor: "pointer", transition: "stroke-opacity 0.15s, fill-opacity 0.15s" }}
                  onClick={() => {
                    setActiveDomain(isActive ? null : b.domain);
                    setSelected(null);
                  }}
                  onMouseEnter={() => setHoveredDomain(b.domain)}
                  onMouseLeave={() => setHoveredDomain(null)}
                />

                {/* Content — only render if block is big enough */}
                {b.w > 80 && b.h > 50 && !isDimmed && (
                  <g style={{ pointerEvents: "none" }}>
                    {/* Domain label */}
                    <text
                      x={b.x + 14} y={b.y + 22}
                      fontSize={labelSize}
                      fontWeight="700"
                      fill={b.color}
                      fillOpacity={0.95}
                      style={{ userSelect: "none" }}
                    >
                      {b.label}
                    </text>

                    {/* Count badge */}
                    {b.h > 44 && (
                      <text
                        x={b.x + 14} y={b.y + 22 + labelSize + 6}
                        fontSize={Math.min(11, labelSize * 0.75)}
                        fill={b.color}
                        fillOpacity={0.45}
                        style={{ userSelect: "none" }}
                      >
                        {b.count} concepts
                      </text>
                    )}

                    {/* Top concept previews */}
                    {b.h > 100 && b.w > 120 && topConcepts.map((title, i) => {
                      const maxChars = Math.floor(b.w / 7);
                      const truncated = title.length > maxChars ? title.slice(0, maxChars - 1) + "…" : title;
                      const yOff = b.y + 22 + labelSize + 24 + i * 16;
                      if (yOff + 12 > b.y + b.h - 10) return null;
                      return (
                        <text
                          key={i}
                          x={b.x + 14} y={yOff}
                          fontSize={10}
                          fill={b.color}
                          fillOpacity={0.55}
                          style={{ userSelect: "none" }}
                        >
                          {truncated}
                        </text>
                      );
                    })}
                  </g>
                )}

                {/* Tiny block: just a dot indicator */}
                {(b.w <= 80 || b.h <= 50) && !isDimmed && (
                  <circle
                    cx={b.x + b.w / 2} cy={b.y + b.h / 2} r={3}
                    fill={b.color} fillOpacity={0.6}
                    style={{ pointerEvents: "none" }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Right sidebar */}
      <div
        className="flex-shrink-0 flex flex-col overflow-hidden border-l"
        style={{ width: SIDEBAR_W, borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {selected ? (
          /* Concept detail panel */
          <div className="px-5 py-6 flex flex-col flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selected.color }} />
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
        ) : activeBlock ? (
          /* Domain concept list */
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: activeBlock.color }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{activeBlock.label}</span>
                </div>
                <button
                  onClick={() => { setActiveDomain(null); setSelected(null); }}
                  className="text-[10px] hover:opacity-70"
                  style={{ color: "var(--text-dim)" }}
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-dim)" }}>{activeBlock.count} concepts</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              {activeNodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelected(n)}
                  className="w-full text-left text-xs leading-snug py-1.5 hover:opacity-70 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                >
                  {n.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Default: domain overview list */
          <div className="px-5 py-6 space-y-5 overflow-y-auto flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
              Knowledge Map
            </p>
            <div className="space-y-2">
              {blocks.map((b) => (
                <button
                  key={b.domain}
                  onClick={() => setActiveDomain(b.domain)}
                  className="w-full text-left flex items-center gap-2.5 py-1 hover:opacity-70 transition-opacity"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                  <span className="text-xs flex-1 min-w-0 truncate" style={{ color: "var(--text-muted)" }}>{b.label}</span>
                  <span className="text-xs tabular-nums flex-shrink-0" style={{ color: "var(--text-dim)" }}>{b.count}</span>
                </button>
              ))}
            </div>
            <div className="pt-4 border-t text-[10px] space-y-1" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
              <div>Click a domain to explore</div>
              <div>Click a concept to inspect</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
