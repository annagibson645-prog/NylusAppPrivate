export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { domainColor } from '@/lib/adapt-vault';
import ThemeToggle from '@/components/ThemeToggle';
import HubSearch from '@/components/HubSearch';

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

const LEVEL_COLOR: Record<string, string> = {
  foundational: '#6bab8a',
  intermediate:  '#c8a460',
  advanced:      '#9f7ec0',
  thematic:      '#4a4468',
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

/* ─── Sri Yantra background ──────────────────────────────────── */
function HubYantra({ color }: { color: string }) {
  const cx = 200, cy = 200;
  const up = (r: number) => {
    const h = +(r * 0.866).toFixed(2);
    return `${cx},${cy - r} ${cx - h},${+(cy + r * 0.5).toFixed(2)} ${cx + h},${+(cy + r * 0.5).toFixed(2)}`;
  };
  const dn = (r: number) => {
    const h = +(r * 0.866).toFixed(2);
    return `${cx},${cy + r} ${cx - h},${+(cy - r * 0.5).toFixed(2)} ${cx + h},${+(cy - r * 0.5).toFixed(2)}`;
  };
  const upR = [140, 108, 80, 52];
  const dnR = [134, 102, 74, 46, 22];

  return (
    <svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(680px,90vw)',
        height: 'min(680px,90vw)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        <filter id="hyg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      {/* glow layer */}
      <g filter="url(#hyg)" opacity="0.22">
        {upR.map(r => <polygon key={`ug${r}`} points={up(r)} fill="none" stroke={color} strokeWidth="1.2" />)}
        {dnR.map(r => <polygon key={`dg${r}`} points={dn(r)} fill="none" stroke={color} strokeWidth="1.2" />)}
        <circle cx={cx} cy={cy} r="156" fill="none" stroke={color} strokeWidth="1.2" />
        <circle cx={cx} cy={cy} r="116" fill="none" stroke={color} strokeWidth="0.8" />
      </g>
      {/* crisp layer */}
      <g opacity="0.065">
        {upR.map(r => <polygon key={`uc${r}`} points={up(r)} fill="none" stroke={color} strokeWidth="0.55" />)}
        {dnR.map(r => <polygon key={`dc${r}`} points={dn(r)} fill="none" stroke={color} strokeWidth="0.55" />)}
        <circle cx={cx} cy={cy} r="156" fill="none" stroke={color} strokeWidth="0.55" />
        <circle cx={cx} cy={cy} r="116" fill="none" stroke={color} strokeWidth="0.4" />
        <circle cx={cx} cy={cy} r="16" fill="none" stroke={color} strokeWidth="0.55" />
        <circle cx={cx} cy={cy} r="4" fill={color} opacity="0.5" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────── */

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hubs  = loadJSON<any[]>('hubs.json');
  const graph = loadJSON<{ nodes: any[] }>('graph.json');

  const hub = hubs.find((h: any) => h.id === slug);
  if (!hub) notFound();

  const color = domainColor(hub.domain);
  const label = DOMAIN_FULL[hub.domain] ?? hub.domain;
  const nodeMap = new Map(graph.nodes.map((n: any) => [n.id, n]));

  const conceptIds = new Set<string>(hub.concepts ?? []);
  const allConceptNodes = graph.nodes.filter(
    (n: any) => n.type === 'concept' && conceptIds.has(n.id)
  );
  const conceptNodeMap = new Map(allConceptNodes.map((n: any) => [n.id, n]));

  const sections = parseHubSections(hub.content ?? '', conceptIds);
  const placedIds = new Set(sections.flatMap(s => s.conceptIds));
  const unplaced = allConceptNodes
    .filter((n: any) => !placedIds.has(n.id))
    .sort((a: any, b: any) => (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0));

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

      {/* ── Sri Yantra background ── */}
      <HubYantra color={color} />

      {/* ── Domain colour wash ── */}
      <div className="hub-domain-wash" />

      {/* ── Top stripe ── */}
      <div className="hub-top-stripe" />

      {/* Right-side nav */}
      <aside className="void-right-nav hub-right-nav">
        <div className="vrn-toggle"><ThemeToggle /></div>
        <Link href="/" className="vrn-brand">NylusS</Link>
        <div className="vrn-sep" />
        <Link href="/" className="vrn-link">← constellation</Link>
        <Link href={`/domain/${hub.domain}`} className="vrn-link">← {label}</Link>
        {hub.path && (
          <a href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(hub.path)}`} className="vrn-link">
            obsidian ↗
          </a>
        )}
        <div className="vrn-sep" />
        <Link href="/collisions" className="vrn-link">collisions →</Link>
        <Link href="/sparks" className="vrn-link">sparks →</Link>
      </aside>

      <div className="hub-outer">

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
                  {(s.title ?? '').replace(/^SOURCE:\s*/i, '').length > 46 ? '...' : ''}
                </Link>
              ))}
            </div>
          )}

          {internalLinks.length > 0 && (
            <div className="sb-section">
              <div className="sb-label">Internal links</div>
              {internalLinks.map((n: any) => (
                <Link key={n.id} href={routeForType(n.type, n.id)} className="sb-item">
                  {(n.title ?? n.id).slice(0, 46)}{(n.title?.length ?? 0) > 46 ? '...' : ''}
                </Link>
              ))}
            </div>
          )}

          {backlinks.length > 0 && (
            <div className="sb-section">
              <div className="sb-label">Backlinks</div>
              {backlinks.map((n: any) => (
                <Link key={n.id} href={routeForType(n.type, n.id)} className="sb-item">
                  {(n.title ?? n.id).slice(0, 46)}{(n.title?.length ?? 0) > 46 ? '...' : ''}
                </Link>
              ))}
            </div>
          )}
        </aside>

        <main className="hub-main">
          <div className="hub-domain-chip">{label}</div>
          <h1 className="hub-title">{hubTitle}</h1>
          {hub.excerpt && <div className="hub-lede">{hub.excerpt}</div>}

          <div className="void-ornament" style={{ margin: '48px 0 56px' }}>
            <div className="void-ornament-line" />
            <span className="void-ornament-glyph">*</span>
            <div className="void-ornament-line" />
          </div>

          <HubSearch concepts={allConceptNodes} domainColor={color} />

          {/* ── Mobile level-band navigation (4.4) ── */}
          {hasLevels && (
            <div className="hub-level-bands">
              {sections.map(s => {
                const lc = LEVEL_COLOR[s.level];
                const badge = LEVEL_BADGE[s.level];
                if (!badge) return null;
                return (
                  <a
                    key={s.title}
                    href={`#sec-${encodeURIComponent(s.title)}`}
                    className="hub-level-band"
                    style={{ '--lc': lc } as React.CSSProperties}
                  >
                    <span className="hlb-dot" />
                    <span className="hlb-label">{badge}</span>
                    <span className="hlb-count">{s.conceptIds.length}</span>
                  </a>
                );
              })}
            </div>
          )}

          <div className="hub-sections">
            {sections.map((sec, si) => {
              const nodes = sec.conceptIds
                .map(id => conceptNodeMap.get(id))
                .filter(Boolean) as any[];
              const lc = LEVEL_COLOR[sec.level];
              const badge = LEVEL_BADGE[sec.level];
              const defaultOpen = si === 0;

              return (
                <details
                  key={sec.title}
                  id={`sec-${encodeURIComponent(sec.title)}`}
                  className="hub-details"
                  open={defaultOpen}
                >
                  <summary
                    className="hub-summary"
                    style={{ '--lc': lc } as React.CSSProperties}
                  >
                    {/* ── constellation node indicator ── */}
                    <span className="hub-node-dot" />
                    <span className="hub-summary-inner">
                      {badge && (
                        <span className="hub-level-badge" style={{ color: lc, borderColor: lc }}>
                          {badge}
                        </span>
                      )}
                      <span className="hub-section-title">{sec.label}</span>
                      <span className="hub-section-count" style={{ color: lc }}>{nodes.length}</span>
                    </span>
                    <span className="hub-chevron">v</span>
                  </summary>

                  <div className="hub-section-body">
                    {nodes.map((n: any, ni: number) => (
                      <Link
                        key={n.id}
                        href={`/concept/${n.id}`}
                        className="hub-concept-row"
                        style={{ '--level-color': lc, '--ni': ni } as React.CSSProperties}
                      >
                        {/* ── level colour dot ── */}
                        <span className="hcr-level-dot" />
                        <div className="hcr-left">
                          <div className="hcr-title">{n.title}</div>
                          {n.excerpt && (
                            <div className="hcr-excerpt">
                              {n.excerpt.slice(0, 160)}{n.excerpt.length > 160 ? '...' : ''}
                            </div>
                          )}
                        </div>
                        <div className="hcr-right">
                          {n.sources > 0 && (
                            <span className="hcr-meta">{n.sources} src</span>
                          )}
                          {(n.backlinks?.length ?? 0) > 0 && (
                            <span className="hcr-meta">{n.backlinks.length} bl</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </details>
              );
            })}

            {unplaced.length > 0 && (
              <details className="hub-details" open>
                <summary
                  className="hub-summary"
                  style={{ '--lc': '#3a3450' } as React.CSSProperties}
                >
                  <span className="hub-node-dot" />
                  <span className="hub-summary-inner">
                    <span className="hub-section-title" style={{ color: '#9890b0' }}>Not yet grouped</span>
                    <span className="hub-section-count" style={{ color: '#9890b0' }}>{unplaced.length}</span>
                  </span>
                  <span className="hub-chevron">v</span>
                </summary>
                <div className="hub-section-body">
                  {unplaced.map((n: any, ni: number) => (
                    <Link
                      key={n.id}
                      href={`/concept/${n.id}`}
                      className="hub-concept-row"
                      style={{ '--level-color': '#4a4468', '--ni': ni } as React.CSSProperties}
                    >
                      <span className="hcr-level-dot" />
                      <div className="hcr-left">
                        <div className="hcr-title">{n.title}</div>
                        {n.excerpt && (
                          <div className="hcr-excerpt">
                            {n.excerpt.slice(0, 160)}{n.excerpt.length > 160 ? '...' : ''}
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
              All {label} hubs
            </Link>
          </div>
        </main>
      </div>

      <style>{`

        /* ── Atmospheric layers ──────────────────────────── */

        .hub-domain-wash {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 520px;
          background: radial-gradient(
            ellipse 70% 360px at 50% -30px,
            color-mix(in srgb, var(--domain-color, #a78bfa) 16%, transparent) 0%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 0;
        }

        .hub-top-stripe {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 1.5px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--domain-color, #a78bfa) 40%,
            var(--domain-color, #a78bfa) 60%,
            transparent 100%
          );
          opacity: 0.65;
          pointer-events: none;
          z-index: 8;
        }

        /* ── Layout ──────────────────────────────────────── */

        .hub-outer {
          display: flex;
          gap: 72px;
          align-items: flex-start;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 56px 160px;
          padding-right: calc(56px + 196px);
          position: relative;
          z-index: 2;
        }
        .hub-sidebar {
          width: 200px;
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
          font-size: 10px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #7a7490;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid #1c1828;
        }
        .sb-item {
          display: block;
          font-family: var(--font-jetbrains), monospace;
          font-size: 12px;
          color: #9890b0;
          text-decoration: none;
          padding: 8px 0;
          line-height: 1.55;
          border-bottom: 1px solid #0f0e1a;
          transition: color 0.15s;
        }
        .sb-item:last-child { border-bottom: none; }
        .sb-item:hover { color: var(--domain-color, #a78bfa); }
        .sb-level-link {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--lc, #4a4468);
          font-size: 12px;
          padding: 9px 0;
        }
        .sb-level-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--lc, #4a4468);
          flex-shrink: 0;
          opacity: 0.7;
        }
        .sb-level-n {
          margin-left: auto;
          color: #4a4468;
          font-size: 11px;
        }

        /* ── Hub main ────────────────────────────────────── */

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
          font-size: clamp(52px, 6.5vw, 96px);
          font-weight: 900;
          font-style: italic;
          line-height: 1.0;
          letter-spacing: -0.025em;
          color: #ffffff;
          margin-bottom: 28px;
          font-optical-sizing: auto;
        }
        .hub-lede {
          font-family: var(--font-newsreader), serif;
          font-size: 20px;
          line-height: 1.75;
          color: #a09ab8;
          font-weight: 300;
          font-style: italic;
          border-left: 2px solid var(--domain-color, #a78bfa);
          padding-left: 22px;
          margin-bottom: 0;
          max-width: 580px;
          font-optical-sizing: auto;
        }
        .void-ornament { display: flex; align-items: center; gap: 16px; }
        .void-ornament-line { flex: 1; height: 1px; background: #1c1828; }
        .void-ornament-glyph {
          font-family: var(--font-fraunces), serif;
          font-size: 18px;
          color: var(--domain-color, #a78bfa);
          opacity: 0.25;
          font-style: italic;
        }

        /* ── Mobile level bands (4.4) ────────────────────── */

        .hub-level-bands { display: none; }

        /* ── Sections / accordion ────────────────────────── */

        .hub-sections { display: flex; flex-direction: column; gap: 0; }
        .hub-details { border-bottom: 1px solid #16141f; }
        .hub-details:first-child { border-top: 1px solid #1c1828; }

        .hub-summary {
          list-style: none;
          cursor: pointer;
          padding: 28px 0;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          transition: opacity 0.15s;
        }
        .hub-summary::-webkit-details-marker { display: none; }
        .hub-summary:hover { opacity: 0.8; }

        /* --- Constellation node dot (6.5) --- */

        .hub-node-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1.5px solid var(--lc, #4a4468);
          background: transparent;
          flex-shrink: 0;
          transition: background 0.28s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        details[open] > .hub-summary .hub-node-dot {
          background: var(--lc, #4a4468);
          box-shadow: 0 0 10px var(--lc, #4a4468), 0 0 2px var(--lc, #4a4468);
        }

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
          color: #c0bcd8;
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
          color: #6a6488;
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1);
          flex-shrink: 0;
        }
        details[open] > .hub-summary .hub-chevron { transform: rotate(180deg); }

        /* --- Concept card grid --- */

        .hub-section-body {
          padding-bottom: 2px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
        }

        /* --- Card entrance stagger (6.5) --- */

        @keyframes hcr-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        details[open] .hub-concept-row {
          animation: hcr-in 0.38s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: calc(var(--ni, 0) * 45ms + 55ms);
        }

        /* --- Concept card --- */

        .hub-concept-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 28px 24px 22px;
          margin: 0;
          text-decoration: none;
          border: none;
          background: #0d0b18;
          transition: background 0.18s;
          min-height: 140px;
          position: relative;
        }
        .hub-concept-row:hover { background: #13101e; }

        /* --- Level colour dot (6.5) --- */

        .hcr-level-dot {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--level-color, var(--domain-color, #a78bfa));
          opacity: 0.5;
          pointer-events: none;
          transition: opacity 0.18s;
        }
        .hub-concept-row:hover .hcr-level-dot { opacity: 0.9; }

        .hcr-left {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .hcr-title {
          font-family: var(--font-fraunces), serif;
          font-size: 22px;
          font-style: italic;
          color: #ffffff;
          line-height: 1.2;
          margin-bottom: 0;
          transition: color 0.15s;
          font-optical-sizing: auto;
        }
        .hub-concept-row:hover .hcr-title { color: var(--domain-color, #a78bfa); }
        .hcr-excerpt {
          font-family: var(--font-newsreader), serif;
          font-size: 13px;
          line-height: 1.65;
          color: #a09ab8;
          font-weight: 300;
          font-optical-sizing: auto;
          flex: 1;
        }
        .hcr-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
        .hcr-meta {
          font-family: var(--font-jetbrains), monospace;
          font-size: 11px;
          color: #6a6488;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .hub-concept-row:hover .hcr-meta { color: #9090b8; }

        /* --- Breakpoints --- */

        @media (max-width: 1100px) {
          .hub-section-body { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .hub-outer {
            gap: 48px;
            padding: 0 40px 120px !important;
          }
          .hub-sidebar { width: 160px; }
          .hub-section-body { grid-template-columns: repeat(2, 1fr); }
        }

        /* --- Mobile (4.4) --- */

        @media (max-width: 768px) {
          .hub-outer {
            padding: 0 20px 100px !important;
            gap: 0;
          }
          .hub-sidebar { display: none !important; }
          .hub-title { font-size: clamp(36px, 9vw, 56px) !important; }
          .hub-lede { font-size: 17px !important; }
          .hub-section-body { grid-template-columns: 1fr; }
          .hub-summary { padding: 18px 0; }

          .hub-level-bands {
            display: flex;
            flex-direction: column;
            gap: 0;
            margin: 0 -20px 32px;
            position: sticky;
            top: 0;
            z-index: 10;
            background: #09080f;
            border-bottom: 1px solid #1c1828;
          }
          .hub-level-band {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 13px 20px;
            border-left: 3px solid var(--lc, #4a4468);
            border-bottom: 1px solid #13111e;
            text-decoration: none;
            transition: background 0.15s;
          }
          .hub-level-band:last-child { border-bottom: none; }
          .hub-level-band:hover { background: rgba(255,255,255,0.03); }
          .hlb-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: var(--lc, #4a4468);
            flex-shrink: 0;
          }
          .hlb-label {
            font-family: var(--font-jetbrains), monospace;
            font-size: 10px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--lc, #9890b0);
            flex: 1;
          }
          .hlb-count {
            font-family: var(--font-jetbrains), monospace;
            font-size: 11px;
            color: #6a6488;
          }

          .hub-concept-row {
            border-left: 2.5px solid var(--level-color, var(--domain-color, #a78bfa)) !important;
            padding: 18px 16px 18px 20px !important;
          }
          .hcr-title { font-size: 17px !important; }
        }

        /* --- Right nav --- */

        .hub-right-nav {
          position: fixed !important;
          right: 0;
          top: 0;
        }
        @media (max-width: 900px) {
          .hub-right-nav { display: none !important; }
        }

      `}</style>
    </div>
  );
}
