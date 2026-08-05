// app/hub-proto/page.tsx
// Three prototypes for the individual hub page: a Council-style animated hero
// (back arrow, domain emblem, big italic title) with the wheel gone entirely,
// followed by the hub's concepts as a 3-per-row card grid with a top-to-bottom
// reveal. Uses one real hub's data so the comparison is honest.

export const dynamic = 'force-dynamic';

import { readFileSync } from 'fs';
import path from 'path';
import Link from 'next/link';
import { domainColor } from '@/lib/adapt-vault';
import { pickHubIcon } from '@/lib/hubIcons';
import { DomainEmblem } from '@/components/DomainEmblems';

function loadJSON<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), 'public/data', file), 'utf-8'));
}

const DOMAIN_FULL: Record<string, string> = {
  psychology:             'Psychology',
  history:                'History',
  'behavioral-mechanics': 'Behavioral Mechanics',
  'eastern-spirituality': 'Eastern Spirituality',
  'cross-domain':         'Cross-Domain',
  'creative-practice':    'Creative Practice',
  'business':             'Business',
  'african-spirituality': 'African Spirituality',
};

function hexToRgb(hex: string): string {
  const m = hex.replace('#', '');
  const n = m.length === 3
    ? m.split('').map(c => c + c).join('')
    : m;
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  return `${r}, ${g}, ${b}`;
}

const CSS = `
  .hp-root {
    background: #0e0c09; color: #f0e8d4;
    font-family: var(--font-newsreader, Georgia, serif);
  }
  .hp-label {
    max-width: 1100px; margin: 0 auto; padding: 48px 32px 0;
    font-family: var(--font-jetbrains, monospace); font-size: 11px;
    letter-spacing: 0.24em; text-transform: uppercase; color: #6a5e50;
  }
  .hp-label b { color: #c8a040; }
  .hp-desc { font-style: italic; color: #9a8a78; text-transform: none; letter-spacing: 0.01em; font-size: 14px; margin-top: 6px; max-width: 640px; }

  /* ── Prototype A: Full-Bleed Glow (closest to the Council seat) ────── */
  .hpA-hero { position: relative; min-height: 62vh; display: flex; flex-direction: column; justify-content: center; padding: 72px 32px 56px; overflow: hidden; }
  .hpA-glow { position: absolute; top: 42%; left: 68%; width: 70vw; height: 70vw; max-width: 900px; max-height: 900px; transform: translate(-50%,-50%);
    background: radial-gradient(circle, rgba(var(--rc),0.22) 0%, rgba(var(--rc),0.06) 40%, transparent 70%); pointer-events: none; z-index: 1;
    animation: hpGlowIn 2s cubic-bezier(.16,1,.3,1) both; }
  .hpA-emblem { position: absolute; top: 50%; right: -6vw; transform: translateY(-50%); color: var(--dc); opacity: 0.13; z-index: 1; pointer-events: none;
    animation: hpEmblemIn 2.2s cubic-bezier(.16,1,.3,1) both; }
  .hpA-emblem svg { width: 46vh; height: 46vh; display: block; }
  .hpA-scrim { position: absolute; inset: 0; z-index: 2; pointer-events: none; background: linear-gradient(90deg, #0e0c09 10%, transparent 62%); opacity: 0.85; }
  .hpA-inner { position: relative; z-index: 3; max-width: 900px; margin: 0 auto; width: 100%; }
  .hpA-back { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-jetbrains, monospace); font-size: 12px; letter-spacing: 0.1em;
    color: #9a8a78; text-decoration: none; margin-bottom: 32px; transition: color .2s, transform .2s; animation: hpRise .8s cubic-bezier(.16,1,.3,1) both; animation-delay: .05s; }
  .hpA-back:hover { color: var(--dc); transform: translateX(-3px); }
  .hpA-kicker { font-family: var(--font-jetbrains, monospace); font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--dc); margin-bottom: 20px;
    animation: hpRise .9s cubic-bezier(.16,1,.3,1) both; animation-delay: .15s; }
  .hpA-title { font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-style: italic; font-weight: 500;
    font-size: clamp(40px, 6.5vw, 76px); line-height: 1; margin: 0 0 18px; animation: hpRise 1s cubic-bezier(.16,1,.3,1) both; animation-delay: .26s; }
  .hpA-excerpt { font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-size: clamp(16px, 1.8vw, 20px); font-style: italic; color: #9a8a78;
    max-width: 620px; margin: 0 0 28px; line-height: 1.6; animation: hpRise 1s cubic-bezier(.16,1,.3,1) both; animation-delay: .38s; }
  .hpA-meta { display: inline-flex; gap: 22px; font-family: var(--font-jetbrains, monospace); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #6a5e50;
    animation: hpRise 1s cubic-bezier(.16,1,.3,1) both; animation-delay: .5s; }
  .hpA-meta b { color: var(--dc); }

  /* ── Prototype B: Compact Banner (restrained, not full-viewport) ───── */
  .hpB-hero { position: relative; padding: 56px 32px 40px; border-bottom: 1px solid #2e2818; overflow: hidden; }
  .hpB-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; gap: 36px; position: relative; z-index: 2; }
  .hpB-icon { width: 92px; height: 92px; border-radius: 50%; flex-shrink: 0; position: relative;
    animation: hpPop .7s cubic-bezier(.2,.8,.2,1.1) both; animation-delay: .1s; }
  .hpB-icon-ring { position: absolute; inset: -8px; border-radius: 50%; border: 1px solid rgba(var(--rc),0.4); animation: hpSpin 24s linear infinite; }
  .hpB-icon-fill { position: absolute; inset: 0; border-radius: 50%; background: rgba(var(--rc),0.14); border: 1.5px solid rgba(var(--rc),0.5);
    display: flex; align-items: center; justify-content: center; font-size: 36px; }
  .hpB-text { flex: 1; min-width: 0; }
  .hpB-back { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-jetbrains, monospace); font-size: 11px; letter-spacing: 0.1em;
    color: #9a8a78; text-decoration: none; margin-bottom: 10px; animation: hpRise .7s cubic-bezier(.16,1,.3,1) both; }
  .hpB-back:hover { color: var(--dc); }
  .hpB-kicker { font-family: var(--font-jetbrains, monospace); font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--dc); margin-bottom: 8px;
    animation: hpRise .8s cubic-bezier(.16,1,.3,1) both; animation-delay: .08s; }
  .hpB-title { font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-style: italic; font-weight: 500;
    font-size: clamp(28px, 4vw, 42px); line-height: 1.08; margin: 0 0 8px; animation: hpRise .85s cubic-bezier(.16,1,.3,1) both; animation-delay: .14s; }
  .hpB-excerpt { font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-size: 16px; font-style: italic; color: #9a8a78; margin: 0;
    max-width: 560px; line-height: 1.5; animation: hpRise .9s cubic-bezier(.16,1,.3,1) both; animation-delay: .2s; }
  .hpB-bgIcon { position: absolute; top: 50%; right: 4%; transform: translateY(-50%); color: var(--dc); opacity: 0.06; z-index: 1; pointer-events: none; }
  .hpB-bgIcon svg { width: 260px; height: 260px; }

  /* ── Prototype C: Split Portrait (medallion column) ─────────────────── */
  .hpC-hero { position: relative; padding: 64px 32px 48px; overflow: hidden; }
  .hpC-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr 220px; gap: 48px; align-items: center; position: relative; z-index: 2; }
  .hpC-back { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-jetbrains, monospace); font-size: 12px; letter-spacing: 0.1em;
    color: #9a8a78; text-decoration: none; margin-bottom: 20px; animation: hpRise .7s cubic-bezier(.16,1,.3,1) both; }
  .hpC-back:hover { color: var(--dc); }
  .hpC-kicker { font-family: var(--font-jetbrains, monospace); font-size: 11px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--dc); margin-bottom: 16px;
    animation: hpRise .8s cubic-bezier(.16,1,.3,1) both; animation-delay: .08s; }
  .hpC-title { font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-style: italic; font-weight: 500;
    font-size: clamp(34px, 5vw, 56px); line-height: 1.04; margin: 0 0 16px; animation: hpRise .9s cubic-bezier(.16,1,.3,1) both; animation-delay: .16s; }
  .hpC-excerpt { font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-size: 18px; font-style: italic; color: #9a8a78; margin: 0 0 20px;
    max-width: 480px; line-height: 1.6; animation: hpRise .95s cubic-bezier(.16,1,.3,1) both; animation-delay: .24s; }
  .hpC-meta { font-family: var(--font-jetbrains, monospace); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #6a5e50;
    animation: hpRise 1s cubic-bezier(.16,1,.3,1) both; animation-delay: .32s; }
  .hpC-meta b { color: var(--dc); }
  .hpC-medal { position: relative; width: 200px; height: 200px; margin: 0 auto; animation: hpPop 1s cubic-bezier(.2,.8,.2,1.1) both; animation-delay: .2s; }
  .hpC-medal-ring1 { position: absolute; inset: 0; border-radius: 50%; border: 1px dashed rgba(var(--rc),0.35); animation: hpSpin 40s linear infinite; }
  .hpC-medal-ring2 { position: absolute; inset: 16px; border-radius: 50%; border: 1px solid rgba(var(--rc),0.5); }
  .hpC-medal-fill { position: absolute; inset: 30px; border-radius: 50%; background: radial-gradient(circle, rgba(var(--rc),0.22), rgba(var(--rc),0.06));
    display: flex; align-items: center; justify-content: center; font-size: 52px; box-shadow: 0 0 30px rgba(var(--rc),0.25); }

  /* ── Shared: concept card grid + reveal ──────────────────────────── */
  .hp-grid-wrap { max-width: 1140px; margin: 0 auto; padding: 44px 32px 64px; }
  .hp-grid-head { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid #2e2818; padding-top: 18px; margin-bottom: 22px; }
  .hp-grid-head h2 { font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-style: italic; font-size: 22px; font-weight: 400; margin: 0; color: #f0e8d4; }
  .hp-grid-head span { font-family: var(--font-jetbrains, monospace); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #6a5e50; }
  .hp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  @media (max-width: 1080px) { .hp-grid { grid-template-columns: repeat(2, 1fr); } .hpC-inner { grid-template-columns: 1fr; } .hpC-medal { margin: 0; } }
  @media (max-width: 640px) { .hp-grid { grid-template-columns: 1fr; } .hpB-inner { flex-direction: column; align-items: flex-start; } }

  .hp-card { background: #1a1510; border: 1px solid #2e2818; padding: 22px 22px 18px; text-decoration: none; display: block; color: inherit;
    opacity: 0; transform: translateY(18px); animation: hpCardIn .6s cubic-bezier(.16,1,.3,1) both; transition: background .2s, border-color .2s; }
  .hp-card:hover { background: #221d15; border-color: rgba(var(--rc),0.4); }
  .hp-card-num { font-family: var(--font-jetbrains, monospace); font-size: 10px; color: var(--dc); opacity: 0.7; letter-spacing: 0.14em; }
  .hp-card-title { font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-size: 19px; color: #f0e8d4; line-height: 1.3; margin: 8px 0 8px; }
  .hp-card-excerpt { font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-size: 14.5px; font-style: italic; color: #9a8a78; line-height: 1.5; margin: 0; }

  @keyframes hpRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes hpGlowIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes hpEmblemIn { from { opacity: 0; transform: translateY(-50%) scale(0.88); } to { opacity: 0.13; transform: translateY(-50%) scale(1); } }
  @keyframes hpPop { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
  @keyframes hpSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes hpCardIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function HubProtoPage() {
  const hubs  = loadJSON<any[]>('hubs.json');
  const graph = loadJSON<{ nodes: any[] }>('graph.json');

  const hub = hubs.find((h: any) => h.id === 'chase-hughes-hub') ?? hubs[0];
  const color = domainColor(hub.domain);
  const rc = hexToRgb(color);
  const label = DOMAIN_FULL[hub.domain] ?? hub.domain;
  const title = hub.title.replace(/ — Map of Content$/, '').replace(/ Hub$/, '');
  const glyph = pickHubIcon(title, hub.domain, 0);

  const conceptIds: string[] = (hub.concepts ?? []).slice(0, 9);
  const concepts = conceptIds
    .map(id => graph.nodes.find((n: any) => n.id === id))
    .filter(Boolean);

  const rootStyle = { ['--dc' as string]: color, ['--rc' as string]: rc } as React.CSSProperties;

  const Grid = ({ delayBase = 0 }: { delayBase?: number }) => (
    <div className="hp-grid-wrap">
      <div className="hp-grid-head">
        <h2>{title}</h2>
        <span>{hub.covers} concepts</span>
      </div>
      <div className="hp-grid">
        {concepts.map((c: any, i: number) => (
          <div className="hp-card" key={c.id} style={{ animationDelay: `${delayBase + i * 0.06}s` }}>
            <div className="hp-card-num">{String(i + 1).padStart(2, '0')}</div>
            <div className="hp-card-title">{c.title.length > 64 ? c.title.slice(0, 64) + '…' : c.title}</div>
            {c.excerpt && <p className="hp-card-excerpt">{c.excerpt.slice(0, 110)}…</p>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="hp-root" style={rootStyle}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ═══ PROTOTYPE A — Full-Bleed Glow ═══════════════════════════════ */}
      <div className="hp-label">
        <b>Prototype A</b> — Full-Bleed Glow
        <div className="hp-desc">Closest to the Council seat: near-full-height hero, radial glow, giant faint domain emblem bleeding off the right edge, scrim for text contrast.</div>
      </div>
      <header className="hpA-hero">
        <div className="hpA-glow" aria-hidden />
        <div className="hpA-emblem" aria-hidden><DomainEmblem domain={hub.domain} /></div>
        <div className="hpA-scrim" aria-hidden />
        <div className="hpA-inner">
          <Link href="/hubs" className="hpA-back">← Back to the Hubs</Link>
          <div className="hpA-kicker">{label} · Map of Content</div>
          <h1 className="hpA-title">{title}</h1>
          {hub.excerpt && <p className="hpA-excerpt">{hub.excerpt}</p>}
          <div className="hpA-meta"><span><b>{hub.covers}</b> concepts</span><span>{label}</span></div>
        </div>
      </header>
      <Grid />

      {/* ═══ PROTOTYPE B — Compact Banner ═════════════════════════════════ */}
      <div className="hp-label">
        <b>Prototype B</b> — Compact Banner
        <div className="hp-desc">Restrained, not full-viewport: small halo medallion inline with the title (echoing the hub-card icon), faint emblem ghosted behind, content starts immediately.</div>
      </div>
      <header className="hpB-hero">
        <div className="hpB-bgIcon" aria-hidden><DomainEmblem domain={hub.domain} /></div>
        <div className="hpB-inner">
          <div className="hpB-icon">
            <div className="hpB-icon-ring" />
            <div className="hpB-icon-fill">{glyph}</div>
          </div>
          <div className="hpB-text">
            <Link href="/hubs" className="hpB-back">← Back to the Hubs</Link>
            <div className="hpB-kicker">{label} · Map of Content</div>
            <h1 className="hpB-title">{title}</h1>
            {hub.excerpt && <p className="hpB-excerpt">{hub.excerpt}</p>}
          </div>
        </div>
      </header>
      <Grid delayBase={0.1} />

      {/* ═══ PROTOTYPE C — Split Portrait ═════════════════════════════════ */}
      <div className="hp-label">
        <b>Prototype C</b> — Split Portrait
        <div className="hp-desc">Two-column hero: text on the left, a glowing medallion (dashed slow-spin ring + solid ring + filled glyph) standing in as the "seat portrait" on the right.</div>
      </div>
      <header className="hpC-hero">
        <div className="hpC-inner">
          <div>
            <Link href="/hubs" className="hpC-back">← Back to the Hubs</Link>
            <div className="hpC-kicker">{label} · Map of Content</div>
            <h1 className="hpC-title">{title}</h1>
            {hub.excerpt && <p className="hpC-excerpt">{hub.excerpt}</p>}
            <div className="hpC-meta"><b>{hub.covers}</b> concepts in this hub</div>
          </div>
          <div className="hpC-medal">
            <div className="hpC-medal-ring1" />
            <div className="hpC-medal-ring2" />
            <div className="hpC-medal-fill">{glyph}</div>
          </div>
        </div>
      </header>
      <Grid delayBase={0.2} />

      <div style={{ height: 80 }} />
    </div>
  );
}
