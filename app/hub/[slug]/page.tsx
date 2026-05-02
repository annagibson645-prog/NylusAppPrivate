export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { domainColor } from '@/lib/adapt-vault';

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

  // ── Concept nodes in this hub ──────────────────────────────────────
  const conceptIds = new Set<string>(hub.concepts ?? []);
  const conceptNodes = graph.nodes
    .filter((n: any) => n.type === 'concept' && conceptIds.has(n.id))
    .sort((a: any, b: any) => (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0));

  // ── Sidebar: Sources ──────────────────────────────────────────────
  // Collect all source nodes linked from any concept in this hub
  const sourceSet = new Map<string, any>();
  for (const c of conceptNodes) {
    for (const linkId of (c.links ?? [])) {
      const n = nodeMap.get(linkId);
      if (n && n.type === 'source') sourceSet.set(n.id, n);
    }
  }
  const sources = Array.from(sourceSet.values()).slice(0, 12);

  // ── Sidebar: Backlinks (inbound from outside this hub) ─────────────
  const backlinkSet = new Map<string, any>();
  for (const c of conceptNodes) {
    for (const blId of (c.backlinks ?? [])) {
      if (!conceptIds.has(blId)) {
        const n = nodeMap.get(blId);
        if (n && (n.type === 'concept' || n.type === 'collision' || n.type === 'spark')) {
          backlinkSet.set(n.id, n);
        }
      }
    }
  }
  const backlinkedNodes = Array.from(backlinkSet.values()).slice(0, 12);

  // ── Sidebar: Internal links (cross-links within this hub) ──────────
  const internalSet = new Map<string, any>();
  for (const c of conceptNodes) {
    for (const linkId of (c.links ?? [])) {
      if (conceptIds.has(linkId) && linkId !== c.id) {
        const n = nodeMap.get(linkId);
        if (n) internalSet.set(n.id, n);
      }
    }
  }
  const internalLinks = Array.from(internalSet.values()).slice(0, 12);

  const hubTitle = hub.title.replace(/ — Map of Content$/, '').replace(/ Hub$/, '');

  return (
    <div className="void-page" style={{ '--domain-color': color } as React.CSSProperties}>
      <div className="void-ambient" />

      {/* Nav */}
      <nav className="void-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" className="void-nav-back">← constellation</Link>
          <span style={{ color: '#2a2535' }}>·</span>
          <Link href={`/domain/${hub.domain}`} className="void-nav-back">{label}</Link>
        </div>
      </nav>

      <div className="hub-outer">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="hub-sidebar">

          {/* Sources */}
          {sources.length > 0 && (
            <div className="sb-section">
              <div className="sb-label">Sources</div>
              {sources.map((s: any) => (
                <Link key={s.id} href={`/source/${s.id}`} className="sb-item">
                  {s.title?.replace(/^SOURCE:\s*/i, '').slice(0, 52) ?? s.id}
                  {(s.title?.replace(/^SOURCE:\s*/i, '').length ?? 0) > 52 ? '…' : ''}
                </Link>
              ))}
            </div>
          )}

          {/* Internal links */}
          {internalLinks.length > 0 && (
            <div className="sb-section">
              <div className="sb-label">Internal links</div>
              {internalLinks.map((n: any) => (
                <Link key={n.id} href={routeForType(n.type, n.id)} className="sb-item">
                  {n.title?.slice(0, 52) ?? n.id}
                  {(n.title?.length ?? 0) > 52 ? '…' : ''}
                </Link>
              ))}
            </div>
          )}

          {/* Backlinks */}
          {backlinkedNodes.length > 0 && (
            <div className="sb-section">
              <div className="sb-label">Backlinks</div>
              {backlinkedNodes.map((n: any) => (
                <Link key={n.id} href={routeForType(n.type, n.id)} className="sb-item">
                  {n.title?.slice(0, 52) ?? n.id}
                  {(n.title?.length ?? 0) > 52 ? '…' : ''}
                </Link>
              ))}
            </div>
          )}

        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="hub-main">

          {/* Header */}
          <div className="hub-domain-chip">{label}</div>
          <h1 className="hub-title">{hubTitle}</h1>
          {hub.excerpt && (
            <div className="hub-lede">{hub.excerpt}</div>
          )}

          {/* Index table */}
          <div className="hub-index">
            <div className="idx-header">
              <span>concept</span>
              <span className="idx-col-r">sources</span>
              <span className="idx-col-r">links</span>
            </div>

            {conceptNodes.map((n: any) => (
              <Link key={n.id} href={`/concept/${n.id}`} className="idx-row">
                <div className="idx-body">
                  <div className="idx-title">{n.title}</div>
                  {n.excerpt && (
                    <div className="idx-excerpt">
                      {n.excerpt.slice(0, 140)}{n.excerpt.length > 140 ? '…' : ''}
                    </div>
                  )}
                </div>
                <span className="idx-col-r idx-num">{n.sources ?? 0}</span>
                <span className="idx-col-r idx-num">{n.backlinks?.length ?? 0}</span>
              </Link>
            ))}

            {conceptNodes.length === 0 && (
              <div style={{ padding: '32px 0', color: '#3a3450', fontSize: 13, fontFamily: 'var(--font-jetbrains)' }}>
                No concepts indexed yet.
              </div>
            )}
          </div>

          <div style={{ marginTop: 48 }}>
            <Link href={`/domain/${hub.domain}`} className="void-nav-back">
              ← All {label} hubs
            </Link>
          </div>

        </main>
      </div>

      <style>{`
        .hub-outer {
          display: flex;
          gap: 64px;
          align-items: flex-start;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 56px 140px;
          position: relative;
          z-index: 2;
        }

        /* ── Sidebar ── */
        .hub-sidebar {
          width: 190px;
          flex-shrink: 0;
          position: sticky;
          top: 40px;
        }
        .sb-section {
          margin-bottom: 36px;
        }
        .sb-label {
          font-family: var(--font-jetbrains), monospace;
          font-size: 9px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #3a3450;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #1a1828;
        }
        .sb-item {
          display: block;
          font-family: var(--font-jetbrains), monospace;
          font-size: 11px;
          color: #4a4468;
          text-decoration: none;
          padding: 5px 0;
          line-height: 1.5;
          border-bottom: 1px solid #13111e;
          transition: color 0.15s;
        }
        .sb-item:last-child { border-bottom: none; }
        .sb-item:hover { color: var(--domain-color, #a78bfa); }

        /* ── Main ── */
        .hub-main {
          flex: 1;
          min-width: 0;
        }
        .hub-domain-chip {
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--domain-color, #a78bfa);
          margin-bottom: 20px;
          opacity: 0.8;
        }
        .hub-title {
          font-family: var(--font-fraunces), serif;
          font-size: clamp(40px, 5vw, 72px);
          font-weight: 900;
          font-style: italic;
          line-height: 1.0;
          letter-spacing: -0.02em;
          color: #ddd8ea;
          margin-bottom: 24px;
          font-optical-sizing: auto;
        }
        .hub-lede {
          font-family: var(--font-newsreader), serif;
          font-size: 18px;
          line-height: 1.7;
          color: #7a7090;
          font-weight: 300;
          font-style: italic;
          border-left: 2px solid var(--domain-color, #a78bfa);
          padding-left: 20px;
          margin-bottom: 48px;
          max-width: 560px;
          font-optical-sizing: auto;
        }

        /* ── Index ── */
        .hub-index {
          border-top: 1px solid #1c1828;
        }
        .idx-header {
          display: grid;
          grid-template-columns: 1fr 64px 64px;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #1c1828;
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #2e2a3e;
        }
        .idx-col-r { text-align: right; }
        .idx-row {
          display: grid;
          grid-template-columns: 1fr 64px 64px;
          gap: 16px;
          padding: 22px 0;
          border-bottom: 1px solid #13111e;
          text-decoration: none;
          align-items: start;
          transition: background 0.15s;
          border-radius: 3px;
        }
        .idx-row:hover {
          background: #0f0e1a;
          margin: 0 -12px;
          padding-left: 12px;
          padding-right: 12px;
        }
        .idx-title {
          font-family: var(--font-fraunces), serif;
          font-size: 22px;
          font-style: italic;
          color: #b8b0d0;
          line-height: 1.2;
          margin-bottom: 8px;
          transition: color 0.15s;
        }
        .idx-row:hover .idx-title { color: #e0d8f0; }
        .idx-excerpt {
          font-family: var(--font-newsreader), serif;
          font-size: 13px;
          line-height: 1.65;
          color: #3a3450;
          font-weight: 300;
          font-optical-sizing: auto;
        }
        .idx-num {
          font-family: var(--font-jetbrains), monospace;
          font-size: 13px;
          color: #2e2a3e;
          padding-top: 4px;
          letter-spacing: 0.04em;
        }
        .idx-row:hover .idx-num { color: #6050a0; }

        @media (max-width: 768px) {
          .hub-outer { flex-direction: column; padding: 0 20px 80px; gap: 40px; }
          .hub-sidebar { position: static; width: 100%; }
          .idx-row { grid-template-columns: 1fr 48px 48px; }
        }
      `}</style>
    </div>
  );
}
