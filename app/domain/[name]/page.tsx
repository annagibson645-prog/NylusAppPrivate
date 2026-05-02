import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { VaultNode, IndexSection } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";
import DomainBrowser from "@/components/DomainBrowser";

export const dynamic = 'force-dynamic';

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

function loadJSONSafe<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
  } catch {
    return fallback;
  }
}

const KNOWN_DOMAINS = [
  "history", "eastern-spirituality", "psychology", "behavioral-mechanics",
  "cross-domain", "creative-practice", "african-spirituality", "ai-collaboration",
];


export default async function DomainPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safeName = name.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

  let nodes: VaultNode[] = [];
  try {
    nodes = loadJSON<VaultNode[]>(`domain-${safeName}.json`);
  } catch {
    notFound();
  }

  const indexSections = loadJSONSafe<IndexSection[]>(`domain-index-${safeName}.json`, []);

  const label = DOMAIN_LABELS[name] || name;
  const domainColor = nodes[0]?.color || "#6b7280";
  const hubPages = nodes.filter((n) => n.type === "hub");
  const conceptCount = nodes.filter((n) => n.type === "concept" || n.type === "thread").length;

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-10 py-10 sm:py-14 w-full">

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/domains" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Domains
          </Link>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span className="text-sm font-medium" style={{ color: domainColor }}>{label}</span>
        </div>

        <div className="border-l-4 pl-5 py-1" style={{ borderColor: domainColor }}>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2" style={{ color: "var(--text)" }}>
            {label}
          </h1>
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            {conceptCount} concepts · {hubPages.length} {hubPages.length === 1 ? "hub" : "hubs"}
          </p>
        </div>
      </div>

      <DomainBrowser nodes={nodes} hubPages={hubPages} domainColor={domainColor} indexSections={indexSections} />
    </div>
  );
}
