export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), 'public/data', file), 'utf-8'));
}

const DOMAIN_FULL: Record<string, string> = {
  history: 'History',
  'eastern-spirituality': 'Eastern Spirituality',
  psychology: 'Psychology',
  'behavioral-mechanics': 'Behavioral Mechanics',
  'cross-domain': 'Cross-Domain',
  'creative-practice': 'Creative Practice',
  'african-spirituality': 'African Spirituality',
  'ai-collaboration': 'AI Collaboration',
  unknown: 'Other',
};

const DOMAIN_DESC: Record<string, string> = {
  history: 'Civilizations, decisions, and the patterns that recur across centuries.',
  'eastern-spirituality': 'Consciousness, practice, and the maps drawn by those who went inward.',
  psychology: 'What happens inside a person — how the self forms, defends, and breaks.',
  'behavioral-mechanics': 'Influence architecture, compliance engineering, and the tactics of power.',
  'cross-domain': 'Concepts that cannot be understood through one domain alone.',
  'creative-practice': 'Making things, the conditions that make making possible, and the blocks that don\'t.',
  'african-spirituality': 'Cosmological systems, ancestral knowledge, and living traditions.',
  'ai-collaboration': 'Working with machine intelligence as a thinking partner.',
  unknown: 'Uncategorized concepts.',
};

const DOMAIN_COLORS: Record<string, string> = {
  psychology: '#f59e6f',
  history: '#e6c068',
  'behavioral-mechanics': '#a78bfa',
  'eastern-spirituality': '#7c8df0',
  'cross-domain': '#5fc9a8',
  'creative-practice': '#ef5a6f',
  'ai-collaboration': '#9ca3af',
  'african-spirituality': '#34d399',
};

export default async function DomainPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safeName = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  let nodes: any[] = [];
  try {
    nodes = loadJSON<any[]>(`domain-${safeName}.json`);
  } catch {
    notFound();
  }

  // Load hubs for this domain from hubs.json
  let domainHubs: any[] = [];
  try {
    const allHubs = loadJSON<any[]>('hubs.json');
    domainHubs = allHubs
      .filter((h: any) => h.domain === name)
      .sort((a: any, b: any) => (b.covers ?? 0) - (a.covers ?? 0));
  } catch { /* hubs not available yet */ }

  const domainColor = DOMAIN_COLORS[name] ?? '#a78bfa';
  const label = DOMAIN_FULL[name] ?? name;
  const description = DOMAIN_DESC[name] ?? '';

  const concepts = nodes.filter((n) => n.type === 'concept' || n.type === 'thread');
  const stableCount = concepts.filter((n) => n.status === 'stable').length;

  // Ungrouped concepts — not in any hub
  const groupedIds = new Set(domainHubs.flatMap((h: any) => h.concepts ?? []));
  const ungrouped = concepts
    .filter((n) => !groupedIds.has(n.id))
    .sort((a, b) => new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime())
    .slice(0, 12);

  return (
    <div className="void-page" style={{ '--domain-color': domainColor } as React.CSSProperties}>
      <div className="void-ambient" />

      <nav className="void-nav">
        <Link href="/" className="void-nav-back">← constellation</Link>
      </nav>

      <div className="void-content">
        <div className="void-domain-chip">{label}</div>
        <h1 className="void-title">{label}</h1>

        {description && (
          <div className="void-lede">{description}</div>
        )}

        <div className="void-meta-inline">
          <span>{concepts.length} concepts</span>
          <span className="void-meta-dot">·</span>
          <span>{stableCount} stable</span>
          <span className="void-meta-dot">·</span>
          <span>{domainHubs.length} {domainHubs.length === 1 ? 'hub' : 'hubs'}</span>
        </div>

        <div className="void-ornament">✦</div>

        {/* Hubs — primary navigation */}
        {domainHubs.length > 0 ? (
          <>
            <div className="void-section-label">hubs — start here</div>
            <div className="void-hub-grid">
              {domainHubs.map((hub: any) => (
                <Link
                  key={hub.id}
                  href={`/hub/${hub.id}`}
                  className="void-hub-card"
                >
                  <div className="void-hub-card-accent" />
                  <div className="void-hub-card-inner">
                    <div className="void-hub-card-count">
                      {hub.covers} concepts
                    </div>
                    <h2 className="void-hub-card-title">
                      {hub.title.replace(/ Hub$/, '').replace(/ — Map of Content$/, '')}
                    </h2>
                    {hub.excerpt && (
                      <p className="void-hub-card-excerpt">{hub.excerpt.slice(0, 140)}{hub.excerpt.length > 140 ? '…' : ''}</p>
                    )}
                    <div className="void-hub-card-arrow">enter →</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="void-section-label">no hubs yet</div>
        )}

        {/* Ungrouped concepts */}
        {ungrouped.length > 0 && (
          <>
            <div className="void-section-label" style={{ marginTop: 48 }}>ungrouped concepts</div>
            <div className="void-compact-list">
              {ungrouped.map((n: any) => (
                <Link key={n.id} href={`/concept/${n.id}`} className="void-compact-item">
                  <span className="void-compact-status">{n.status}</span>
                  <span className="void-compact-title">{n.title}</span>
                  <span className="void-compact-arrow">→</span>
                </Link>
              ))}
            </div>
            <Link href={`/domain/${name}/all`} className="void-browse-all" style={{ marginTop: 24, display: 'inline-block' }}>
              browse all {concepts.length} concepts →
            </Link>
          </>
        )}

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
            <span className="void-meta-k">hubs</span>
            <span className="void-meta-v">{domainHubs.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
