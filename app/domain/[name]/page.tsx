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
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="text-xs hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>Dashboard</Link>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span className="text-xs" style={{ color: domainColor }}>{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: domainColor }} />
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>{label}</h1>
        </div>
        <p className="text-sm mt-1.5 ml-5" style={{ color: "var(--text-muted)" }}>
          {conceptNodes.length} concepts · {hubPages.length} hubs
        </p>
      </div>

      {/* Hub pages */}
      {hubPages.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Hubs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hubPages.map((hub) => (
              <Link
                key={hub.id}
                href={`/concept/${hub.id}`}
                className="group p-4 rounded-lg border hover:opacity-80 transition-opacity"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {hub.title.replace(/ Hub$/, "")}
                  </span>
                  <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-dim)" }}>{hub.links.length}</span>
                </div>
                {hub.excerpt && (
                  <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{hub.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hubbed concept groups */}
      {Array.from(hubs.entries()).map(([hubId, members]) => (
        <section key={hubId} className="mb-8">
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              {hubId.replace(/-hub$/, "").replace(/-/g, " ")}
            </h2>
            <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>{members.length}</span>
          </div>
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {members.map((n) => <ConceptRow key={n.id} node={n} href={typeRoute(n)} />)}
          </div>
        </section>
      ))}

      {/* Loose concepts */}
      {loose.length > 0 && (
        <section>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Ungrouped</h2>
            <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>{loose.length}</span>
          </div>
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            {loose.map((n) => <ConceptRow key={n.id} node={n} href={typeRoute(n)} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ConceptRow({ node: n, href }: { node: VaultNode; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 py-3 border-b hover:opacity-70 transition-opacity"
      style={{ borderColor: "var(--border)" }}
    >
      <span
        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: STATUS_COLORS[n.status] || "#6b7280" }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ color: "var(--text)" }}>{n.title}</div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 text-[11px]" style={{ color: "var(--text-dim)" }}>
        {n.sources > 0 && <span>{n.sources} src</span>}
        <span className="capitalize">{n.status}</span>
      </div>
    </Link>
  );
}
