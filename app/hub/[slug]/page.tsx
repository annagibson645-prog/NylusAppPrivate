export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { domainColor } from '@/lib/adapt-vault';
import ThemeToggle from '@/components/ThemeToggle';

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), 'public/data', file), 'utf-8'));
}

const DOMAIN_FULL: Record<string, string> = {
  psychology: 'Psychology',
  history: 'History',
  'behavioral-mechanics': 'Behavioral Mechanics',
  'eastern-spirituality': 'Eastern Spirituality',
  'cross-domain': 'Cross-Domain',
  'creative-practice': 'Creative Practice',
  'ai-collaboration': 'AI Collaboration',
  'african-spirituality': 'African Spirituality',
};

// Meta-sections — not concept groupings, skip them
const SKIP_SECTIONS = new Set([
  'what this hub covers',
  'how to navigate this hub',
  'key tensions',
  'key tensions in this area',
  'cross-domain connections',
  'cross-domain connection',
  'related hubs',
  'structural notes',
  'overview',
  'convergence points',
  'source node',
  'sources',
]);

const LEVEL_ORDER: Record<string, number> = {
  foundational: 0,
  intermediate:  1,
  advanced:      2,
  thematic:      3,
};

const LEVEL_BADGE: Record<string, string> = {
  foundational: 'Foundational',
  intermediate:  'Intermediate',
  advanced:      'Advanced',
  thematic:      '',
};

// Colors match the void palette — muted so they feel native
const LEVEL_COLOR: Record<string, string> = {
  foundational: '#6bab8a',   // sage green
  intermediate:  '#c8a460',  // warm amber
  advanced:      '#9f7ec0',  // muted violet
  thematic:      '#4a4468',  // dim slate
};

interface HubSection {
  title: string;
  label: string;
  level: 'foundational' | 'intermediate' | 'advanced' | 'thematic';
  conceptIds: string[];
}

function parseHubSections(content: string, validIds: Set<string>): HubSection[] {
  if (!content) return [];
  const sections: HubSection[] = [];
  let current: HubSection | null = null;
  const seen = new Set<string>();

  for (const line of content.split('\n')) {
    if (/^## /.test(line)) {
      const raw = line.replace(/^## /, '').trim();
      const lower = raw.toLowerCase().replace(/[🗺️🔗🛠️]/gu, '').trim();
      if (SKIP_SECTIONS.has(lower)) { current = null; continue; }

      let level: HubSection['level'] = 'thematic';
      if (/beginner/i.test(raw))      level = 'foundational';
      else if (/intermediate/i.test(raw)) level = 'intermediate';
      else if (/advanced/i.test(raw)) level = 'advanced';

      const label = raw
        .replace(/[🗺️🔗🛠️]/gu, '')
        .replace(/^(BEGINNER LEVEL|INTERMEDIATE LEVEL|ADVANCED LEVEL)[:\s—\-]*/i, '')
        .trim();

      current = { title: raw, label: label || raw, level, conceptIds: [] };
      sections.push(current);
      continue;
    }

    if (!current) continue;
    const wikiRe = /\[\[ARCHIVES\/concepts\/[^/]+\/([^|\]]+)[|\]]/g;
    let m: RegExpExecArray | null;
    while ((m = wikiRe.exec(line)) !== null) {
      const id = m[1].trim();
      if (validIds.has(id) && !seen.has(id)) {
        current.conceptIds.push(id);
        seen.add(id);
      }
    }
  }

  // Sort: foundational first, then intermediate, advanced, thematic
  return sections
    .filter(s => s.conceptIds.length > 0)
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

function routeForType(type: string, id: string) {
  if (type === 'source')    return `/source/${id}`;
  if (type === 'spark')     return `/spark/${id}`;
  if (type === 'collision') return `/collision/${id}`;
  return `/concept/${id}`;
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hubs  = loadJSON<any[]>('hubs.json');
  const graph = loadJSON<{ nodes: any[] }>('graph.json');

  const hub = hubs.find((h: any) => h.id === slug);
  if (!hub) notFound();

  const color = domainColor(hub.domain);
  const label = DOMAIN_FULL[hub.domain] ?? hub.domain;
  const nodeMap = new Map(graph.nodes.map((n: any) => [n.id, n]));

  // All concept nodes
  const conceptIds = new Set<string>(hub.concepts ?? []);
  const allConceptNodes = graph.nodes.filter(
    (n: any) => n.type === 'concept' && conceptIds.has(n.id)
  );
  const conceptNodeMap = new Map(allConceptNodes.map((n: any) => [n.id, n]));

  // Parse & order sections
  const sections = parseHubSections(hub.content ?? '', conceptIds);
  const placedIds = new Set(sections.flatMap(s => s.conceptIds));
  const unplaced = allConceptNodes
    .filter((n: any) => !placedIds.has(n.id))
    .sort((a: any, b: any) => (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0));

  // Sidebar data
  const sourceSet = new Map<string, any>();
  for (const c of allConceptNodes) {
    for (const lid of (c.links ?? [])) {
      const n = nodeMap.get(lid);
      if (n?.type === 'source') sourceSet.set(n.id, n);
    }
  }
  const sources = Array.from(sourceSet.values()).slice(0, 12);

  const backlinkSet = new Map<string, any>();
  for (const c of allConceptNodes) {
    for (const bid of (c.backlinks ?? [])) {
      if (!conceptIds.has(bid)) {
        const n = nodeMap.get(bid);
        if (n && ['concept','collision','spark'].includes(n.type)) backlinkSet.set(n.id, n);
      }
    }
  }
  const backlinks = Array.from(backlinkSet.values()).slice(0, 12);

  const internalSet = new Map<string, any>();
  for (const c of allConceptNodes) {
    for (const lid of (c.links ?? [])) {
      if (conceptIds.has(lid) && lid !== c.id) {
        const n = nodeMap.get(lid);
        if (n) internalSet.set(n.id, n);
      }
    }
  }
  const internalLinks = Array.from(internalSet.values()).slice(0, 12);

  const hubTitle = hub.title.replace(/ — Map of Content$/, '').replace(/ Hub$/, '');
  const hasLevels = sections.some(s => s.level !== 'thematic');

  return (
    <div className="void-page" style={{ '--domain-color': color } as React.CSSProperties}>
      <div className="void-ambient" />

      <nav className="void-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" className="void-nav-back">← constellation</Link>
          <span style={{ color: '#2a2535' }}>·</span>
          <Link href={`/domain/${hub.domain}`} className="void-nav-back">{label}</Link>
        </div>
        <ThemeToggle />
      </nav>

      <div className="hub-outer">

        {/* ── SIDEBAR ── */}
        <aside className="hub-sidebar">

          {hasLevels && (
            <div className="sb-section">
              <div className="sb-label">Levels</div>
              {sections.map(s => (
                <a
                  key={s.title}
                  href={`#sec-${encodeURIComponent(s.title)}`}
                  className="sb-item sb-level-link"
                  style={{ '--lc': LEVEL_COLOR[s.level] } as React.CSSProperties}
                >
                  <span className="sb-level-dot" />
                  {LEVEL_BADGE[s.level] || s.label}
                  <span className="sb-level-n">{s.conceptIds.length}</span>
                </a>
              ))}
            </div>
          )}

          {sources.length > 0 && (
            <div className="sb-section">
              <div className="sb-label">Sources</div>
              {sources.map((s: any) => (
                <Link key={s.id} href={`/source/${s.id}`} className="sb-item">
                  {(s.title ?? s.id).replace(/^SOURCE:\s*/i, '').slice(0, 46)}
                  {(s.title ?? '').replace(/^SOURCE:\s*/i, '').length > 46 ? '…' : ''}
                </Link>
              ))}
            </div>
          )}

          {internalLinks.length > 0 && (
            <div className="sb-section">
              <div className="sb-label">Internal links</div>
              {internalLinks.map((n: any) => (
                <Link key={n.id} href={routeForType(n.type, n.id)} className="sb-item">
                  {(n.title ?? n.id).slice(0, 46)}{(n.title?.length ?? 0) > 46 ? '…' : ''}
                </Link>
              ))}
            </div>
          )}

          {backlinks.length > 0 && (
            <div className="sb-section">
              <div className="sb-label">Backlinks</div>
              {backlinks.map((n: any) => (
                <Link key={n.id} href={routeForType(n.type, n.id)} className="sb-item">
                  {(n.title ?? n.id).slice(0, 46)}{(n.title?.length ?? 0) > 46 ? '…' : ''}
                </Link>
              ))}
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <main className="hub-main">

          <div className="hub-domain-chip">{label}</div>
          <h1 className="hub-title">{hubTitle}</h1>
          {hub.excerpt && <div className="hub-lede">{hub.excerpt}</div>}

          {/* Ornament */}
          <div className="void-ornament" style={{ margin: '48px 0 56px' }}>
            <div className="void-ornament-line" />
            <span className="void-ornament-glyph">✦</span>
            <div className="void-ornament-line" />
          </div>

          {/* Collapsible sections */}
          <div className="hub-sections">
            {sections.map((sec, si) => {
              const nodes = sec.conceptIds
                .map(id => conceptNodeMap.get(id))
                .filter(Boolean) as any[];
              const lc = LEVEL_COLOR[sec.level];
              const badge = LEVEL_BADGE[sec.level];
              // First foundational section open by default, rest closed
              const defaultOpen = si === 0;

              return (
                <details
                  key={sec.title}
                  id={`sec-${encodeURIComponent(sec.title)}`}
                  className="hub-details"
                  open={defaultOpen}
                >
                  <summary className="hub-summary" style={{ '--lc': lc } as React.CSSProperties}>
                    <span className="hub-summary-inner">
                      {badge && (
                        <span className="hub-level-badge" style={{ color: lc, borderColor: lc }}>
                          {badge}
                        </span>
                      )}
                      <span className="hub-section-title">{sec.label}</span>
                      <span className="hub-section-count" style={{ color: lc }}>{nodes.length}</span>
                    </span>
                    <span className="hub-chevron">▼</span>
                  </summary>

                  <div className="hub-section-body">
                    {nodes.map((n: any) => (
                      <Link key={n.id} href={`/concept/${n.id}`} className="hub-concept-row">
                        <div className="hcr-left">
                          <div className="hcr-title">{n.title}</div>
                          {n.excerpt && (
                            <div className="hcr-excerpt">
                              {n.excerpt.slice(0, 160)}{n.excerpt.length > 160 ? '…' : ''}
                            </div>
                          )}
                        </div>
                        <div className="hcr-right">
                          {n.sources > 0 && (
                            <span className="hcr-meta">{n.sources} src</span>
                          )}
                          {(n.backlinks?.length ?? 0) > 0 && (
                            <span className="hcr-meta">{n.backlinks.length} ↩</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </details>
              );
            })}

            {unplaced.length > 0 && (
              <details className="hub-details">
                <summary className="hub-summary" style={{ '--lc': '#3a3450' } as React.CSSProperties}>
                  <span className="hub-summary-inner">
                    <span className="hub-section-title" style={{ color: '#3a3450' }}>Other</span>
                    <span className="hub-section-count" style={{ color: '#3a3450' }}>{unplaced.length}</span>
                  </span>
                  <span className="hub-chevron">▼</span>
                </summary>
                <div className="hub-section-body">
                  {unplaced.map((n: any) => (
                    <Link key={n.id} href={`/concept/${n.id}`} className="hub-concept-row">
                      <div className="hcr-left">
                        <div className="hcr-title">{n.title}</div>
                        {n.excerpt && (
                          <div className="hcr-excerpt">
                            {n.excerpt.slice(0, 160)}{n.excerpt.length > 160 ? '…' : ''}
                          </div>
                        )}
                      </div>
                      <div className="hcr-right">
                        {n.sources > 0 && <span className="hcr-meta">{n.sources} src</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </div>

          <div style={{ marginTop: 72 }}>
            <Link href={`/domain/${hub.domain}`} className="void-nav-back">
              ← All {label} hubs
            </Link>
          </div>

        </main>
      </div>

      <style>{`
        /* ── Layout ── */
        .hub-outer {
          display: flex;
          gap: 72px;
          align-items: flex-start;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 56px 160px;
          position: relative;
          z-index: 2;
        }

        /* ── Sidebar ── */
        .hub-sidebar {
          width: 180px;
          flex-shrink: 0;
          position: sticky;
          top: 48px;
          max-height: calc(100vh - 96px);
          overflow-y: auto;
          scrollbar-width: none;
        }
        .hub-sidebar::-webkit-scrollbar { display: none; }
        .sb-section { margin-bottom: 40px; }
        .sb-label {
          font-family: var(--font-jetbrains), monospace;
          font-size: 9px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #2e2a3e;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid #16141f;
        }
        .sb-item {
          display: block;
          font-family: var(--font-jetbrains), monospace;
          font-size: 11px;
          color: #3a3450;
          text-decoration: none;
          padding: 6px 0;
          line-height: 1.5;
          border-bottom: 1px solid #0f0e1a;
          transition: color 0.15s;
        }
        .sb-item:last-child { border-bottom: none; }
        .sb-item:hover { color: var(--domain-color, #a78bfa); }
        .sb-level-link {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--lc, #4a4468);
        }
        .sb-level-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--lc, #4a4468);
          flex-shrink: 0;
          opacity: 0.6;
        }
        .sb-level-n {
          margin-left: auto;
          color: #2a2535;
          font-size: 10px;
        }

        /* ── Header ── */
        .hub-main { flex: 1; min-width: 0; }
        .hub-domain-chip {
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--domain-color, #a78bfa);
          margin-bottom: 20px;
          opacity: 0.75;
        }
        .hub-title {
          font-family: var(--font-fraunces), serif;
          font-size: clamp(42px, 5.5vw, 80px);
          font-weight: 900;
          font-style: italic;
          line-height: 1.0;
          letter-spacing: -0.02em;
          color: #ddd8ea;
          margin-bottom: 28px;
          font-optical-sizing: auto;
        }
        .hub-lede {
          font-family: var(--font-newsreader), serif;
          font-size: 20px;
          line-height: 1.75;
          color: #7a7090;
          font-weight: 300;
          font-style: italic;
          border-left: 2px solid var(--domain-color, #a78bfa);
          padding-left: 22px;
          margin-bottom: 0;
          max-width: 580px;
          font-optical-sizing: auto;
        }

        /* ── Ornament (reuse global class) ── */
        .void-ornament { display: flex; align-items: center; gap: 16px; }
        .void-ornament-line { flex: 1; height: 1px; background: #1c1828; }
        .void-ornament-glyph {
          font-family: var(--font-fraunces), serif;
          font-size: 18px;
          color: var(--domain-color, #a78bfa);
          opacity: 0.25;
          font-style: italic;
        }

        /* ── Collapsible sections ── */
        .hub-sections { display: flex; flex-direction: column; gap: 0; }

        .hub-details {
          border-bottom: 1px solid #16141f;
        }
        .hub-details:first-child {
          border-top: 1px solid #1c1828;
        }

        .hub-summary {
          list-style: none;
          cursor: pointer;
          padding: 28px 0;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: opacity 0.15s;
        }
        .hub-summary::-webkit-details-marker { display: none; }
        .hub-summary:hover { opacity: 0.8; }

        .hub-summary-inner {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }

        .hub-level-badge {
          font-family: var(--font-jetbrains), monospace;
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          border: 1px solid;
          border-radius: 2px;
          padding: 3px 9px;
          flex-shrink: 0;
          opacity: 0.75;
        }

        .hub-section-title {
          font-family: var(--font-jetbrains), monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #4a4468;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hub-section-count {
          font-family: var(--font-jetbrains), monospace;
          font-size: 11px;
          opacity: 0.5;
          flex-shrink: 0;
        }

        .hub-chevron {
          font-size: 9px;
          color: #2e2a3e;
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        details[open] > .hub-summary .hub-chevron {
          transform: rotate(180deg);
        }

        /* ── Concept rows ── */
        .hub-section-body {
          padding-bottom: 24px;
        }

        .hub-concept-row {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          padding: 22px 20px;
          margin: 0 -20px;
          text-decoration: none;
          border-bottom: 1px solid #0f0e1a;
          transition: background 0.15s;
        }
        .hub-concept-row:last-child { border-bottom: none; }
        .hub-concept-row:hover { background: rgba(255,255,255,0.02); }

        .hcr-left { flex: 1; min-width: 0; }

        .hcr-title {
          font-family: var(--font-fraunces), serif;
          font-size: 24px;
          font-style: italic;
          color: #b0a8c8;
          line-height: 1.25;
          margin-bottom: 10px;
          transition: color 0.15s;
          font-optical-sizing: auto;
        }
        .hub-concept-row:hover .hcr-title { color: #d8d0e8; }

        .hcr-excerpt {
          font-family: var(--font-newsreader), serif;
          font-size: 14px;
          line-height: 1.7;
          color: #3a3050;
          font-weight: 300;
          font-optical-sizing: auto;
        }

        .hcr-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          padding-top: 4px;
          flex-shrink: 0;
        }
        .hcr-meta {
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px;
          color: #2e2a3e;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .hub-concept-row:hover .hcr-meta { color: #5a5080; }

        /* ── Responsive ── */
        @media (max-width: 820px) {
          .hub-outer { flex-direction: column; padding: 0 24px 100px; gap: 48px; }
          .hub-sidebar { position: static; width: 100%; max-height: none; }
          .hub-concept-row { margin: 0 -12px; padding-left: 12px; padding-right: 12px; }
        }
      `}</style>
    </div>
  );
}
