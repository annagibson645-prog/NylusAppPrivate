export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

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

const STATUS_ORDER: Record<string, number> = {
  stable: 0,
  developing: 1,
  stub: 2,
};

export default async function DomainAllPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safeName = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  let nodes: any[] = [];
  try {
    nodes = loadJSON<any[]>(`domain-${safeName}.json`);
  } catch {
    notFound();
  }

  const domainColor = DOMAIN_COLORS[name] ?? '#a78bfa';
  const label = DOMAIN_FULL[name] ?? name;

  const concepts = nodes
    .filter((n) => n.type === 'concept' || n.type === 'thread')
    .sort((a, b) => {
      const sa = STATUS_ORDER[a.status ?? 'stub'] ?? 2;
      const sb = STATUS_ORDER[b.status ?? 'stub'] ?? 2;
      if (sa !== sb) return sa - sb;
      return (b.backlinks?.length ?? 0) - (a.backlinks?.length ?? 0);
    });

  const stableCount = concepts.filter((n) => n.status === 'stable').length;
  const developingCount = concepts.filter((n) => n.status === 'developing').length;
  const stubCount = concepts.filter((n) => n.status === 'stub').length;

  // Group by first letter for index
  const byLetter: Record<string, any[]> = {};
  const sorted = [...concepts].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
  for (const n of sorted) {
    const letter = (n.title ?? n.id).charAt(0).toUpperCase();
    if (!byLetter[letter]) byLetter[letter] = [];
    byLetter[letter].push(n);
  }
  const letters = Object.keys(byLetter).sort();

  return (
    <div className="void-page" style={{ '--domain-color': domainColor } as React.CSSProperties}>
      <div className="void-ambient" />

      <nav className="void-nav">
        <Link href="/" className="void-nav-brand">NylusS</Link>
        <div className="void-nav-right">
          <Link href={`/domain/${name}`} className="void-nav-back">← {label}</Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="void-content">
        <div className="void-domain-chip">{label}</div>
        <h1 className="void-title">All Concepts</h1>

        <div className="void-meta-inline">
          <span>{concepts.length} total</span>
          <span className="void-meta-dot">·</span>
          <span>{stableCount} stable</span>
          <span className="void-meta-dot">·</span>
          <span>{developingCount} developing</span>
          <span className="void-meta-dot">·</span>
          <span>{stubCount} stub</span>
        </div>

        <div className="void-ornament">✦</div>

        {/* Letter index */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: 48,
        }}>
          {letters.map(letter => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--domain-color)',
                padding: '3px 8px',
                border: '1px solid',
                borderColor: 'var(--domain-color)',
                borderRadius: 3,
                opacity: 0.7,
                textDecoration: 'none',
              }}
            >
              {letter}
            </a>
          ))}
        </div>

        {/* Alphabetical listing */}
        {letters.map(letter => (
          <div key={letter} id={`letter-${letter}`} style={{ marginBottom: 48 }}>
            <div className="void-section-label">{letter}</div>
            <div className="void-compact-list">
              {byLetter[letter].map((n: any) => (
                <Link key={n.id} href={`/concept/${n.id}`} className="void-compact-item">
                  <span className="void-compact-status">{n.status ?? 'stub'}</span>
                  <span className="void-compact-title">{n.title}</span>
                  {(n.backlinks?.length ?? 0) > 0 && (
                    <span style={{
                      fontSize: 10,
                      color: '#4a4468',
                      fontFamily: 'var(--font-jetbrains), monospace',
                      marginLeft: 'auto',
                      marginRight: 8,
                    }}>
                      {n.backlinks.length} ←
                    </span>
                  )}
                  <span className="void-compact-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="void-meta-strip" style={{ marginTop: 64 }}>
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
        </div>
      </div>
    </div>
  );
}
