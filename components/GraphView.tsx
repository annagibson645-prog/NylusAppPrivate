"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { VaultNode, GraphData } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

type FilterMode = "hubs" | "concepts" | "all";

function typeRoute(n: VaultNode) {
  if (n.type === "spark") return `/spark/${n.id}`;
  if (n.type === "collision") return `/collision/${n.id}`;
  if (n.type === "source") return `/source/${n.id}`;
  return `/concept/${n.id}`;
}

function nodeRadius(n: any): number {
  if (n.type === "hub") return 10;
  return Math.max(3, 2 + (n.backlinks?.length || 0) * 0.6);
}

export default function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const router = useRouter();

  const [data, setData] = useState<GraphData | null>(null);
  const [selected, setSelected] = useState<VaultNode | null>(null);
  const [filter, setFilter] = useState<FilterMode>("concepts");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [nodeCount, setNodeCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/data/graph.json").then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (!data) return;

    let cancelled = false;

    // Small delay so the container has real pixel dimensions after layout
    const timer = setTimeout(() => {
      const el = containerRef.current;
      if (!el || cancelled) return;

      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;

      import("force-graph").then((mod: any) => {
        if (cancelled || !containerRef.current) return;

        const FG = mod.default ?? mod;

        // Tear down previous instance
        el.innerHTML = "";
        graphRef.current = null;

        const searchLower = search.toLowerCase();

        const visibleNodes = data.nodes.filter((n) => {
          const typeOk =
            filter === "hubs" ? n.type === "hub" :
            filter === "concepts" ? ["hub", "concept", "thread"].includes(n.type) :
            n.type !== "source";
          const domainOk = !domainFilter || n.domain === domainFilter;
          return typeOk && domainOk;
        });

        const nodeSet = new Set(visibleNodes.map((n) => n.id));
        const links = data.edges
          .filter((e) => nodeSet.has(e.source as string) && nodeSet.has(e.target as string))
          .map((e) => ({ source: e.source, target: e.target }));

        setNodeCount(visibleNodes.length);

        const graph = new FG(el);
        graph
          .graphData({ nodes: visibleNodes.map((n) => ({ ...n })), links })
          .nodeId("id")
          .nodeLabel("title")
          .nodeColor((n: any) => n.color || "#6b7280")
          .nodeVal((n: any) => nodeRadius(n) ** 2)
          .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            if (!isFinite(node.x) || !isFinite(node.y)) return;
            const r = nodeRadius(node);
            const isHub = node.type === "hub";
            const matched = searchLower && node.title.toLowerCase().includes(searchLower);
            const dimmed = !!searchLower && !matched;

            ctx.globalAlpha = dimmed ? 0.08 : 1;

            // Glow for hubs
            if (isHub) {
              const grad = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, r * 3.5);
              grad.addColorStop(0, (node.color || "#7c6af7") + "55");
              grad.addColorStop(1, "transparent");
              ctx.beginPath();
              ctx.arc(node.x, node.y, r * 3.5, 0, 2 * Math.PI);
              ctx.fillStyle = grad;
              ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = node.color || "#6b7280";
            ctx.fill();

            // Label
            if (isHub || matched || globalScale > 3) {
              const label = (node.title || "")
                .replace(/ Hub$/, "")
                .replace(/ — Map of Content$/, "")
                .slice(0, 28);
              const fontSize = Math.max(isHub ? 10 : 8, (isHub ? 12 : 9) / globalScale);
              ctx.font = `${isHub ? "600 " : ""}${fontSize}px ui-sans-serif,system-ui,sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = isHub ? "#ffffff" : "#94a3b8";
              ctx.globalAlpha = dimmed ? 0.08 : isHub ? 0.95 : 0.65;
              ctx.fillText(label, node.x, node.y + r + 2 / globalScale);
            }

            ctx.globalAlpha = 1;
          })
          .nodePointerAreaPaint((node: any, color: string, ctx: CanvasRenderingContext2D) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius(node) + 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          })
          .linkColor(() => "#ffffff10")
          .linkWidth(0.5)
          .backgroundColor("transparent")
          .width(w)
          .height(h)
          .cooldownTicks(150)
          .d3AlphaDecay(0.02)
          .d3VelocityDecay(0.3)
          .onEngineStop(() => {
            graph.zoomToFit(500, 60);
          })
          .onNodeClick((node: any) => {
            setSelected((prev) => prev?.id === node.id ? null : node as VaultNode);
          });

        // Stronger repulsion to spread nodes out
        const charge = graph.d3Force("charge");
        if (charge && typeof charge.strength === "function") {
          charge.strength(-120);
        }

        graphRef.current = graph;
      });
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (containerRef.current) containerRef.current.innerHTML = "";
      graphRef.current = null;
    };
  }, [data, filter, domainFilter, search]);

  // Keep canvas sized to container on window resize
  useEffect(() => {
    const handleResize = () => {
      const el = containerRef.current;
      if (graphRef.current && el) {
        graphRef.current.width(el.clientWidth).height(el.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const domains = data
    ? [...new Set(data.nodes.filter((n) => n.domain && n.domain !== "unknown").map((n) => n.domain))]
        .map((d) => ({ id: d, color: data.nodes.find((n) => n.domain === d)?.color || "#6b7280" }))
    : [];

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden relative w-full">

      {/* Mobile toggle */}
      <button
        className="md:hidden absolute top-3 left-3 z-20 px-2.5 py-1.5 rounded text-xs border"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        onClick={() => setSidebarOpen((o) => !o)}
      >
        {sidebarOpen ? "✕" : "⚙ Filter"}
      </button>

      {/* Sidebar */}
      <div
        className={`absolute md:relative z-10 top-0 left-0 h-full w-56 flex-shrink-0 border-r px-4 py-6 space-y-6 overflow-y-auto transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="pt-8 md:pt-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full text-xs px-3 py-2 rounded border bg-transparent outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Show</p>
          <div className="space-y-1.5">
            {([
              { id: "hubs", label: "Hubs only" },
              { id: "concepts", label: "Hubs + concepts" },
              { id: "all", label: "Everything" },
            ] as const).map(({ id, label }) => (
              <button key={id} onClick={() => setFilter(id)} className="w-full text-left text-sm py-0.5"
                style={{ color: filter === id ? "var(--text)" : "var(--text-muted)", fontWeight: filter === id ? 600 : 400 }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Domain</p>
          <div className="space-y-2">
            <button onClick={() => setDomainFilter(null)} className="w-full text-left text-sm"
              style={{ color: !domainFilter ? "var(--text)" : "var(--text-muted)", fontWeight: !domainFilter ? 600 : 400 }}>
              All domains
            </button>
            {domains.map(({ id, color }) => (
              <button key={id} onClick={() => setDomainFilter(domainFilter === id ? null : id)}
                className="w-full text-left text-sm flex items-center gap-2"
                style={{ color: domainFilter === id ? "var(--text)" : "var(--text-muted)", fontWeight: domainFilter === id ? 600 : 400 }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                {DOMAIN_LABELS[id] || id}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] space-y-1.5 pt-4 border-t" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
          <div>{nodeCount} nodes</div>
          <div className="pt-1">Scroll to zoom</div>
          <div>Drag to pan</div>
          <div>Click node to inspect</div>
        </div>
      </div>

      {sidebarOpen && <div className="md:hidden fixed inset-0 z-[5]" onClick={() => setSidebarOpen(false)} />}

      {/* Graph canvas */}
      <div ref={containerRef} className="flex-1 relative" style={{ background: "var(--bg)" }} />

      {/* Inspect panel */}
      {selected && (
        <>
          {/* Mobile bottom sheet */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 rounded-t-2xl border-t px-5 py-5"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: selected.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>{selected.type}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "var(--text-dim)" }}>✕</button>
            </div>
            <h3 className="text-base font-semibold mb-1 leading-snug" style={{ color: "var(--text)" }}>{selected.title}</h3>
            {selected.excerpt && <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: "var(--text-muted)" }}>{selected.excerpt}</p>}
            <button onClick={() => router.push(typeRoute(selected))}
              className="w-full text-sm py-2.5 rounded-lg border font-medium"
              style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface-2)" }}>
              Open →
            </button>
          </div>

          {/* Desktop panel */}
          <div className="hidden md:flex flex-col w-64 flex-shrink-0 border-l overflow-y-auto"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-5 py-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: selected.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>{selected.type}</span>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs hover:opacity-70" style={{ color: "var(--text-dim)" }}>✕</button>
              </div>
              <h3 className="text-base font-semibold mb-2 leading-snug" style={{ color: "var(--text)" }}>{selected.title}</h3>
              {selected.excerpt && <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>{selected.excerpt}</p>}
              <div className="space-y-2 text-xs mb-6" style={{ color: "var(--text-dim)" }}>
                {[
                  ["Domain", DOMAIN_LABELS[selected.domain] || selected.domain],
                  ["Status", selected.status],
                  ...(selected.sources > 0 ? [["Sources", String(selected.sources)]] : []),
                  ["Backlinks", String(selected.backlinks.length)],
                  ["Age", `${selected.age_days}d`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className="capitalize" style={{ color: "var(--text-muted)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-6">
              <button onClick={() => router.push(typeRoute(selected))}
                className="w-full text-sm py-2.5 rounded-lg border font-medium hover:opacity-80 transition-opacity"
                style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface-2)" }}>
                Open full page →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
