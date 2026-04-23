import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { VaultNode } from "@/lib/types";
import { DOMAIN_LABELS, STATUS_COLORS } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

const KNOWN_DOMAINS = [
  "history", "eastern-spirituality", "psychology", "behavioral-mechanics",
  "cross-domain", "creative-practice", "african-spirituality", "ai-collaboration",
];

export async function generateStaticParams() {
  return KNOWN_DOMAINS.map((name) => ({ name }));
}

function groupByHub(nodes: VaultNode[]) {
  const hubs = new Map<string, VaultNode[]>();
  const loose: VaultNode[] = [];
  for (const n of nodes) {
    if (n.type === "hub") continue;
    if (n.hub) {
      if (!hubs.has(n.hub)) hubs.set(n.hub, []);
      hubs.get(n.hub)!.push(n);
    } else {
      loose.push(n);
    }
  }
  return { hubs, loose };
}

export default async function DomainPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safeName = name.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  let nodes: VaultNode[] = [];
  try {
    nodes = loadJSON<VaultNode[]>(`domain-${safeName}.json`);
  } catch {
    notFound();
  }

  const label = DOMAIN_LABELS[name] || name;
  const domainNode = nodes[0];
  const domainColor = domainNode?.color || "#6b7280";
  const hubPages = nodes.filter((n) => n.type === "hub");
  const conceptNodes = nodes.filter((n) => n.type === "concept" || n.type === "thread");
  const { hubs, loose } = groupByHub(conceptNodes);

  const typeRoute = (n: VaultNode) => {
    if (n.type === "spark") return `/spark/${n.id}`;
    if (n.type === "collision") return `/collision/${n.id}`;
    if (n.type === "source") return `/source/${n.id}`;
    return `/concept/${n.id}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-14 w-full">

      {/* Header */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/domains" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Domains
          </Link>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span className="text-sm font-medium" style={{ color: domainColor }}>{label}</span>
        </div>

        <div
          className="border-l-4 pl-5 py-1"
          style={{ borderColor: domainColor }}
        >
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2" style={{ color: "var(--text)" }}>
            {label}
          </h1>
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            {conceptNodes.length} concepts · {hubPages.length} {hubPages.length === 1 ? "hub" : "hubs"}
          </p>
        </div>
      </div>

      {/* Hub pages */}
      {hubPages.length > 0 && (
        <section className="mb-14">
          <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--text)" }}>Hubs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hubPages.map((hub) => (
              <Link
                key={hub.id}
                href={`/concept/${hub.id}`}
                className="group block p-5 sm:p-6 rounded-xl border hover:opacity-80 transition-opacity"
                style={{ background: "var(--surface)", borderColor: "var(--border)", borderLeftColor: domainColor, borderLeftWidth: "3px" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-base font-semibold leading-snug" style={{ color: "var(--text)" }}>
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

      {/* Hubbed concept groups */}
      {Array.from(hubs.entries()).map(([hubId, members]) => (
        <section key={hubId} className="mb-12">
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-base font-semibold capitalize" style={{ color: "var(--text)" }}>
              {hubId.replace(/-hub$/, "").replace(/-/g, " ")}
            </h2>
            <span className="text-sm tabular-nums" style={{ color: "var(--text-dim)" }}>{members.length}</span>
          </div>
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {members.map((n) => <ConceptRow key={n.id} node={n} href={typeRoute(n)} domainColor={domainColor} />)}
          </div>
        </section>
      ))}

      {/* Loose concepts */}
      {loose.length > 0 && (
        <section className="mb-12">
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Ungrouped</h2>
            <span className="text-sm tabular-nums" style={{ color: "var(--text-dim)" }}>{loose.length}</span>
          </div>
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {loose.map((n) => <ConceptRow key={n.id} node={n} href={typeRoute(n)} domainColor={domainColor} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ConceptRow({ node: n, href, domainColor }: { node: VaultNode; href: string; domainColor: string }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 py-4 sm:py-5 border-b hover:opacity-70 transition-opacity"
      style={{ borderColor: "var(--border)" }}
    >
      <span
        className="mt-2 w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: STATUS_COLORS[n.status] || "#6b7280" }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm sm:text-base leading-snug" style={{ color: "var(--text)" }}>
          {n.title}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
        {n.sources > 0 && (
          <span className="text-xs tabular-nums" style={{ color: "var(--text-dim)" }}>
            {n.sources} {n.sources === 1 ? "src" : "src"}
          </span>
        )}
        <span
          className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full capitalize"
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
