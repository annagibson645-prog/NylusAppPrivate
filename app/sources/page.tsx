export const dynamic = 'force-dynamic';

import { readFileSync } from "fs";
import path from "path";
import Link from "next/link";
import type { VaultNode, GraphData } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/types";

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  "primary-text": "Primary Text",
  scholarly: "Scholarly",
  practitioner: "Practitioner",
  popular: "Popular",
  transcript: "Transcript",
  "personal-notes": "Personal Notes",
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  "primary-text": "#f59e0b",
  scholarly: "#3b82f6",
  practitioner: "#10b981",
  popular: "#8b5cf6",
  transcript: "#f97316",
  "personal-notes": "#64748b",
};

function extractAuthor(content: string): string {
  const m = content.match(/\*\*Author\*\*:\s*(.+)/);
  return m ? m[1].trim() : "";
}

function cleanTitle(title: string): string {
  return title.replace(/^SOURCE:\s*/i, "").trim();
}

export default function SourcesPage() {
  const graph = loadJSON<GraphData>("graph.json");

  const sources = graph.nodes
    .filter((n) => n.type === "source")
    .map((n) => ({ ...n, author: extractAuthor(n.content), cleanTitle: cleanTitle(n.title) }))
    .sort((a, b) => a.cleanTitle.localeCompare(b.cleanTitle));

  const byDomain = new Map<string, typeof sources>();
  for (const s of sources) {
    const d = s.domain === "unknown" ? "uncategorized" : s.domain;
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d)!.push(s);
  }

  const domainOrder = [
    "eastern-spirituality",
    "african-spirituality",
    "psychology",
    "behavioral-mechanics",
    "history",
    "creative-practice",
    "cross-domain",
    "ai-collaboration",
    "uncategorized",
  ].filter((d) => byDomain.has(d));

  return (
    <div className="px-5 sm:px-10 lg:px-16 py-10 sm:py-14 max-w-3xl mx-auto w-full">

      {/* Header */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>
            Dashboard
          </Link>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Sources</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4" style={{ color: "var(--text)" }}>
          Sources
        </h1>
        <p className="text-base" style={{ color: "var(--text-muted)" }}>
          {sources.length} ingested sources across {byDomain.size} domains
        </p>
      </div>

      {/* Grouped by domain */}
      {domainOrder.map((domain) => {
        const domainSources = byDomain.get(domain)!;
        const label = domain === "uncategorized" ? "Uncategorized" : (DOMAIN_LABELS[domain] || domain);

        return (
          <section key={domain} className="mb-14">
            <div className="flex items-baseline gap-3 mb-5">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{label}</h2>
              <span className="text-sm tabular-nums" style={{ color: "var(--text-dim)" }}>{domainSources.length}</span>
            </div>
            <div className="border-t" style={{ borderColor: "var(--border)" }}>
              {domainSources.map((s) => (
                <Link
                  key={s.id}
                  href={`/source/${s.id}`}
                  className="flex items-start gap-4 py-4 sm:py-5 border-b hover:opacity-70 transition-opacity group"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-medium leading-snug mb-1" style={{ color: "var(--text)" }}>
                      {s.cleanTitle}
                    </div>
                    {s.author && (
                      <div className="text-sm" style={{ color: "var(--text-muted)" }}>{s.author}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
                    {s.classification && (
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          color: CLASSIFICATION_COLORS[s.classification] || "var(--text-dim)",
                          background: (CLASSIFICATION_COLORS[s.classification] || "#6b7280") + "18",
                        }}
                      >
                        {CLASSIFICATION_LABELS[s.classification] || s.classification}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
