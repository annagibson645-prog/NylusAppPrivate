import { readFileSync } from "fs";
import path from "path";
import Link from "next/link";
import type { VaultStats, GraphData } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  history: "Historical events, figures, and patterns across civilizations.",
  "eastern-spirituality": "Vedic, Tantric, Buddhist, and Taoist frameworks.",
  "african-spirituality": "Yoruba, Ifa, Kemetic, and diaspora traditions.",
  psychology: "Behavioral science, cognitive models, and mental frameworks.",
  "behavioral-mechanics": "Systems of habit, incentive, and behavioral change.",
  "cross-domain": "Concepts that span and connect multiple knowledge domains.",
  "creative-practice": "Writing, craft, output systems, and creative process.",
  "ai-collaboration": "Working with AI as a thinking and research partner.",
};

export default function DomainsPage() {
  const stats = loadJSON<VaultStats>("stats.json");
  const graph = loadJSON<GraphData>("graph.json");

  // Build a map of top concept title per domain (by backlink count)
  const topConceptByDomain = new Map<string, string>();
  const conceptsByDomain = new Map<string, typeof graph.nodes>();
  for (const node of graph.nodes) {
    if (node.type !== "concept" && node.type !== "hub") continue;
    if (!node.domain || node.domain === "unknown") continue;
    if (!conceptsByDomain.has(node.domain)) conceptsByDomain.set(node.domain, []);
    conceptsByDomain.get(node.domain)!.push(node);
  }
  for (const [domain, nodes] of conceptsByDomain) {
    const top = nodes.sort((a, b) => (b.backlinks?.length || 0) - (a.backlinks?.length || 0))[0];
    if (top) topConceptByDomain.set(domain, top.title);
  }

  const domains = Object.entries(stats.domains)
    .filter(([d]) => d !== "unknown")
    .sort(([, a], [, b]) => b.count - a.count);

  const totalConcepts = domains.reduce((sum, [, d]) => sum + d.count, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-16">

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Dashboard
          </Link>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Domains</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4" style={{ color: "var(--text)" }}>
          Domains
        </h1>
        <p className="text-base" style={{ color: "var(--text-muted)" }}>
          {domains.length} domains · {totalConcepts} concepts
        </p>
      </div>

      {/* Domain grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {domains.map(([domain, data]) => {
          const label = DOMAIN_LABELS[domain] || domain;
          const description = DOMAIN_DESCRIPTIONS[domain] || "";
          const pressure = data.collisions + data.sparks;

          return (
            <Link
              key={domain}
              href={`/domain/${domain}`}
              className="group block p-6 rounded-xl border hover:opacity-80 transition-opacity"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {/* Color bar */}
              <div
                className="w-8 h-1 rounded-full mb-4"
                style={{ background: data.color }}
              />

              <h2 className="text-lg font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                {label}
              </h2>

              {description && (
                <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>
                  {description}
                </p>
              )}

              {/* Top concept preview */}
              {topConceptByDomain.get(domain) && (
                <p className="text-xs mb-4 truncate" style={{ color: "var(--text-dim)" }}>
                  ↑ {topConceptByDomain.get(domain)}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-5 text-xs" style={{ color: "var(--text-dim)" }}>
                <span>
                  <span className="font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>{data.count}</span>
                  {" "}concepts
                </span>
                {data.collisions > 0 && (
                  <span>
                    <span className="font-medium tabular-nums" style={{ color: data.color }}>{data.collisions}</span>
                    {" "}collisions
                  </span>
                )}
                {data.sparks > 0 && (
                  <span>
                    <span className="font-medium tabular-nums" style={{ color: "#f472b6" }}>{data.sparks}</span>
                    {" "}sparks
                  </span>
                )}
                {pressure > 0 && (
                  <span className="ml-auto">
                    <span
                      className="inline-block w-12 h-0.5 rounded-full align-middle"
                      style={{ background: data.color, opacity: Math.min(pressure / 10, 1) * 0.8 + 0.2 }}
                    />
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
