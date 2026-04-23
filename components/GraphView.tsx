"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { VaultNode, GraphData } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

interface NodePos {
  node: VaultNode;
  x: number;
  y: number;
}

const W = 800;
const H = 600;
const R = 220;

function layoutNodes(nodes: VaultNode[]): NodePos[] {
  const byDomain = new Map<string, VaultNode[]>();
  for (const n of nodes) {
    if (!byDomain.has(n.domain)) byDomain.set(n.domain, []);
    byDomain.get(n.domain)!.push(n);
  }

  const result: NodePos[] = [];
  let globalIdx = 0;
  const total = nodes.length;

  for (const [, domainNodes] of byDomain) {
    for (const node of domainNodes) {
      const angle = (globalIdx / total) * 2 * Math.PI - Math.PI / 2;
      const r = R + (node.type === "hub" ? 0 : 40);
      result.push({
        node,
        x: W / 2 + r * Math.cos(angle),
        y: H / 2 + r * Math.sin(angle),
      });
      globalIdx++;
    }
  }
  return result;
}

export default function GraphView() {
  const router = useRouter();
  const [data, setData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<VaultNode | null>(null);
  const [filter, setFilter] = useState<"hub" | "all">("hub");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/data/graph.json")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-sm" style={{ color: "var(--text-muted)" }}>
        Loading graph…
      </div>
    );
  }

  const visibleNodes = data.nodes.filter((n) => {
    const typeOk = filter === "hub" ? n.type === "hub" : ["concept", "hub"].includes(n.type);
    const searchOk = !search || n.title.toLowerCase().includes(search.toLowerCase());
    return typeOk && searchOk;
  });

  const nodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = data.edges.filter(
    (e) => nodeIds.has(e.source as string) && nodeIds.has(e.target as string)
  );

  const positions = layoutNodes(visibleNodes);
  const posMap = new Map(positions.map((p) => [p.node.id, p]));

  const typeRoute = (n: VaultNode) => {
    if (n.type === "spark") return `/spark/${n.id}`;
    if (n.type === "collision") return `/collision/${n.id}`;
    return `/concept/${n.id}`;
  };

  const nodeRadius = (n: VaultNode) =>
    n.type === "hub" ? 14 : Math.max(4, 4 + (n.sources || 0) * 0.8);

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden relative w-full">
      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden absolute top-3 left-3 z-20 px-2.5 py-1.5 rounded text-xs border"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        onClick={() => setSidebarOpen((o) => !o)}
      >
        {sidebarOpen ? "✕ Close" : "⚙ Filter"}
      </button>

      {/* Sidebar — hidden on mobile unless toggled */}
      <div
        className={`
          absolute md:relative z-10 top-0 left-0 h-full
          w-52 flex-shrink-0 border-r px-3 py-4 space-y-4 overflow-y-auto
          transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="pt-8 md:pt-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Highlight nodes…"
            className="w-full text-xs px-2.5 py-1.5 rounded border bg-transparent outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>View</h3>
          <div className="space-y-1">
            {(["hub", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs py-0.5 w-full text-left transition-opacity"
                style={{ color: filter === f ? "var(--text)" : "var(--text-muted)", opacity: filter === f ? 1 : 0.6 }}
              >
                {f === "hub" ? `Hubs only (${data.nodes.filter((n) => n.type === "hub").length})` : `Hubs + concepts (${data.nodes.filter((n) => ["hub","concept"].includes(n.type)).length})`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Domains</h3>
          <div className="space-y-1.5">
            {Object.entries(DOMAIN_LABELS)
              .filter(([d]) => d !== "unknown")
              .map(([domain, label]) => {
                const count = data.nodes.filter((n) => n.domain === domain && n.type === "hub").length;
                if (count === 0) return null;
                const color = data.nodes.find((n) => n.domain === domain)?.color || "#6b7280";
                return (
                  <div key={domain} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span>{label}</span>
                    <span className="ml-auto" style={{ color: "var(--text-dim)" }}>{count}</span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="text-[10px] space-y-1 pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
          <div>Click — select node</div>
          <div>Double-click — open page</div>
          <div>{visibleNodes.length} nodes · {visibleEdges.length} edges</div>
        </div>
      </div>

      {/* Tap outside overlay to close mobile sidebar */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-[5]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SVG Graph */}
      <div className="flex-1 relative overflow-hidden" style={{ background: "var(--bg)" }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          <g opacity="0.3">
            {visibleEdges.slice(0, 300).map((e, i) => {
              const src = posMap.get(e.source as string);
              const tgt = posMap.get(e.target as string);
              if (!src || !tgt) return null;
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y}
                  x2={tgt.x} y2={tgt.y}
                  stroke="var(--edge-color)"
                  strokeWidth="0.8"
                />
              );
            })}
          </g>

          {positions.map(({ node: n, x, y }) => {
            const r = nodeRadius(n);
            const isSelected = selectedNode?.id === n.id;
            const isHighlighted = search && n.title.toLowerCase().includes(search.toLowerCase());
            const isDimmed = search && !isHighlighted;

            return (
              <g
                key={n.id}
                transform={`translate(${x},${y})`}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedNode(n === selectedNode ? null : n)}
                onDoubleClick={() => router.push(typeRoute(n))}
                opacity={isDimmed ? 0.15 : 1}
              >
                <circle
                  r={r}
                  fill={n.color || "#6b7280"}
                  fillOpacity={isSelected ? 1 : 0.75}
                  stroke={isSelected ? "white" : isHighlighted ? "#fff" : "transparent"}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
                {(n.type === "hub" || isHighlighted) && (
                  <text
                    y={r + 11}
                    textAnchor="middle"
                    fontSize={n.type === "hub" ? "9" : "7"}
                    fill={isSelected ? "white" : "#94a3b8"}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {n.title.replace(/ Hub$/, "").slice(0, 28)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected node panel — bottom sheet on mobile, right sidebar on desktop */}
      {selectedNode && (
        <>
          {/* Mobile: bottom sheet */}
          <div
            className="md:hidden absolute bottom-0 left-0 right-0 z-20 rounded-t-xl border-t px-4 py-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedNode.color }} />
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{selectedNode.type}</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>
            <h3 className="text-sm font-semibold mb-1 leading-snug" style={{ color: "var(--text)" }}>
              {selectedNode.title}
            </h3>
            <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--text-muted)" }}>{selectedNode.excerpt}</p>
            <button
              onClick={() => router.push(typeRoute(selectedNode))}
              className="w-full text-xs py-2 rounded border hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Open full page →
            </button>
          </div>

          {/* Desktop: right sidebar */}
          <div
            className="hidden md:block w-60 flex-shrink-0 border-l px-4 py-4 overflow-y-auto"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs mb-3 block hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              ✕ close
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedNode.color }} />
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{selectedNode.type}</span>
            </div>
            <h3 className="text-sm font-semibold mb-2 leading-snug" style={{ color: "var(--text)" }}>
              {selectedNode.title}
            </h3>
            <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>{selectedNode.excerpt}</p>
            <div className="space-y-1 text-[10px] mb-4" style={{ color: "var(--text-dim)" }}>
              <div>Domain: {DOMAIN_LABELS[selectedNode.domain] || selectedNode.domain}</div>
              <div>Status: {selectedNode.status}</div>
              <div>Sources: {selectedNode.sources}</div>
              <div>Links in: {selectedNode.backlinks.length}</div>
              <div>Age: {selectedNode.age_days}d</div>
            </div>
            <button
              onClick={() => router.push(typeRoute(selectedNode))}
              className="w-full text-xs py-2 rounded border hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Open full page →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
