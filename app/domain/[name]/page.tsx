import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { VaultNode } from "@/lib/types";

export const dynamic = 'force-dynamic';

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public/data", file), "utf-8"));
}

const DOMAIN_FULL: Record<string, string> = {
  history: "History",
  "eastern-spirituality": "Eastern Spirituality",
  psychology: "Psychology",
  "behavioral-mechanics": "Behavioral Mechanics",
  "cross-domain": "Cross-Domain",
  "creative-practice": "Creative Practice",
  "african-spirituality": "African Spirituality",
  "ai-collaboration": "AI Collaboration",
  unknown: "Other",
};

const DOMAIN_DESC: Record<string, string> = {
  history: "Civilizations, decisions, and the patterns that recur across centuries.",
  "eastern-spirituality": "Consciousness, practice, and the maps drawn by those who went inward.",
  psychology: "What happens inside a person — how the self forms, defends, and breaks.",
  "behavioral-mechanics": "Influence architecture, compliance engineering, and the tactics of power.",
  "cross-domain": "Concepts that cannot be understood through one domain alone.",
  "creative-practice": "Making things, the conditions that make making possible, and the blocks that don't.",
  "african-spirituality": "Cosmological systems, ancestral knowledge, and living traditions.",
  "ai-collaboration": "Working with machine intelligence as a thinking partner.",
  unknown: "Uncategorized concepts.",
};

export default async function DomainPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safeName = name.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

  let nodes: VaultNode[] = [];
  try {
    nodes = loadJSON<VaultNode[]>(`domain-${safeName}.json`);
  } catch {
    notFound();
  }

  const domainColor = nodes[0]?.color || "#a78bfa";
  const label = DOMAIN_FULL[name] || name;
  const description = DOMAIN_DESC[name] || "";

  const hubPages = nodes.filter((n) => n.type === "hub");
  const concepts = nodes.filter((n) => n.type === "concept" || n.type === "thread");
  const stableCount = concepts.filter((n) => n.status === "stable").length;

  return (
    <div className="void-page" style={{ '--domain-color': domainColor } as React.CSSProperties}>
      <div className="void-ambient" />

      {/* Nav */}
      <nav className="void-nav">
        <Link href="/" className="void-nav-brand">lotusmind</Link>
        <div className="void-nav-right">
          <Link href="/" className="void-nav-back">← galaxy</Link>
        </div>
      </nav>

      <div className="void-content">

        {/* Domain chip */}
        <div className="void-domain-chip" style={{ color: domainColor }}>
          {label}
        </div>

        {/* Title */}
        <h1 className="void-title" style={{ fontStyle: 'italic' }}>{label}</h1>

        {/* Description lede */}
        {description && (
          <div className="void-lede" style={{ borderLeftColor: domainColor }}>
            {description}
          </div>
        )}

        {/* Stats */}
        <div className="void-meta-inline" style={{ marginBottom: '64px' }}>
          <span className="void-meta-type">{concepts.length} concepts</span>
          <span className="void-meta-dot">·</span>
          <span className="void-meta-type">{stableCount} stable</span>
          <span className="void-meta-dot">·</span>
          <span className="void-meta-type">{hubPages.length} {hubPages.length === 1 ? 'hub' : 'hubs'}</span>
        </div>

        {/* Ornament */}
        <div className="void-ornament">
          <div className="void-ornament-line" />
          <span className="void-ornament-glyph">✦</span>
          <div className="void-ornament-line" />
        </div>

        {/* Hubs — primary navigation */}
        {hubPages.length > 0 ? (
          <>
            <div className="void-section-label">hubs — start here</div>
            <div className="void-hub-grid">
              {hubPages.map((hub) => (
                <Link
                  key={hub.id}
                  href={`/concept/${hub.id}`}
                  className="void-hub-card"
                  style={{ '--hub-color': domainColor } as React.CSSProperties}
                >
                  <div className="void-hub-card-accent" style={{ background: domainColor }} />
                  <div className="void-hub-card-inner">
                    <div className="void-hub-card-count" style={{ color: domainColor }}>
                      {hub.links.length || '—'} concepts
                    </div>
                    <h2 className="void-hub-card-title">
                      {hub.title.replace(/ Hub$/, '').replace(/ — Map of Content$/, '')}
                    </h2>
                    {hub.excerpt && (
                      <p className="void-hub-card-excerpt">{hub.excerpt}</p>
                    )}
                    <div className="void-hub-card-arrow" style={{ color: domainColor }}>
                      enter →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="void-section-label">no hubs yet — browse concepts below</div>
        )}

        {/* Browse all link */}
        <div className="void-browse-all-row">
          <Link href={`/domain/${name}/all`} className="void-browse-all">
            browse all {concepts.length} concepts in {label}
          </Link>
          <div className="void-ornament-line" style={{ flex: 1 }} />
        </div>

        {/* Recent / stable concepts — compact list */}
        {concepts.length > 0 && (
          <>
            <div className="void-section-label" style={{ marginTop: '20px' }}>recently updated</div>
            <div className="void-compact-list">
              {[...concepts]
                .sort((a, b) => new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime())
                .slice(0, 8)
                .map((n) => (
                  <Link key={n.id} href={`/concept/${n.id}`} className="void-compact-item">
                    <span className="void-compact-status" style={{ color: n.color }}>
                      {n.status}
                    </span>
                    <span className="void-compact-title">{n.title}</span>
                    <span className="void-compact-arrow">→</span>
                  </Link>
                ))}
            </div>
          </>
        )}

        {/* Meta strip */}
        <div className="void-meta-strip">
          <div className="void-meta-item">
            <span className="void-meta-k">domain</span>
            <span className="void-meta-v">{label}</span>
          </div>
          <div className="void-meta-item">
            <span className="void-meta-k">concepts</span>
            <span className="void-meta-v">{concepts.length}</span>
          </div>
          <div className="void-meta-item">
            <span className="void-meta-k">stable</span>
            <span className="void-meta-v">{stableCount}</span>
          </div>
          <div className="void-meta-item">
            <span className="void-meta-k">hubs</span>
            <span className="void-meta-v">{hubPages.length}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
