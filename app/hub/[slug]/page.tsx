export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { domainColor, domainName, shortId } from '@/lib/adapt-vault';

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

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hubs = loadJSON<any[]>('hubs.json');
  const graph = loadJSON<{ nodes: any[] }>('graph.json');

  const hub = hubs.find((h: any) => h.id === slug);
  if (!hub) notFound();

  const color = domainColor(hub.domain);
  const label = DOMAIN_FULL[hub.domain] ?? hub.domain;

  // Get concept nodes that belong to this hub
  const conceptIds = new Set<string>(hub.concepts ?? []);
  const conceptNodes = graph.nodes
    .filter((n: any) => n.type === 'concept' && conceptIds.has(n.id))
    .sort((a: any, b: any) => (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0));

  return (
    <div
      className="void-page"
      style={{ '--domain-color': color } as React.CSSProperties}
    >
      <div className="void-ambient" />

      {/* Nav */}
      <nav className="void-nav">
        <Link href="/" className="void-nav-back">← constellation</Link>
        <Link href={`/domain/${hub.domain}`} className="void-nav-back" style={{ marginLeft: 16 }}>
          ← {label}
        </Link>
      </nav>

      <div className="void-content">
        {/* Domain chip */}
        <div className="void-domain-chip">{label}</div>

        {/* Hub title */}
        <h1 className="void-title">{hub.title.replace(/ — Map of Content$/, '').replace(/ Hub$/, '')}</h1>

        {/* Excerpt / what this covers */}
        {hub.excerpt && (
          <div className="void-lede">{hub.excerpt}</div>
        )}

        <div className="void-meta-inline">
          <span>{conceptNodes.length} concepts</span>
          <span className="void-meta-dot">·</span>
          <span>{label}</span>
        </div>

        <div className="void-ornament">✦</div>

        {/* Concept grid */}
        {conceptNodes.length > 0 ? (
          <div className="void-concept-grid">
            {conceptNodes.map((n: any) => (
              <Link
                key={n.id}
                href={`/concept/${n.id}`}
                className="void-concept-card"
              >
                <div className="void-concept-card-domain">{label}</div>
                <div className="void-concept-card-title">{n.title}</div>
                {n.excerpt && (
                  <div className="void-concept-card-excerpt">
                    {n.excerpt.slice(0, 120)}
                    {n.excerpt.length > 120 ? '…' : ''}
                  </div>
                )}
                <div className="void-concept-card-meta">
                  {n.sources ?? 0} {n.sources === 1 ? 'source' : 'sources'}
                  {(n.backlinks?.length ?? 0) > 0 && (
                    <span> · {n.backlinks.length} links</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--void-dim)', fontFamily: 'var(--void-mono)', fontSize: 13 }}>
            No concepts indexed in this hub yet.
          </p>
        )}

        {/* Back links */}
        <div className="void-meta-strip" style={{ marginTop: 64 }}>
          <Link href={`/domain/${hub.domain}`} style={{ color: 'var(--domain-color, #a78bfa)', textDecoration: 'none', fontSize: 13 }}>
            ← All {label} hubs
          </Link>
        </div>
      </div>

      <style>{`
        .void-concept-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
          margin-top: 40px;
        }
        .void-concept-card {
          display: block;
          padding: 20px 24px;
          background: color-mix(in srgb, var(--domain-color, #a78bfa) 4%, #0d0c14);
          border: 1px solid color-mix(in srgb, var(--domain-color, #a78bfa) 18%, transparent);
          border-radius: 8px;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s, transform 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .void-concept-card:hover {
          border-color: color-mix(in srgb, var(--domain-color, #a78bfa) 50%, transparent);
          background: color-mix(in srgb, var(--domain-color, #a78bfa) 8%, #0d0c14);
          transform: translateY(-2px);
        }
        .void-concept-card-domain {
          font-family: var(--void-mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--domain-color, #a78bfa);
          margin-bottom: 8px;
        }
        .void-concept-card-title {
          font-family: var(--void-serif);
          font-size: 17px;
          font-weight: 600;
          color: #f0ecf5;
          line-height: 1.35;
          margin-bottom: 10px;
        }
        .void-concept-card-excerpt {
          font-family: var(--void-body);
          font-size: 13px;
          color: rgba(240,236,245,0.55);
          line-height: 1.65;
          margin-bottom: 12px;
        }
        .void-concept-card-meta {
          font-family: var(--void-mono);
          font-size: 11px;
          color: rgba(240,236,245,0.3);
          letter-spacing: 0.06em;
        }
      `}</style>
    </div>
  );
}
