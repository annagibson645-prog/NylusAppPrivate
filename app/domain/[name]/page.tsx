export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import NavG from '@/components/NavG';

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

/* ── Sri Yantra background — two-layer glow + crisp geometry ── */
function YantraBg({ color, uid }: { color: string; uid: string }) {
  const cx = 200, cy = 200;

  // Equilateral triangles — tip pointing up
  const up = (r: number) => {
    const h = +(r * 0.866).toFixed(2);
    return `${cx},${cy - r} ${cx - h},${+(cy + r * 0.5).toFixed(2)} ${cx + h},${+(cy + r * 0.5).toFixed(2)}`;
  };
  // Equilateral triangles — tip pointing down
  const dn = (r: number) => {
    const h = +(r * 0.866).toFixed(2);
    return `${cx},${cy + r} ${cx - h},${+(cy - r * 0.5).toFixed(2)} ${cx + h},${+(cy - r * 0.5).toFixed(2)}`;
  };

  const filterId = `yg-${uid}`;
  const upRadii  = [140, 108, 80, 52];
  const dnRadii  = [134, 102, 74, 46, 22];

  const geometry = (
    <>
      {/* Outer sacred circles */}
      <circle cx={cx} cy={cy} r={162} />
      <circle cx={cx} cy={cy} r={150} />
      {/* Inner bindu ring */}
      <circle cx={cx} cy={cy} r={18} />
      {/* 4 upward triangles */}
      {upRadii.map(r => <polygon key={`u${r}`} points={up(r)} />)}
      {/* 5 downward triangles */}
      {dnRadii.map(r => <polygon key={`d${r}`} points={dn(r)} />)}
      {/* Central bindu */}
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="none" />
    </>
  );

  return (
    <div className="void-yantra-bg" aria-hidden="true">
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow layer — blurred, domain color luminance */}
        <g
          stroke={color}
          strokeWidth="1.5"
          opacity="0.26"
          fill="none"
          filter={`url(#${filterId})`}
        >
          {geometry}
        </g>

        {/* Crisp layer — thin lines, very low opacity */}
        <g
          stroke={color}
          strokeWidth="0.6"
          opacity="0.07"
          fill="none"
        >
          {geometry}
        </g>
      </svg>
    </div>
  );
}

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

  const ungrouped = concepts
    .filter((n) => n.type === 'concept' && !n.hub)
    .sort((a, b) => new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime())
    .slice(0, 12);

  return (
    <div className="void-page" style={{ '--domain-color': domainColor } as React.CSSProperties}>
      <div className="void-ambient" />
      {/* Atmospheric radial wash */}
      <div className="void-domain-wash" />
      {/* Sri Yantra — glowing sacred geometry background */}
      <YantraBg color={domainColor} uid={safeName} />
      {/* Thin domain color stripe across top */}
      <div className="void-domain-stripe" />

      <NavG active="Domains" />

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
              {domainHubs.map((hub: any, index: number) => (
                <Link
                  key={hub.id}
                  href={`/hub/${hub.id}`}
                  className="void-hub-card"
                  style={{ '--i': index } as React.CSSProperties}
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
            <div className="void-section-label" style={{ marginTop: 48 }}>Ungrouped Concepts</div>
            <div className="void-compact-list">
              {ungrouped.map((n: any, index: number) => (
                <Link key={n.id} href={`/concept/${n.id}`} className="void-compact-item" style={{ '--j': index } as React.CSSProperties}>
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
