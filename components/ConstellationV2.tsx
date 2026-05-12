"use client";
// ConstellationV2.tsx — full port of constellation-v2.jsx + constellation-views.jsx
// All window.NYLUS_DATA / window.useC2Time / window.c2Style references replaced
// with React Context + direct definitions.

import {
  useState, useMemo, useEffect, useRef,
  createContext, useContext,
  type ReactNode, type CSSProperties,
} from 'react';
import { useRouter } from 'next/navigation';
import type { NylusData, NylusDomain, NylusConcept, NylusEssay, NylusHub } from '@/lib/adapt-vault';
import ShootingStars from './ShootingStars';

// ─── Aliases (match original JSX style) ────────────────────────────────────
const uS = useState;
const uM = useMemo;
const uE = useEffect;
const uR = useRef;

// ─── Palettes ────────────────────────────────────────────────────────────────
const C2_PALETTES: Record<string, Record<string, string>> = {
  ember: {
    bg: '#0e0d14', bg2: '#15131c', bg3: '#1c1a26',
    text: '#ffffff', dim: '#8a849a', dim2: '#494456',
    border: 'rgba(255,255,255,0.08)', borderHi: 'rgba(255,255,255,0.18)',
    hub: '#e8b86a', hubGlow: 'rgba(232,184,106,0.18)',
  },
  aurora: {
    bg: '#0a0e1a', bg2: '#101626', bg3: '#161e30',
    text: '#ffffff', dim: '#8898b8', dim2: '#3a4868',
    border: 'rgba(160,200,255,0.08)', borderHi: 'rgba(160,200,255,0.2)',
    hub: '#7dd3fc', hubGlow: 'rgba(125,211,252,0.2)',
  },
  monochrome: {
    bg: '#0a0a0a', bg2: '#121212', bg3: '#1a1a1a',
    text: '#ffffff', dim: '#888', dim2: '#444',
    border: 'rgba(255,255,255,0.08)', borderHi: 'rgba(255,255,255,0.2)',
    hub: '#ffffff', hubGlow: 'rgba(255,255,255,0.15)',
  },
};

const c2Style = {
  font: '"Space Grotesk", "Inter Tight", -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  serif: '"Fraunces", "Newsreader", Georgia, serif',
};

const C2_DEFAULTS = { palette: 'ember', motion: true, starDensity: 1, showLabels: true };

type Tweaks = typeof C2_DEFAULTS;
type Palette = Record<string, string>;

// ─── Data context ─────────────────────────────────────────────────────────────
const NylusDataCtx = createContext<NylusData | null>(null);
function useNylusData(): NylusData {
  const ctx = useContext(NylusDataCtx);
  if (!ctx) throw new Error('NylusData context missing');
  return ctx;
}

// ─── useTime hook ─────────────────────────────────────────────────────────────
function useTime(active = true): number {
  const [t, setT] = uS(0);
  uE(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => { setT((now - start) / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return t;
}

// ─── STARFIELD ────────────────────────────────────────────────────────────────
function C2Starfield({ P, density = 1, motion = true }: { P: Palette; density?: number; motion?: boolean }) {
  const stars = uM(() => {
    const n = Math.floor(80 * density);
    return Array.from({ length: n }).map((_, i) => ({
      x: (i * 137.508) % 100,
      y: (i * 79.123) % 100,
      r: 0.4 + (i % 5) * 0.24,
      ph: (i * 1.618) % (Math.PI * 2),
      sp: 0.5 + (i % 3) * 0.5,
    }));
  }, [density]);
  const t = useTime(motion);
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} preserveAspectRatio="none" viewBox="0 0 100 100">
      {stars.map((s, i) => {
        const a = motion ? 0.2 + (Math.sin(t * s.sp + s.ph) + 1) * 0.3 : 0.4;
        return <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.18} fill="white" opacity={a} />;
      })}
    </svg>
  );
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function C2Logo({ P }: { P: Palette }) {
  const t = useTime(true);
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="2.5" fill={P.hub} />
      {[0,1,2,3,4].map(i => {
        const a = (i / 5) * Math.PI * 2 + t * 0.3;
        const x = 12 + Math.cos(a) * 8;
        const y = 12 + Math.sin(a) * 8;
        const colors = ['#a78bfa','#5fc9a8','#ef5a6f','#7c8df0','#e8b86a'];
        return <circle key={i} cx={x} cy={y} r="1.2" fill={colors[i]} />;
      })}
    </svg>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
const C2_HEADER_STYLES = `
  @keyframes c2BarAnim {
    0%,100% { height: 3px; opacity: 0.4; }
    50%      { height: 10px; opacity: 1; }
  }
  .c2-nav-item {
    position: relative; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 5px;
    padding: 0 18px; cursor: pointer; height: 100%;
    border-right: 1px solid rgba(255,255,255,0.07);
    overflow: hidden; background: transparent; border-top: none;
    border-bottom: none; border-left: none;
    transition: background 0.2s;
  }
  .c2-nav-item:hover { background: rgba(255,255,255,0.025); }
  .c2-nav-item.c2-active { background: rgba(96,165,250,0.04); }
  .c2-nav-item.c2-active::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; background: #60a5fa;
    box-shadow: 0 0 8px rgba(96,165,250,0.5);
  }
  .c2-nav-ghost {
    position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
    font-family: 'Fraunces', Georgia, serif; font-size: 52px; font-style: italic;
    color: #eae6f5; opacity: 0.03; font-weight: 600; pointer-events: none;
    user-select: none; line-height: 1;
  }
  .c2-nav-lbl {
    font-family: 'Fraunces', Georgia, serif; font-size: 17px; font-style: italic;
    font-weight: 300; color: #8a849a; letter-spacing: -0.01em;
    position: relative; z-index: 1; transition: color 0.2s; white-space: nowrap;
  }
  .c2-nav-item:hover .c2-nav-lbl { color: #cdc8dd; }
  .c2-nav-item.c2-active .c2-nav-lbl { color: #eae6f5; font-weight: 500; }
  .c2-nav-bars {
    display: flex; align-items: flex-end; gap: 2px; height: 10px;
    opacity: 0; transition: opacity 0.25s; position: relative; z-index: 1;
  }
  .c2-nav-item.c2-active .c2-nav-bars { opacity: 1; }
  .c2-nav-bars span { width: 3px; background: #60a5fa; border-radius: 1px; display: inline-block; }
  .c2-nav-bars span:nth-child(1) { animation: c2BarAnim 0.9s ease-in-out infinite; }
  .c2-nav-bars span:nth-child(2) { animation: c2BarAnim 0.9s ease-in-out infinite 0.15s; }
  .c2-nav-bars span:nth-child(3) { animation: c2BarAnim 0.9s ease-in-out infinite 0.3s; }
  .c2-nav-bars span:nth-child(4) { animation: c2BarAnim 0.9s ease-in-out infinite 0.1s; }
  .c2-nav-bars span:nth-child(5) { animation: c2BarAnim 0.9s ease-in-out infinite 0.25s; }
`;

function C2Header({ P, page, setPage, tweaks, onCyclePalette }: {
  P: Palette; page: string; setPage: (p: string) => void;
  tweaks: Tweaks; onCyclePalette: () => void;
}) {
  const C2_DATA = useNylusData();
  const router = useRouter();
  const items: { n: string; idx: string; route?: string }[] = [
    { n: 'Dashboard', idx: '01' },
    { n: 'Domains',   idx: '02' },
    { n: 'Hubs',      idx: '03', route: '/hubs' },
    { n: 'Essays',    idx: '04', route: '/essays' },
    { n: 'Workshop',  idx: '05' },
    { n: 'Collisions',idx: '06', route: '/collisions' },
    { n: 'Sparks',    idx: '07', route: '/sparks' },
  ];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: C2_HEADER_STYLES }} />
      <div style={{ display: 'flex', alignItems: 'stretch', height: 80, position: 'relative', zIndex: 2, background: P.bg2, borderBottom: `1px solid ${P.border}` }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', borderRight: `1px solid ${P.border}`, flexShrink: 0 }}>
          <C2Logo P={P} />
          <span style={{ fontFamily: c2Style.serif, fontStyle: 'italic', fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em', color: P.text }}>Nylus</span>
          <span style={{ fontFamily: c2Style.mono, fontSize: 8, color: P.dim2, letterSpacing: '0.18em', textTransform: 'uppercase', alignSelf: 'flex-end', marginBottom: 16 }}>constellation</span>
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' as const }}>
          {items.map(({ n, idx, route }) => (
            <button
              key={n}
              className={`c2-nav-item${n.toLowerCase() === page.toLowerCase() ? ' c2-active' : ''}`}
              onClick={() => route ? router.push(route) : setPage(n.toLowerCase())}
            >
              <span className="c2-nav-ghost">{idx}</span>
              <span className="c2-nav-lbl">{n}</span>
              <div className="c2-nav-bars">
                <span /><span /><span /><span /><span />
              </div>
            </button>
          ))}
        </div>

        {/* Right */}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderLeft: `1px solid ${P.border}`, flexShrink: 0 }}>
          <button onClick={onCyclePalette} style={{ background: 'transparent', border: 'none', color: P.dim, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: c2Style.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6 }}>
            {tweaks.palette}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontFamily: c2Style.serif, fontStyle: 'italic', fontSize: 20, color: P.text, fontWeight: 400, lineHeight: 1 }}>
              {C2_DATA.STATS.concepts.toLocaleString()}
            </span>
            <span style={{ fontFamily: c2Style.mono, fontSize: 8, color: '#60a5fa', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {C2_DATA.STATS.seeds} ripe
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── LIVE TICKER ──────────────────────────────────────────────────────────────
type TickerItem = { t: string; c: string; txt: string; sub: string; link: string; uid: number };
function C2LiveTicker({ P, setPage, setOpenConcept }: {
  P: Palette; setPage: (p: string) => void; setOpenConcept: (c: NylusConcept) => void;
}) {
  const C2_DATA = useNylusData();
  const router = useRouter();
  const [items, setItems] = uS<TickerItem[]>([]);
  const [newestUid, setNewestUid] = uS(-1);

  uE(() => {
    const pool: TickerItem[] = [
      ...C2_DATA.SPARKS.slice(0, 10).map((s, i) => {
        const d = C2_DATA.DOMAINS.find(x => x.id === s.domain);
        return { t: 'spark', c: d?.color ?? '#e8b86a', txt: s.text, sub: '', link: `/spark/${s.id}`, uid: i };
      }),
      ...C2_DATA.COLLISIONS.slice(0, 10).map((c, i) => ({
        t: 'collision', c: '#a78bfa', txt: `${c.a} × ${c.b}`, sub: '', link: `/collision/${c.id}`, uid: 100 + i,
      })),
      ...C2_DATA.CONCEPTS.slice(0, 10).map((c, i) => {
        const d = C2_DATA.DOMAINS.find(x => x.id === c.domain);
        return { t: 'concept', c: d?.color ?? '#94a3b8', txt: c.title, sub: '', link: `/concept/${c.id}`, uid: 200 + i };
      }),
    ];
    const initial = pool.slice(0, 4).map((x, i) => ({ ...x, sub: i === 0 ? 'just now' : `${i * 8}m ago` }));
    setItems(initial);
    let uid = 200;
    const iv = setInterval(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      uid++;
      const fresh: TickerItem = { ...pick, sub: 'just now', uid };
      setNewestUid(uid);
      setItems(prev => [fresh, ...prev.slice(0, 3).map(x => ({ ...x, sub: x.sub === 'just now' ? '5m ago' : x.sub }))]);
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      {items.map((row, i) => (
        <div key={row.uid}
          onClick={() => router.push(row.link)}
          style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: `1px solid ${P.border}`,
            cursor: 'pointer', transition: 'opacity 0.2s',
            animation: row.uid === newestUid ? 'c2fadein 0.7s ease' : 'none' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <span style={{ width: 7, height: 7, background: row.c, borderRadius: '50%', marginTop: 6, flexShrink: 0,
            boxShadow: i === 0 ? `0 0 10px ${row.c}` : 'none' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.01em' }}>{row.txt}</div>
            <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim2, marginTop: 3 }}>{row.t} · {row.sub}</div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes c2fadein {
          from { opacity: 0; transform: translateY(-6px) }
          to   { opacity: 1; transform: none }
        }
      `}</style>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function C2Dashboard({ P, tweaks, setPage, setOpenEssay, setOpenConcept, zoomedDomain, setZoomedDomain }: {
  P: Palette; tweaks: Tweaks; setPage: (p: string) => void;
  setOpenEssay: (e: NylusEssay) => void; setOpenConcept: (c: NylusConcept) => void;
  zoomedDomain: NylusDomain | null; setZoomedDomain: (d: NylusDomain | null) => void;
}) {
  const C2_DATA = useNylusData();
  const router = useRouter();
  const [hover, setHover] = uS<string | null>(null);
  const t = useTime(tweaks.motion);
  const cx = 320, cy = 320, R = 220;

  const domains = uM(() => C2_DATA.DOMAINS.map((d, i) => ({
    ...d,
    baseAngle: (i / C2_DATA.DOMAINS.length) * Math.PI * 2 - Math.PI / 2,
    orbitR: R * 0.75,
    radius: 9 + Math.min(d.concepts, 200) / 50,
    speed: 0.042,
  })), [C2_DATA.DOMAINS]);

  const positioned = domains.map(d => {
    const angle = d.baseAngle + (tweaks.motion ? t * d.speed * 0.3 : 0);
    return { ...d, x: cx + Math.cos(angle) * d.orbitR, y: cy + Math.sin(angle) * d.orbitR, angle };
  });

  const todaySeed = (() => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); })();
  const codIdx = C2_DATA.CONCEPTS.length ? Math.abs(((todaySeed >> 16) ^ todaySeed) * 0x45d9f3b >> 16) % C2_DATA.CONCEPTS.length : 0;
  const cod = C2_DATA.CONCEPTS[codIdx];
  const codDom = C2_DATA.DOMAINS.find(d => d.id === cod?.domain) ?? C2_DATA.DOMAINS[0];

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 440px', minHeight: 0 }}>
      {/* MAP */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 760 660" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={P.hubGlow} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            {C2_DATA.DOMAINS.map(d => (
              <radialGradient key={d.id} id={`g-${d.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={d.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={d.color} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>
          <circle cx={cx} cy={cy} r={R + 100} fill="url(#hubGlow)" />
          <circle cx={cx} cy={cy} r={R * 0.75} fill="none" stroke={P.border} strokeDasharray="2 6" opacity="0.6" />
          {positioned.map(d => (
            <line key={'l'+d.id} x1={cx} y1={cy} x2={d.x} y2={d.y}
              stroke={hover === d.id ? d.color : 'rgba(255,255,255,0.06)'}
              strokeWidth={hover === d.id ? 1.5 : 0.5}
              style={{ transition: 'stroke 0.2s' }} />
          ))}
          {/* collision arcs removed — hub-and-spoke topology: all lines connect to VAULT center (lines 267-270) */}
          <circle cx={cx} cy={cy} r={6} fill={P.hub} />
          <circle cx={cx} cy={cy} r={14} fill="none" stroke={P.hub} strokeOpacity="0.4" />
          {tweaks.motion && (
            <circle cx={cx} cy={cy} r={14 + (Math.sin(t * 2) + 1) * 4} fill="none" stroke={P.hub} strokeOpacity={0.3 - (Math.sin(t * 2) + 1) * 0.1} />
          )}
          <text x={cx} y={cy + 36} textAnchor="middle" fill={P.dim} fontSize="9" fontFamily={c2Style.mono} letterSpacing="0.18em">VAULT</text>
          {positioned.map(d => {
            const isHover = hover === d.id;
            return (
              <g key={d.id}
                onMouseEnter={() => setHover(d.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => { const orig = C2_DATA.DOMAINS.find(x => x.id === d.id); router.push(`/hubs?domain=${orig?.key ?? d.id}`); }}
                style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}>
                <circle cx={d.x} cy={d.y} r={Math.min(d.radius * 2.5, 18)} fill={`url(#g-${d.id})`} opacity={isHover ? 1 : 0.7} />
                <circle cx={d.x} cy={d.y} r={d.radius + 4} fill={d.color} opacity={isHover ? 0.4 : 0.2} />
                <circle cx={d.x} cy={d.y} r={d.radius} fill={d.color} />
                {tweaks.showLabels && (
                  <>
                    <text x={d.x} y={d.y - d.radius - 10} textAnchor="middle" fill={P.text} fontSize="12" fontFamily={c2Style.font} fontWeight="500">{d.name}</text>
                    <text x={d.x} y={d.y - d.radius - 22} textAnchor="middle" fill={d.color} fontSize="9" fontFamily={c2Style.mono} letterSpacing="0.1em" opacity="0.7">{d.concepts} ★</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
        <div style={{ position: 'absolute', top: 18, left: 24, fontFamily: c2Style.mono,
          fontSize: 10, color: P.dim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          ⊹ live · {tweaks.motion ? 'orbiting' : 'paused'} · click a star to enter
        </div>
        {hover && (() => {
          const d = C2_DATA.DOMAINS.find(x => x.id === hover);
          if (!d) return null;
          return (
            <div style={{ position: 'absolute', bottom: 24, left: 24, background: P.bg2,
              border: `1px solid ${d.color}`, borderRadius: 10, padding: '14px 18px', maxWidth: 280, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, background: d.color, borderRadius: '50%' }} />
                <span style={{ fontWeight: 600 }}>{d.name}</span>
                <span style={{ marginLeft: 'auto', fontFamily: c2Style.mono, fontSize: 10, color: P.dim }}>{d.concepts} ★ · {d.collisions} ×</span>
              </div>
              <div style={{ color: P.dim, fontSize: 11, lineHeight: 1.5 }}>{d.desc}</div>
              <div style={{ fontSize: 10, color: P.dim2, marginTop: 8, fontFamily: c2Style.mono }}>click to explore →</div>
            </div>
          );
        })()}
      </div>

      {/* SIDE PANEL */}
      <div style={{ borderLeft: `1px solid ${P.border}`, padding: '28px 32px', overflow: 'auto', background: 'rgba(0,0,0,0.25)' }}>
        <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>◐ tonight</div>
        <h1 style={{ fontFamily: c2Style.serif, fontSize: 36, fontWeight: 400, lineHeight: 1.05, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
          A map of <em>where</em><br/>the writing<br/>is going.
        </h1>
        <div style={{ color: P.dim, fontSize: 13, lineHeight: 1.55, marginBottom: 24 }}>
          {C2_DATA.DOMAINS.length} domains in mutual orbit. {C2_DATA.STATS.collisions.toLocaleString()} crossings drawn,{' '}
          <span style={{ color: P.hub }}>{C2_DATA.STATS.seeds} seeds ripe</span>.
        </div>
        {cod && (
          <div onClick={() => router.push(`/concept/${cod.id}`)} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 10, padding: '18px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: `radial-gradient(${codDom.color}, transparent 70%)`, opacity: 0.3 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, position: 'relative' }}>
              <span style={{ width: 6, height: 6, background: codDom.color, borderRadius: '50%' }} />
              <span style={{ fontFamily: c2Style.mono, fontSize: 9, color: codDom.color, letterSpacing: '0.18em', textTransform: 'uppercase' }}>star of the day</span>
            </div>
            <div style={{ fontFamily: c2Style.serif, fontSize: 21, lineHeight: 1.2, marginBottom: 12 }}>{cod.title}</div>
            <div style={{ display: 'flex', gap: 14, fontFamily: c2Style.mono, fontSize: 10, color: P.dim }}>
              <span>{cod.sources} sources</span>
            </div>
          </div>
        )}
        <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>⚡ live activity</div>
        <C2LiveTicker P={P} setPage={setPage} setOpenConcept={setOpenConcept} />
      </div>
    </div>
  );
}

// ─── GALAXY ───────────────────────────────────────────────────────────────────
function C2Galaxy({ P, tweaks, setOpenConcept }: { P: Palette; tweaks: Tweaks; setOpenConcept: (c: NylusConcept) => void }) {
  const C2_DATA = useNylusData();
  const [view, setView] = uS({ x: 0, y: 0, scale: 1 });
  const [drag, setDrag] = uS<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const t = useTime(tweaks.motion);

  const stars = uM(() => {
    const out: Array<{ id: string; x: number; y: number; r: number; color: string; domain: typeof C2_DATA.DOMAINS[0]; ph: number; concept: NylusConcept }> = [];
    C2_DATA.DOMAINS.forEach((d, di) => {
      const center = {
        x: 400 + Math.cos((di / 8) * Math.PI * 2) * 320,
        y: 350 + Math.sin((di / 8) * Math.PI * 2) * 280,
      };
      const n = Math.min(Math.ceil(d.concepts / 18), 30);
      for (let i = 0; i < n; i++) {
        const seed = di * 31 + i * 17;
        const a = (seed * 2.399) % (Math.PI * 2);
        const r = ((seed * 0.618) % 1) * 140 * Math.pow((seed * 0.382) % 1 + 0.1, 0.5);
        out.push({
          id: `${d.id}-${i}`,
          x: center.x + Math.cos(a) * r,
          y: center.y + Math.sin(a) * r,
          r: 0.6 + (seed % 5) * 0.24,
          color: d.color,
          domain: d,
          ph: (seed * 1.618) % (Math.PI * 2),
          concept: C2_DATA.CONCEPTS[(di * 3 + i) % C2_DATA.CONCEPTS.length],
        });
      }
    });
    return out;
  }, [C2_DATA.DOMAINS]);

  const onDown = (e: React.MouseEvent) => setDrag({ x: e.clientX, y: e.clientY, vx: view.x, vy: view.y });
  const onMove = (e: React.MouseEvent) => { if (drag) setView(v => ({ ...v, x: drag.vx + (e.clientX - drag.x), y: drag.vy + (e.clientY - drag.y) })); };
  const onUp = () => setDrag(null);

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
      <svg width="100%" height="100%" viewBox="0 0 800 700" style={{ display: 'block', cursor: drag ? 'grabbing' : 'grab' }}>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {C2_DATA.DOMAINS.map((d, di) => {
            const cx2 = 400 + Math.cos((di / 8) * Math.PI * 2) * 320;
            const cy2 = 350 + Math.sin((di / 8) * Math.PI * 2) * 280;
            return (
              <g key={d.id}>
                <defs>
                  <radialGradient id={`gal-${d.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={d.color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={d.color} stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx={cx2} cy={cy2} r={160} fill={`url(#gal-${d.id})`} />
                <text x={cx2} y={cy2 - 150} textAnchor="middle" fill={d.color} fontSize="11" fontFamily={c2Style.mono} letterSpacing="0.2em" opacity="0.7">{d.name.toUpperCase()}</text>
              </g>
            );
          })}
          {stars.map(s => {
            const tw = tweaks.motion ? 0.5 + (Math.sin(t * 1.5 + s.ph) + 1) * 0.25 : 0.8;
            return (
              <g key={s.id} onClick={(e) => { e.stopPropagation(); setOpenConcept(s.concept); }} style={{ cursor: 'pointer' }}>
                <circle cx={s.x} cy={s.y} r={s.r * 2.5} fill={s.color} opacity={tw * 0.2} />
                <circle cx={s.x} cy={s.y} r={s.r} fill={s.color} opacity={tw} />
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ position: 'absolute', top: 18, left: 24, fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        ⊹ galaxy view · {stars.length} stars · drag to pan · click any star
      </div>
      <div style={{ position: 'absolute', bottom: 24, right: 24, background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 8, padding: 6, display: 'flex', gap: 4 }}>
        {[['−', () => setView(v => ({ ...v, scale: Math.max(0.4, v.scale - 0.2) }))],
          ['◉', () => setView({ x: 0, y: 0, scale: 1 })],
          ['+', () => setView(v => ({ ...v, scale: Math.min(3, v.scale + 0.2) }))]].map(([l, f], i) => (
          <button key={i} onClick={f as () => void} style={{ background: 'transparent', border: 'none', color: P.text, width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontFamily: c2Style.mono, fontSize: 14 }}>{l as string}</button>
        ))}
      </div>
    </div>
  );
}

// ─── ORBIT MINI SVG ───────────────────────────────────────────────────────────
function C2Orbit({ color, size, dots }: { color: string; size: number; dots: number }) {
  const r = size / 2 - 4, cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.12)" />
      <circle cx={cx} cy={cy} r={3} fill={color} />
      {Array.from({ length: dots }).map((_, i) => {
        const a = (i / dots) * Math.PI * 2;
        return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={1.5} fill={color} opacity={0.7} />;
      })}
    </svg>
  );
}

// ─── DOMAINS ─────────────────────────────────────────────────────────────────
function C2Domains({ P, setZoomedDomain }: { P: Palette; setZoomedDomain: (d: NylusDomain) => void }) {
  const C2_DATA = useNylusData();
  const router = useRouter();
  const [hovered, setHovered] = uS<string | null>(null);

  return (
    <div style={{ flex: 1, padding: '48px 64px 80px', overflow: 'auto' }}>
      {/* Header */}
      <div style={{
        fontFamily: c2Style.mono, fontSize: 9, color: P.dim,
        letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 16,
      }}>⊹ Domains</div>
      <h1 style={{
        fontFamily: c2Style.serif, fontSize: 64, fontWeight: 400,
        margin: '0 0 8px', letterSpacing: '-0.03em', lineHeight: 1.05,
        color: P.text,
      }}>The eight <em>orbits</em>.</h1>
      <p style={{
        fontFamily: c2Style.font, fontSize: 14, color: P.dim,
        margin: '0 0 56px', lineHeight: 1.6, maxWidth: 420,
      }}>
        Eight domains, one vault. Each orbit holds its own logic — click to explore.
      </p>

      {/* 3-column display grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {C2_DATA.DOMAINS.map((d, i) => {
          const isHovered = hovered === d.id;
          const num = String(i + 1).padStart(2, '0');
          return (
            <div
              key={d.id}
              onClick={() => router.push(`/hubs?domain=${d.key}`)}
              onMouseEnter={() => setHovered(d.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isHovered
                  ? `color-mix(in srgb, ${d.color} 5%, ${P.bg2})`
                  : P.bg2,
                border: `1px solid ${isHovered ? d.color : P.border}`,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: '32px 28px 28px',
                transition: 'background 0.25s, border-color 0.25s',
                minHeight: 200,
              }}
            >
              {/* Ghost number watermark */}
              <div style={{
                position: 'absolute',
                bottom: -10,
                right: 8,
                fontFamily: c2Style.serif,
                fontSize: 96,
                fontWeight: 700,
                fontStyle: 'italic',
                color: d.color,
                opacity: isHovered ? 0.12 : 0.07,
                lineHeight: 1,
                userSelect: 'none',
                pointerEvents: 'none',
                transition: 'opacity 0.25s',
                letterSpacing: '-0.04em',
              }}>{num}</div>

              {/* Colored dot + orbit label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              }}>
                <div style={{
                  width: 10, height: 10,
                  borderRadius: '50%',
                  background: d.color,
                  boxShadow: isHovered ? `0 0 12px ${d.color}` : 'none',
                  flexShrink: 0,
                  transition: 'box-shadow 0.25s',
                }} />
                <span style={{
                  fontFamily: c2Style.mono,
                  fontSize: 9,
                  color: d.color,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  opacity: 0.75,
                }}>orbit {num}</span>
              </div>

              {/* Domain name */}
              <div style={{
                fontFamily: c2Style.serif,
                fontSize: 26,
                fontWeight: 500,
                fontStyle: 'italic',
                lineHeight: 1.1,
                color: isHovered ? d.color : P.text,
                marginBottom: 12,
                transition: 'color 0.2s',
                letterSpacing: '-0.01em',
              }}>{d.name}</div>

              {/* Description */}
              <div style={{
                fontFamily: c2Style.font,
                fontSize: 12,
                color: P.dim,
                lineHeight: 1.6,
                marginBottom: 22,
                position: 'relative',
              }}>{d.desc}</div>

              {/* Stats row */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 24,
                position: 'relative',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{
                    fontFamily: c2Style.serif,
                    fontSize: 28,
                    fontWeight: 400,
                    color: d.color,
                    lineHeight: 1,
                  }}>{d.concepts}</span>
                  <span style={{
                    fontFamily: c2Style.mono,
                    fontSize: 8,
                    color: P.dim,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  }}>concepts</span>
                </div>
                {d.collisions > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{
                      fontFamily: c2Style.serif,
                      fontSize: 20,
                      fontWeight: 400,
                      color: P.dim,
                      lineHeight: 1,
                    }}>{d.collisions}</span>
                    <span style={{
                      fontFamily: c2Style.mono,
                      fontSize: 8,
                      color: P.dim,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                    }}>collisions</span>
                  </div>
                )}
                {d.sparks > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{
                      fontFamily: c2Style.serif,
                      fontSize: 20,
                      fontWeight: 400,
                      color: P.dim,
                      lineHeight: 1,
                    }}>{d.sparks}</span>
                    <span style={{
                      fontFamily: c2Style.mono,
                      fontSize: 8,
                      color: P.dim,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                    }}>sparks</span>
                  </div>
                )}
              </div>

              {/* Hover arrow */}
              <div style={{
                position: 'absolute',
                top: 44,
                right: 40,
                fontFamily: c2Style.mono,
                fontSize: 10,
                color: d.color,
                opacity: isHovered ? 0.7 : 0,
                transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                transition: 'opacity 0.2s, transform 0.2s',
                letterSpacing: '0.1em',
              }}>→</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ESSAYS ───────────────────────────────────────────────────────────────────
function C2Essays({ P, setOpenEssay }: { P: Palette; setOpenEssay: (e: NylusEssay) => void }) {
  const C2_DATA = useNylusData();
  const [q, setQ] = uS('');
  const filtered = C2_DATA.ESSAYS.filter(e => e.title.toLowerCase().includes(q.toLowerCase()) || e.excerpt.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ flex: 1, padding: '40px 56px 60px', overflow: 'auto', maxWidth: 980, margin: '0 auto', width: '100%' }}>
      <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>⊹ Essays</div>
      <h1 style={{ fontFamily: c2Style.serif, fontSize: 44, fontWeight: 400, margin: '0 0 24px', letterSpacing: '-0.02em' }}>What <em>fixed</em> in writing.</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search the night sky…"
        style={{ width: '100%', background: P.bg2, border: `1px solid ${P.border}`, color: P.text, padding: '12px 18px', fontFamily: c2Style.font, fontSize: 14, outline: 'none', borderRadius: 10, marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {filtered.map(e => {
          const dom = C2_DATA.DOMAINS.find(d => e.tags.includes(d.name)) ?? C2_DATA.DOMAINS[0];
          return (
            <div key={e.id} onClick={() => setOpenEssay(e)} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 2, background: dom.color }} />
              <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: dom.color, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>● {dom.name}</div>
              <div style={{ fontFamily: c2Style.serif, fontSize: 17, lineHeight: 1.25, marginBottom: 8 }}>{e.title}</div>
              <div style={{ color: P.dim, fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>{e.excerpt.slice(0, 130)}…</div>
              <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim2, letterSpacing: '0.1em' }}>{e.date} · {e.mins} min</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── COLLISION ARC (self-drawing SVG ribbon — arcs around sphere, behind text) ─
function C2CollisionArc({ dA, dB, active }: { dA: NylusDomain; dB: NylusDomain; active: boolean }) {
  const len = 620;
  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        opacity: active ? 1 : 0.1, transition: 'opacity 0.6s',
        pointerEvents: 'none', zIndex: 0,
      }}
      preserveAspectRatio="none" viewBox="0 0 800 110">
      <defs>
        <linearGradient id={`grad-${dA.id}-${dB.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={dA.color} stopOpacity="0.5" />
          <stop offset="48%" stopColor={dA.color} stopOpacity="0.15" />
          <stop offset="52%" stopColor={dB.color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={dB.color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* arc sweeps above the sphere (cy=55 → dip to 20 at center → back to 55) */}
      <path
        d="M 40 55 C 180 -10, 370 90, 400 90 C 430 90, 620 -10, 760 55"
        fill="none" stroke={`url(#grad-${dA.id}-${dB.id})`} strokeWidth="1.6"
        strokeDasharray={len} strokeDashoffset={active ? 0 : len}
        style={{ transition: 'stroke-dashoffset 1.4s ease-out' }}
      />
      {/* pulsing ring around sphere origin point */}
      {active && (
        <circle cx="400" cy="90" r="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
          <animate attributeName="r" from="6" to="22" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// ─── COLLISIONS ───────────────────────────────────────────────────────────────
function C2Collisions({ P, tweaks }: { P: Palette; tweaks: Tweaks }) {
  const C2_DATA = useNylusData();
  const router = useRouter();
  const [active, setActive] = uS(0);
  uE(() => {
    if (!tweaks.motion) return;
    const iv = setInterval(() => setActive(a => (a + 1) % C2_DATA.COLLISIONS.length), 4500);
    return () => clearInterval(iv);
  }, [tweaks.motion, C2_DATA.COLLISIONS.length]);

  return (
    <div style={{ flex: 1, padding: '40px 56px 60px', overflow: 'auto', maxWidth: 980, margin: '0 auto', width: '100%' }}>
      <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>× Collisions</div>
      <h1 style={{ fontFamily: c2Style.serif, fontSize: 44, fontWeight: 400, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Where the <em>arcs</em> cross.</h1>
      {C2_DATA.COLLISIONS.map((c, i) => {
        const dA = C2_DATA.DOMAINS.find(x => x.id === c.domains[0]) ?? C2_DATA.DOMAINS[0];
        const dB = C2_DATA.DOMAINS.find(x => x.id === c.domains[1]) ?? C2_DATA.DOMAINS[1];
        const isActive = active === i;
        return (
          <div key={c.id} style={{ background: P.bg2, border: `1px solid ${isActive ? P.borderHi : P.border}`, borderRadius: 12, padding: '22px 22px 20px', marginBottom: 14, position: 'relative', overflow: 'hidden', transition: 'border 0.4s' }}>
            {/* Arc renders at z:0 — behind everything */}
            <C2CollisionArc dA={dA} dB={dB} active={isActive && tweaks.motion} />
            {/* Title row — z:1, always above arc */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 18, marginBottom: 14, position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: c2Style.serif, fontSize: 19, textAlign: 'right', lineHeight: 1.2 }}>{c.a}</div>
              {/* Sphere — click navigates to collision page */}
              <div
                onClick={() => router.push(`/collision/${c.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${dA.color}, ${dB.color})`,
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  boxShadow: isActive ? `0 0 28px color-mix(in srgb, ${dA.color} 60%, ${dB.color})` : 'none',
                  transition: 'box-shadow 0.4s, transform 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                title={`Open collision: ${c.a} × ${c.b}`}
              >×</div>
              <div style={{ fontFamily: c2Style.serif, fontSize: 19, lineHeight: 1.2 }}>{c.b}</div>
            </div>
            {/* Note — z:1, always above arc */}
            <div style={{ color: P.dim, fontSize: 13, lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center', maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>{c.note}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SPARKS ───────────────────────────────────────────────────────────────────
const SUBTYPE_META: Record<string, { label: string; color: string; glyph: string }> = {
  resonance:  { label: 'Resonance',  color: '#e8b86a', glyph: '⚡' },
  'essay-seed': { label: 'Essay Seed', color: '#5fc9a8', glyph: '✦' },
  question:   { label: 'Question',   color: '#f06292', glyph: '?' },
  speculative:{ label: 'Speculative',color: '#b794f4', glyph: '◌' },
  collision:  { label: 'Collision',  color: '#f97316', glyph: '×' },
  synthesis:  { label: 'Synthesis',  color: '#60a5fa', glyph: '⊹' },
};

function useSparkTagAnimation() {
  uE(() => {
    const id = 'nylus-spark-tag-float';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes nylusTagFloat {
        0%   { transform: translateY(0px) translateX(0px) rotate(0deg); }
        25%  { transform: translateY(-7px) translateX(3px) rotate(0.4deg); }
        50%  { transform: translateY(-3px) translateX(-4px) rotate(-0.3deg); }
        75%  { transform: translateY(-9px) translateX(2px) rotate(0.5deg); }
        100% { transform: translateY(-4px) translateX(-2px) rotate(-0.2deg); }
      }
    `;
    document.head.appendChild(s);
  }, []);
}

function C2Sparks({ P }: { P: Palette }) {
  const C2_DATA = useNylusData();
  const router = useRouter();
  useSparkTagAnimation();

  const [activeDomain, setActiveDomain] = uS<string | null>(null);
  const [activeSubtype, setActiveSubtype] = uS<string | null>(null);
  const [limit, setLimit] = uS(40);

  // Unique domains + subtypes present in the data
  const domains = uM(() => {
    const seen = new Map<string, { key: string; name: string; color: string; count: number }>();
    C2_DATA.SPARKS.forEach(s => {
      if (!seen.has(s.domainKey)) seen.set(s.domainKey, { key: s.domainKey, name: s.domainName, color: s.color, count: 0 });
      seen.get(s.domainKey)!.count++;
    });
    return [...seen.values()].sort((a, b) => b.count - a.count);
  }, [C2_DATA.SPARKS]);

  const subtypes = uM(() => {
    const seen = new Map<string, number>();
    C2_DATA.SPARKS.forEach(s => {
      const st = s.subtype || 'resonance';
      seen.set(st, (seen.get(st) ?? 0) + 1);
    });
    return [...seen.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, count, meta: SUBTYPE_META[key] ?? { label: key, color: '#8a849a', glyph: '◦' } }));
  }, [C2_DATA.SPARKS]);

  const filtered = uM(() => {
    return C2_DATA.SPARKS.filter(s => {
      if (activeDomain && s.domainKey !== activeDomain) return false;
      if (activeSubtype && (s.subtype || 'resonance') !== activeSubtype) return false;
      return true;
    });
  }, [C2_DATA.SPARKS, activeDomain, activeSubtype]);

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;

  // deterministic float params per index
  const floatStyle = (i: number): CSSProperties => ({
    animation: `nylusTagFloat ${7 + (i * 2.3) % 7}s ${-((i * 1.9) % 6)}s infinite ease-in-out`,
    display: 'inline-block',
  });

  return (
    <div style={{ flex: 1, overflow: 'auto', maxWidth: 1080, margin: '0 auto', width: '100%', padding: '40px 52px 72px' }}>
      {/* Header */}
      <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>⚡ Sparks</div>
      <h1 style={{ fontFamily: c2Style.serif, fontSize: 44, fontWeight: 400, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Live <em>ignitions</em>.</h1>
      <div style={{ fontFamily: c2Style.mono, fontSize: 11, color: P.dim, marginBottom: 36 }}>{C2_DATA.SPARKS.length} total · {filtered.length} showing</div>

      {/* ── Domain tag cloud ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim2, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>territory</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {domains.map((d, i) => {
            const isActive = activeDomain === d.key;
            return (
              <div key={d.key} style={floatStyle(i)}>
                <button
                  onClick={() => setActiveDomain(isActive ? null : d.key)}
                  style={{
                    fontFamily: c2Style.mono,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    padding: '7px 16px',
                    borderRadius: 999,
                    border: `1px solid ${isActive ? d.color : `color-mix(in srgb, ${d.color} 28%, transparent)`}`,
                    background: isActive
                      ? `color-mix(in srgb, ${d.color} 18%, ${P.bg3})`
                      : `color-mix(in srgb, ${d.color} 8%, ${P.bg2})`,
                    color: isActive ? '#fff' : d.color,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? `0 0 20px color-mix(in srgb, ${d.color} 35%, transparent)` : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ opacity: 0.7, marginRight: 6, fontSize: 8 }}>●</span>
                  {d.name}
                  <span style={{ opacity: 0.55, marginLeft: 8, fontSize: 9 }}>{d.count}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Subtype tag cloud ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim2, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>kind</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {subtypes.map(({ key, count, meta }, i) => {
            const isActive = activeSubtype === key;
            return (
              <div key={key} style={floatStyle(i + 12)}>
                <button
                  onClick={() => setActiveSubtype(isActive ? null : key)}
                  style={{
                    fontFamily: c2Style.mono,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    padding: '7px 16px',
                    borderRadius: 999,
                    border: `1px solid ${isActive ? meta.color : `color-mix(in srgb, ${meta.color} 25%, transparent)`}`,
                    background: isActive
                      ? `color-mix(in srgb, ${meta.color} 15%, ${P.bg3})`
                      : `color-mix(in srgb, ${meta.color} 6%, ${P.bg2})`,
                    color: isActive ? '#fff' : meta.color,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? `0 0 18px color-mix(in srgb, ${meta.color} 30%, transparent)` : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ marginRight: 6 }}>{meta.glyph}</span>
                  {meta.label}
                  <span style={{ opacity: 0.55, marginLeft: 8, fontSize: 9 }}>{count}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active filter bar ── */}
      {(activeDomain || activeSubtype) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 16px', background: P.bg2, borderRadius: 10, border: `1px solid ${P.border}` }}>
          <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.1em' }}>FILTERED:</span>
          {activeDomain && (
            <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: domains.find(d => d.key === activeDomain)?.color, padding: '3px 10px', background: `color-mix(in srgb, ${domains.find(d => d.key === activeDomain)?.color} 12%, transparent)`, borderRadius: 999 }}>
              {domains.find(d => d.key === activeDomain)?.name} <span onClick={() => setActiveDomain(null)} style={{ cursor: 'pointer', opacity: 0.7, marginLeft: 4 }}>×</span>
            </span>
          )}
          {activeSubtype && (
            <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: SUBTYPE_META[activeSubtype]?.color ?? P.dim, padding: '3px 10px', background: `color-mix(in srgb, ${SUBTYPE_META[activeSubtype]?.color ?? P.dim} 12%, transparent)`, borderRadius: 999 }}>
              {SUBTYPE_META[activeSubtype]?.label ?? activeSubtype} <span onClick={() => setActiveSubtype(null)} style={{ cursor: 'pointer', opacity: 0.7, marginLeft: 4 }}>×</span>
            </span>
          )}
          <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, marginLeft: 'auto' }}>{filtered.length} spark{filtered.length !== 1 ? 's' : ''}</span>
          <button onClick={() => { setActiveDomain(null); setActiveSubtype(null); }} style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim, background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}>CLEAR ALL</button>
        </div>
      )}

      {/* ── Spark grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {visible.map(s => {
          const stMeta = SUBTYPE_META[s.subtype ?? 'resonance'] ?? SUBTYPE_META.resonance;
          return (
            <div
              key={s.id}
              onClick={() => router.push(`/spark/${s.id}`)}
              style={{
                background: P.bg2,
                border: `1px solid ${P.border}`,
                borderLeft: `3px solid ${s.color}`,
                borderRadius: 12,
                padding: '22px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = `color-mix(in srgb, ${s.color} 5%, ${P.bg2})`;
                el.style.borderColor = s.color;
                el.style.boxShadow = `0 4px 24px color-mix(in srgb, ${s.color} 12%, transparent)`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = P.bg2;
                el.style.borderColor = P.border;
                el.style.boxShadow = 'none';
              }}
            >
              {/* Subtype glyph */}
              <div style={{ position: 'absolute', top: 14, right: 18, fontFamily: c2Style.mono, fontSize: 13, color: stMeta.color, opacity: 0.6 }}>{stMeta.glyph}</div>
              {/* Title */}
              <div style={{ fontFamily: c2Style.serif, fontSize: 16, lineHeight: 1.45, marginBottom: 10, paddingRight: 28, fontStyle: 'italic' }}>{s.text}</div>
              {/* Excerpt */}
              {s.excerpt && (
                <div style={{ fontSize: 12, color: P.dim, lineHeight: 1.55, marginBottom: 14 }}>{s.excerpt.slice(0, 110)}{s.excerpt.length > 110 ? '…' : ''}</div>
              )}
              {/* Footer chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: c2Style.mono, fontSize: 9, color: s.color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>● {s.domainName}</span>
                <span style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim2 }}>·</span>
                <span style={{ fontFamily: c2Style.mono, fontSize: 9, color: stMeta.color, letterSpacing: '0.08em' }}>{stMeta.glyph} {stMeta.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => setLimit(l => l + 40)}
            style={{
              fontFamily: c2Style.mono, fontSize: 11, letterSpacing: '0.15em',
              padding: '10px 28px', borderRadius: 999,
              border: `1px solid ${P.border}`, background: P.bg2, color: P.dim,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = P.borderHi; (e.currentTarget as HTMLElement).style.color = P.text; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.border; (e.currentTarget as HTMLElement).style.color = P.dim; }}
          >
            LOAD MORE · {filtered.length - limit} remaining
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TENSIONS ────────────────────────────────────────────────────────────────
function C2Tensions({ P }: { P: Palette }) {
  const C2_DATA = useNylusData();
  return (
    <div style={{ flex: 1, padding: '40px 56px 60px', overflow: 'auto', maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>⇄ Tensions</div>
      <h1 style={{ fontFamily: c2Style.serif, fontSize: 44, fontWeight: 400, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Held <em>oppositions</em>.</h1>
      {C2_DATA.TENSIONS.map(tn => {
        const d = C2_DATA.DOMAINS.find(x => x.id === tn.domain) ?? C2_DATA.DOMAINS[0];
        return (
          <div key={tn.id} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 12, padding: 24, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 24, marginBottom: 14 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: d.color, marginLeft: 'auto', marginBottom: 8, boxShadow: `0 0 16px ${d.color}` }} />
                <div style={{ fontFamily: c2Style.serif, fontSize: 24, fontStyle: 'italic' }}>{tn.a}</div>
              </div>
              <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, ${d.color}, transparent, ${d.color})` }} />
              <div>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: d.color, marginBottom: 8, boxShadow: `0 0 16px ${d.color}` }} />
                <div style={{ fontFamily: c2Style.serif, fontSize: 24, fontStyle: 'italic' }}>{tn.b}</div>
              </div>
            </div>
            <div style={{ fontFamily: c2Style.serif, fontSize: 15, color: P.dim, textAlign: 'center', lineHeight: 1.5, fontStyle: 'italic' }}>"{tn.topic.slice(0, 180)}"</div>
            <div style={{ textAlign: 'center', fontFamily: c2Style.mono, fontSize: 9, color: d.color, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 10 }}>● {d.name}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── WORKSHOP / SIGNAL BOARD ─────────────────────────────────────────────────
function C2Workshop({ P }: { P: Palette }) {
  const C2_DATA = useNylusData();
  const router = useRouter();

  const maxConcepts = uM(() => Math.max(...C2_DATA.DOMAINS.map(d => d.concepts)), [C2_DATA.DOMAINS]);

  // Subtype breakdown for spark pipeline
  const subtypeBreakdown = uM(() => {
    const counts: Record<string, number> = {};
    C2_DATA.SPARKS.forEach(s => {
      const k = s.subtype || 'resonance';
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [C2_DATA.SPARKS]);

  // Status breakdown
  const statusBreakdown = uM(() => {
    const counts: Record<string, number> = {};
    C2_DATA.SPARKS.forEach(s => {
      const k = s.status || 'raw';
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [C2_DATA.SPARKS]);

  const recentSparks = C2_DATA.SPARKS.slice(0, 10);
  const hotCollisions = C2_DATA.COLLISIONS.slice(0, 8);

  const statCards = [
    { label: 'Concepts',   value: C2_DATA.STATS.concepts.toLocaleString(),   color: '#e8b86a', glyph: '★' },
    { label: 'Sparks',     value: C2_DATA.STATS.sparks.toLocaleString(),      color: '#5fc9a8', glyph: '⚡' },
    { label: 'Collisions', value: C2_DATA.STATS.collisions.toLocaleString(),  color: '#b794f4', glyph: '×' },
    { label: 'Sources',    value: C2_DATA.STATS.sources.toLocaleString(),     color: '#60a5fa', glyph: '⊹' },
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '36px 48px 64px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>◈ Signal Board</div>
      <h1 style={{ fontFamily: c2Style.serif, fontSize: 44, fontWeight: 400, margin: '0 0 28px', letterSpacing: '-0.02em' }}>The <em>whole picture</em>.</h1>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {statCards.map(sc => (
          <div key={sc.label} style={{
            background: P.bg2,
            border: `1px solid color-mix(in srgb, ${sc.color} 20%, ${P.border})`,
            borderRadius: 14,
            padding: '22px 24px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: sc.color, opacity: 0.6, borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: sc.color, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>{sc.glyph} {sc.label}</div>
            <div style={{ fontFamily: c2Style.serif, fontSize: 38, fontWeight: 400, color: P.text, lineHeight: 1, letterSpacing: '-0.02em' }}>{sc.value}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid: 3 columns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left col: Domain density + Pipeline status */}
        <div>
          {/* Domain density */}
          <div style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
            <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>Domain Density</div>
            {C2_DATA.DOMAINS.slice(0, 8).map(d => (
              <div key={d.id} style={{ marginBottom: 12 }} onClick={() => router.push(`/hubs?domain=${d.key}`)} className="cursor-pointer">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: d.color, letterSpacing: '0.05em' }}>{d.name.length > 18 ? d.name.slice(0, 16) + '…' : d.name}</span>
                  <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim2 }}>{d.concepts}</span>
                </div>
                <div style={{ height: 4, background: P.bg3, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round((d.concepts / maxConcepts) * 100)}%`,
                    background: `linear-gradient(90deg, ${d.color}, color-mix(in srgb, ${d.color} 60%, transparent))`,
                    borderRadius: 2,
                    transition: 'width 0.8s ease-out',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline status */}
          <div style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>Spark Pipeline</div>
            {statusBreakdown.map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${P.border}` }}>
                <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.08em', textTransform: 'capitalize' }}>{status}</span>
                <span style={{ fontFamily: c2Style.mono, fontSize: 12, color: '#e8b86a' }}>{count}</span>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim2, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>By Kind</div>
              {subtypeBreakdown.slice(0, 4).map(([key, count]) => {
                const meta = SUBTYPE_META[key] ?? { label: key, color: P.dim, glyph: '◦' };
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                    <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: meta.color }}>{meta.glyph} {meta.label}</span>
                    <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim2 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center col: Recent sparks */}
        <div style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: '#5fc9a8', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>⚡ Recent Sparks</div>
          {recentSparks.map(s => {
            const stMeta = SUBTYPE_META[s.subtype ?? 'resonance'] ?? SUBTYPE_META.resonance;
            return (
              <div
                key={s.id}
                onClick={() => router.push(`/spark/${s.id}`)}
                style={{ padding: '12px 0', borderBottom: `1px solid ${P.border}`, cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '6px'; (e.currentTarget as HTMLElement).style.transition = 'padding 0.15s'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '0px'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                  <span style={{ color: s.color, fontSize: 8, marginTop: 4, flexShrink: 0 }}>●</span>
                  <span style={{ fontFamily: c2Style.serif, fontSize: 14, lineHeight: 1.4, fontStyle: 'italic' }}>{s.text}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, paddingLeft: 16 }}>
                  <span style={{ fontFamily: c2Style.mono, fontSize: 9, color: s.color, letterSpacing: '0.08em' }}>{s.domainName}</span>
                  <span style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim2 }}>·</span>
                  <span style={{ fontFamily: c2Style.mono, fontSize: 9, color: stMeta.color }}>{stMeta.glyph} {stMeta.label}</span>
                </div>
              </div>
            );
          })}
          <div
            onClick={() => {}}
            style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, textAlign: 'center', paddingTop: 14, cursor: 'pointer', letterSpacing: '0.12em' }}
          >→ all sparks</div>
        </div>

        {/* Right col: Hot collisions */}
        <div style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: '#b794f4', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>× Hot Collisions</div>
          {hotCollisions.map(c => {
            const dA = C2_DATA.DOMAINS.find(x => x.id === c.domains[0]) ?? C2_DATA.DOMAINS[0];
            const dB = C2_DATA.DOMAINS.find(x => x.id === c.domains[1]) ?? C2_DATA.DOMAINS[1];
            return (
              <div
                key={c.id}
                onClick={() => router.push(`/collision/${c.id}`)}
                style={{ padding: '12px 0', borderBottom: `1px solid ${P.border}`, cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '6px'; (e.currentTarget as HTMLElement).style.transition = 'padding 0.15s'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '0px'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: dA.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontFamily: c2Style.serif, fontSize: 13, flex: 1, lineHeight: 1.35, fontStyle: 'italic' }}>{c.a}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim2, width: 6, textAlign: 'center', flexShrink: 0 }}>×</span>
                  <span style={{ fontFamily: c2Style.serif, fontSize: 13, flex: 1, lineHeight: 1.35, fontStyle: 'italic' }}>{c.b}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: dB.color, flexShrink: 0, display: 'inline-block' }} />
                </div>
                {typeof c.pressure === 'number' && (
                  <div style={{ height: 2, background: P.bg3, borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((c.pressure / 12) * 100)}%`, background: `linear-gradient(90deg, ${dA.color}, ${dB.color})` }} />
                  </div>
                )}
              </div>
            );
          })}
          <div
            onClick={() => router.push('/collisions')}
            style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, textAlign: 'center', paddingTop: 14, cursor: 'pointer', letterSpacing: '0.12em' }}
          >→ all collisions</div>
        </div>
      </div>
    </div>
  );
}

// ─── RESEARCH ────────────────────────────────────────────────────────────────
function C2Research({ P, setOpenEssay }: { P: Palette; setOpenEssay: (e: NylusEssay) => void }) {
  const C2_DATA = useNylusData();
  return (
    <div style={{ flex: 1, padding: '40px 56px 60px', overflow: 'auto', maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>⊹ Research</div>
      <h1 style={{ fontFamily: c2Style.serif, fontSize: 44, fontWeight: 400, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Long-form <em>investigations</em>.</h1>
      {C2_DATA.ESSAYS.map(e => {
        const dom = C2_DATA.DOMAINS.find(d => e.tags.includes(d.name)) ?? C2_DATA.DOMAINS[0];
        return (
          <div key={e.id} onClick={() => setOpenEssay(e)} style={{ marginBottom: 28, padding: '20px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
            <div style={{ fontFamily: c2Style.serif, fontSize: 19, lineHeight: 1.2, marginBottom: 8 }}>{e.title}</div>
            <div style={{ color: P.dim, fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>{e.excerpt.slice(0, 200)}…</div>
            <div style={{ display: 'flex', gap: 12, fontFamily: c2Style.mono, fontSize: 10, color: P.dim2 }}>
              <span>{e.date}</span><span>·</span><span>{e.words.toLocaleString()} words</span><span>·</span><span>{e.mins} min</span>
              <span style={{ flex: 1 }} />
              {e.tags.map(tg => <span key={tg} style={{ color: dom.color }}>● {tg}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── READER ────────────────────────────────────────────────────────────────────────────────
function C2Reader({ P, essay, close }: { P: Palette; essay: NylusEssay; close: () => void }) {
  const C2_DATA = useNylusData();
  const [scroll, setScroll] = uS(0);
  const ref = uR<HTMLDivElement>(null);
  uE(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setScroll(el.scrollTop);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const notes = [
    { y: 60,  type: 'collision', label: '× collides with', text: C2_DATA.COLLISIONS[0] ? `${C2_DATA.COLLISIONS[0].a} × ${C2_DATA.COLLISIONS[0].b}` : 'Active tension in vault', color: '#a78bfa' },
    { y: 280, type: 'source',    label: '↳ cites',         text: `${C2_DATA.STATS.sources} sources indexed in vault`, color: P.dim },
    { y: 500, type: 'spark',     label: '⚡ sparked',       text: C2_DATA.SPARKS[0]?.text ?? 'Spark waiting in the vault.', color: '#e8b86a' },
    { y: 720, type: 'tension',   label: '⇄ tension',       text: C2_DATA.TENSIONS[0] ? `${C2_DATA.TENSIONS[0].a} ⇄ ${C2_DATA.TENSIONS[0].b}` : 'Held opposition in vault', color: '#ef5a6f' },
  ];
  const visible = notes.filter(n => scroll >= n.y - 200);
  const dom = C2_DATA.DOMAINS.find(d => essay.tags.includes(d.name)) ?? C2_DATA.DOMAINS[0];

  const paragraphs = essay.content
    ? essay.content.split(/\n\n+/).filter(p => p.trim().length > 40).slice(0, 6)
    : [essay.excerpt];

  return (
    <div onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(14,13,20,0.92)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', zIndex: 60, padding: '32px 20px', overflow: 'hidden' }}>
      <div onClick={(e) => e.stopPropagation()} ref={ref} style={{ width: '100%', maxWidth: 980, background: P.bg, border: `1px solid ${P.borderHi}`, borderRadius: 14, height: '100%', overflow: 'auto', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, background: P.bg, borderBottom: `1px solid ${P.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16, zIndex: 2 }}>
          <span style={{ width: 8, height: 8, background: dom.color, borderRadius: '50%' }} />
          <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: dom.color, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{dom.name}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.1em' }}>{essay.date} · {essay.mins} min · {essay.words.toLocaleString()} words</span>
          <button onClick={close} style={{ background: 'none', border: `1px solid ${P.border}`, color: P.dim, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: c2Style.mono, fontSize: 10 }}>esc</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, padding: '40px 48px 80px', position: 'relative' }}>
          <div style={{ fontFamily: c2Style.serif, fontSize: 17, lineHeight: 1.7, color: P.text, maxWidth: 600 }}>
            <h1 style={{ fontSize: 38, fontWeight: 400, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.02em' }}>{essay.title}</h1>
            <div style={{ fontStyle: 'italic', fontSize: 19, color: P.dim, marginBottom: 28, lineHeight: 1.55 }}>{essay.excerpt}</div>
            {paragraphs.map((p, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : '20px 0 0' }}>{p}</p>
            ))}
            <p style={{ marginTop: 20, color: P.dim }}>[ continue reading — {essay.words.toLocaleString()} words ]</p>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>⊹ as you read</div>
              {visible.length === 0 && <div style={{ fontFamily: c2Style.mono, fontSize: 11, color: P.dim2, fontStyle: 'italic' }}>scroll — connections will surface here.</div>}
              {visible.map((n, i) => (
                <div key={i} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderLeft: `2px solid ${n.color}`, padding: '10px 12px', marginBottom: 10, borderRadius: 4, animation: 'c2fadein 0.5s ease' }}>
                  <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: n.color, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>{n.label}</div>
                  <div style={{ fontFamily: c2Style.serif, fontSize: 12, lineHeight: 1.4 }}>{n.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONCEPT PAGE ─────────────────────────────────────────────────────────────────────────────
function C2ConceptPage({ P, tweaks, concept, close, setOpenEssay }: {
  P: Palette; tweaks: Tweaks; concept: NylusConcept;
  close: () => void; setOpenEssay: (e: NylusEssay) => void;
}) {
  const C2_DATA = useNylusData();
  const dom = C2_DATA.DOMAINS.find(d => d.id === concept.domain) ?? C2_DATA.DOMAINS[0];
  const t = useTime(tweaks.motion);
  const cx = 380, cy = 340;

  const rings = [
    { label: 'sources', count: concept.sources, r: 90, color: P.dim, items: Array.from({ length: Math.min(concept.sources, 8) }).map((_, i) => `Source ${i+1}`) },
    { label: 'sparks', count: C2_DATA.SPARKS.filter(s => s.domain === concept.domain).length, r: 160, color: '#e8b86a', items: C2_DATA.SPARKS.filter(s => s.domain === concept.domain).slice(0, 6) },
    { label: 'collisions', count: C2_DATA.COLLISIONS.filter(c => c.domains.includes(concept.domain)).length, r: 230, color: '#a78bfa', items: C2_DATA.COLLISIONS.filter(c => c.domains.includes(concept.domain)).slice(0, 4) },
  ];

  return (
    <div onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(14,13,20,0.92)', backdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', overflow: 'hidden' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', position: 'relative' }}>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 760 700">
            <defs>
              <radialGradient id="conceptGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={dom.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={dom.color} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={300} fill="url(#conceptGlow)" />
            {rings.map(ring => (
              <circle key={ring.label} cx={cx} cy={cy} r={ring.r} fill="none" stroke={ring.color} strokeOpacity="0.12" strokeDasharray="2 4" />
            ))}
            {rings.map((ring, ringIdx) => (
              <g key={ring.label}>
                {ring.items.map((_it, i) => {
                  const a = (i / Math.max(ring.items.length, 1)) * Math.PI * 2 + (tweaks.motion ? t * (0.04 + ringIdx * 0.02) : ringIdx * 0.3);
                  const x = cx + Math.cos(a) * ring.r;
                  const y = cy + Math.sin(a) * ring.r;
                  return (
                    <g key={i}>
                      <line x1={cx} y1={cy} x2={x} y2={y} stroke={ring.color} strokeOpacity="0.08" />
                      <circle cx={x} cy={y} r={ring.label === 'sparks' ? 4 : 3.5} fill={ring.color} opacity="0.85" />
                      <circle cx={x} cy={y} r={ring.label === 'sparks' ? 7 : 6} fill={ring.color} opacity="0.2" />
                    </g>
                  );
                })}
                <text x={cx + ring.r + 8} y={cy - 4} fill={ring.color} fontSize="9" fontFamily={c2Style.mono} letterSpacing="0.15em" opacity="0.7">
                  {ring.label.toUpperCase()} · {ring.count}
                </text>
              </g>
            ))}
            <circle cx={cx} cy={cy} r={20} fill="none" stroke={dom.color} strokeOpacity="0.3" />
            <circle cx={cx} cy={cy} r={14} fill={dom.color} opacity="0.3" />
            <circle cx={cx} cy={cy} r={8} fill={dom.color} />
            <circle cx={cx} cy={cy} r={3} fill="white" />
          </svg>
          <div style={{ position: 'absolute', top: 18, left: 24, fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>⊹ concept · concentric view</div>
          <button onClick={close} style={{ position: 'absolute', top: 18, right: 24, background: P.bg2, border: `1px solid ${P.border}`, color: P.dim, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: c2Style.mono, fontSize: 11 }}>esc · close</button>
        </div>
        <div style={{ borderLeft: `1px solid ${P.border}`, padding: '32px 36px', overflow: 'auto', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, background: dom.color, borderRadius: '50%' }} />
            <span style={{ fontFamily: c2Style.mono, fontSize: 10, color: dom.color, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{dom.name}</span>
          </div>
          <h1 style={{ fontFamily: c2Style.serif, fontSize: 30, fontWeight: 400, lineHeight: 1.15, margin: '0 0 18px', letterSpacing: '-0.01em' }}>{concept.title}</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24, padding: '16px 0', borderTop: `1px solid ${P.border}`, borderBottom: `1px solid ${P.border}` }}>
            {[['sources', concept.sources, P.dim], ['sparks', C2_DATA.SPARKS.filter(s => s.domain === concept.domain).length, '#e8b86a'], ['×', C2_DATA.COLLISIONS.filter(c => c.domains.includes(concept.domain)).length, '#a78bfa']].map(([k,v,c2]) => (
              <div key={k as string}>
                <div style={{ fontFamily: c2Style.serif, fontSize: 24, color: c2 as string }}>{v as number}</div>
                <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k as string}</div>
              </div>
            ))}
          </div>
          {concept.excerpt && <div style={{ color: P.dim, fontSize: 13, lineHeight: 1.6, marginBottom: 20, fontFamily: c2Style.serif, fontStyle: 'italic' }}>{concept.excerpt.slice(0, 300)}</div>}
          <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>↳ collisions in orbit</div>
          {C2_DATA.COLLISIONS.filter(c => c.domains.includes(concept.domain)).slice(0, 3).map(c => (
            <div key={c.id} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderLeft: '2px solid #a78bfa', padding: '10px 12px', marginBottom: 8, borderRadius: 4 }}>
              <div style={{ fontSize: 12, fontFamily: c2Style.serif, marginBottom: 4 }}>
                <span>{c.a}</span><span style={{ color: '#a78bfa', margin: '0 6px' }}>×</span><span>{c.b}</span>
              </div>
              <div style={{ fontSize: 10, color: P.dim, lineHeight: 1.4 }}>{c.note}</div>
            </div>
          ))}
          <button onClick={() => { close(); if (C2_DATA.ESSAYS[0]) setOpenEssay(C2_DATA.ESSAYS[0]); }}
            style={{ marginTop: 18, width: '100%', background: dom.color, border: 'none', color: '#000', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: c2Style.font, fontSize: 13, fontWeight: 600 }}>
            open in reader →
          </button>
        </div>
      </div>


    </div>
  );
}

// ─── MAIN CONSTELLATION V2 ────────────────────────────────────────────────────────────────────────────
interface ConstellationV2Props {
  data: NylusData;
  initialPage?: string;
}

// ─── MOBILE VIEW ─────────────────────────────────────────────────────────────────────────────
// Driven by the global MobileNav (layout.tsx) — no internal tab strip here.
// Reads data-theme for void/sepia colors; `page` prop comes from the route.
function C2Mobile({ data, page }: { data: NylusData; page: string }) {
  const router = useRouter();
  const [theme, setTheme] = uS<'void' | 'sepia'>('void');
  const [selectedHubDomain, setSelectedHubDomain] = uS<string | null>(null);

  uE(() => {
    const sync = () => {
      const t = document.documentElement.getAttribute('data-theme') as 'void' | 'sepia' | null;
      if (t === 'void' || t === 'sepia') setTheme(t);
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const isVoid = theme === 'void';
  const bg      = isVoid ? '#0e0d14'                        : '#faf6ed';
  const bg2     = isVoid ? '#15131c'                        : '#ede6d4';
  const text    = isVoid ? '#eae6f5'                        : '#1e1408';
  const dim     = isVoid ? '#8a849a'                        : '#8b7355';
  const dim2    = isVoid ? '#494456'                        : '#b8a085';
  const accent  = isVoid ? '#60a5fa'                        : '#b8905a';
  const border  = isVoid ? 'rgba(255,255,255,0.07)'         : 'rgba(139,105,20,0.15)';
  const hdrBg   = isVoid ? 'rgba(21,19,28,0.96)'            : 'rgba(237,230,212,0.96)';
  const serif   = c2Style.serif;
  const mono    = c2Style.mono;
  const sans    = c2Style.font;

  // Normalise page → display label
  const labels: Record<string, [string, string]> = {
    dashboard: ['Domains', 'knowledge map'],
    domains:   ['Domains', 'knowledge map'],
    sparks:    ['Sparks',  'generative tail'],
    essays:    ['Essays',  'the platform'],
    workshop:  ['Workshop','in progress'],
    galaxy:    ['Galaxy',  'concept map'],
    hubs:      ['Hubs',    'maps of content'],
  };
  const [pageTitle, pageSub] = labels[page] ?? ['Vault', 'nylus'];

  // ── Subtype pill colour ───────────────────────────────────────────────────
  function subtypeStyle(subtype: string): React.CSSProperties {
    if (subtype === 'resonance')   return { background: isVoid ? 'rgba(96,165,250,0.12)'  : 'rgba(184,144,90,0.14)',  color: accent };
    if (subtype === 'essay-seed')  return { background: isVoid ? 'rgba(134,239,172,0.1)'  : 'rgba(60,130,60,0.1)',    color: isVoid ? '#86efac' : '#3a8a3a' };
    if (subtype === 'question')    return { background: isVoid ? 'rgba(196,181,253,0.1)'  : 'rgba(130,90,180,0.1)',   color: isVoid ? '#c4b5fd' : '#7a4a9a' };
    return { background: isVoid ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: dim };
  }

  const itemStyle: React.CSSProperties = {
    borderBottom: `1px solid ${border}`,
    cursor: 'pointer',
  };

  return (
    <div style={{ width: '100%', height: '100dvh', overflowY: 'auto', overflowX: 'hidden', background: bg, color: text, fontFamily: sans, paddingBottom: 80 }}>

      {/* ── Sticky page header ───────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '14px 18px 12px',
        background: hdrBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: text, lineHeight: 1 }}>
          {pageTitle}
        </div>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: dim, marginTop: 3 }}>
          {pageSub}
        </div>
      </div>

      {/* ── DOMAINS ──────────────────────────────────────────────────── */}
      {(page === 'domains' || page === 'dashboard' || page === 'galaxy') && (
        <div>
          {data.DOMAINS.map(d => (
            <div key={d.id}
              onClick={() => router.push(`/hubs?domain=${d.key}`)}
              style={{ ...itemStyle, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: d.color + '18',
                border: `1px solid ${d.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, fontWeight: 600, color: text, marginBottom: 2 }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 11, color: dim, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.desc.slice(0, 70)}…
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: text }}>{d.concepts}</span>
                <span style={{ fontFamily: mono, fontSize: 9, color: dim2, letterSpacing: '0.06em' }}>concepts</span>
              </div>
            </div>
          ))}

        </div>
      )}

      {/* ── SPARKS ───────────────────────────────────────────────────── */}
      {page === 'sparks' && (
        <div>
          {data.SPARKS.slice(0, 50).map(s => (
            <div key={s.id} style={{ ...itemStyle, padding: '14px 18px' }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: accent, letterSpacing: '0.08em', marginBottom: 5 }}>
                {s.domainName}
              </div>
              <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: text, lineHeight: 1.45, marginBottom: 8 }}>
                {s.text}
              </div>
              <span style={{
                display: 'inline-block',
                fontFamily: mono, fontSize: 9,
                letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 12,
                ...subtypeStyle(s.subtype),
              }}>
                {s.subtype ?? 'spark'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── ESSAYS ─────────────────────────────────────── */}
      {(page === 'essays' || page === 'workshop' || page === 'research') && (
        <div>
          {data.ESSAYS.slice(0, 30).map(e => (
            <div key={e.id}
              onClick={() => router.push(`/essay/${e.id}`)}
              style={{ ...itemStyle, padding: '14px 18px' }}>
              <div style={{ fontFamily: mono, fontSize: 9, color: dim2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                {(e as { domain?: string }).domain ?? 'essay'}
              </div>
              <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: text, lineHeight: 1.4, marginBottom: 6 }}>
                {e.title}
              </div>
              {e.excerpt && (
                <div style={{ fontFamily: sans, fontSize: 12, color: dim, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                  {e.excerpt}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── HUBS ──────────────────────────────────────────────────────── */}
      {page === 'hubs' && (() => {
        const domainOrder = ['psychology','history','cross-domain','behavioral-mechanics','eastern-spirituality','creative-practice','ai-collaboration','african-spirituality'];
        const domainLabels: Record<string,string> = {
          'psychology': 'Psychology', 'history': 'History', 'cross-domain': 'Cross-Domain',
          'behavioral-mechanics': 'Behavioral', 'eastern-spirituality': 'Eastern',
          'creative-practice': 'Creative', 'ai-collaboration': 'AI', 'african-spirituality': 'African'
        };
        const grouped = domainOrder.map(domain => ({
          domain,
          label: domainLabels[domain] ?? domain,
          color: data.HUBS.find((h: NylusHub) => h.domain === domain)?.color ?? '#888',
          hubs: data.HUBS.filter((h: NylusHub) => h.domain === domain),
        })).filter(g => g.hubs.length > 0);

        const visibleHubs = selectedHubDomain
          ? data.HUBS.filter((h: NylusHub) => h.domain === selectedHubDomain)
          : data.HUBS;

        return (
          <div style={{ display: 'flex', height: 'calc(100dvh - 72px)', overflow: 'hidden' }}>

            {/* ── Left domain sidebar ── */}
            <div style={{
              width: 72, flexShrink: 0,
              borderRight: `1px solid ${border}`,
              overflowY: 'auto', overflowX: 'hidden',
              background: bg2,
              paddingTop: 8, paddingBottom: 80,
            }}>
              {/* All pill */}
              <button
                onClick={() => setSelectedHubDomain(null)}
                style={{
                  width: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4, padding: '10px 4px',
                  background: selectedHubDomain === null ? (isVoid ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)') : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderLeft: selectedHubDomain === null ? `2px solid ${accent}` : '2px solid transparent',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: isVoid ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: text,
                }}>✦</span>
                <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.06em', color: selectedHubDomain === null ? text : dim, textAlign: 'center', lineHeight: 1.2 }}>
                  All
                </span>
                <span style={{ fontFamily: mono, fontSize: 9, color: selectedHubDomain === null ? accent : dim2 }}>
                  {data.HUBS.length}
                </span>
              </button>

              {grouped.map(g => (
                <button
                  key={g.domain}
                  onClick={() => setSelectedHubDomain(g.domain === selectedHubDomain ? null : g.domain)}
                  style={{
                    width: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4, padding: '10px 4px',
                    background: selectedHubDomain === g.domain ? (isVoid ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)') : 'transparent',
                    border: 'none', cursor: 'pointer',
                    borderLeft: selectedHubDomain === g.domain ? `2px solid ${g.color}` : '2px solid transparent',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: g.color + '22',
                    border: `1px solid ${g.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, display: 'block' }} />
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.06em', color: selectedHubDomain === g.domain ? text : dim, textAlign: 'center', lineHeight: 1.2, padding: '0 2px' }}>
                    {g.label}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 9, color: selectedHubDomain === g.domain ? g.color : dim2 }}>
                    {g.hubs.length}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Right hub list ── */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 80 }}>
              {/* count header */}
              <div style={{
                padding: '10px 16px 8px',
                borderBottom: `1px solid ${border}`,
                position: 'sticky', top: 0, zIndex: 5,
                background: isVoid ? 'rgba(21,19,28,0.95)' : 'rgba(237,230,212,0.95)',
                backdropFilter: 'blur(10px)',
              }}>
                <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: dim2 }}>
                  {selectedHubDomain ? (domainLabels[selectedHubDomain] ?? selectedHubDomain) : 'All Domains'} · {visibleHubs.length} hubs
                </span>
              </div>

              {visibleHubs.map((h: NylusHub) => (
                <div key={h.id}
                  onClick={() => router.push(`/hub/${h.id}`)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px',
                    borderBottom: `1px solid ${border}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 3, alignSelf: 'stretch', minHeight: 36, background: h.color, borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: text, lineHeight: 1.3, marginBottom: 3 }}>
                      {h.title.replace(/ Hub$/, '').replace(/ — Map of Content$/, '')}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: dim }}>{h.covers} concepts</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 4, opacity: 0.3 }}>
                    <path d="M4 2l4 4-4 4" stroke={text} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        );
      })()}


    </div>
  );
}

// ─── MAIN CONSTELLATION V2 ──────────────────────────────────────────────────
export default function ConstellationV2({ data, initialPage }: ConstellationV2Props) {
  const [isMobile, setIsMobile] = uS(false);
  const [page, setPage] = uS(initialPage ?? 'dashboard');
  const [openEssay, setOpenEssay] = uS<NylusEssay | null>(null);
  const [zoomedDomain, setZoomedDomain] = uS<NylusDomain | null>(null);
  const [openConcept, setOpenConcept] = uS<NylusConcept | null>(null);
  const [tweaks, setTweaks] = uS<Tweaks>(C2_DEFAULTS);

  function setTweak(k: keyof Tweaks, v: unknown) {
    setTweaks(t => ({ ...t, [k]: v }));
  }

  function onCyclePalette() {
    const order = ['ember', 'aurora', 'monochrome'];
    const next = order[(order.indexOf(tweaks.palette) + 1) % order.length];
    setTweak('palette', next);
  }

  const P = C2_PALETTES[tweaks.palette] ?? C2_PALETTES.ember;

  uE(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) return <C2Mobile data={data} page={page} />;

  return (
    <NylusDataCtx.Provider value={data}>
      <div style={{ width: '100%', height: '100%', background: P.bg, color: P.text,
        fontFamily: c2Style.font, display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden' }}>
        <ShootingStars density={tweaks.starDensity} paused={!tweaks.motion} />
        <C2Header P={P} page={page} setPage={setPage} tweaks={tweaks} onCyclePalette={onCyclePalette} />
        <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative', zIndex: 1 }}>
          {page === 'dashboard'  && <C2Dashboard P={P} tweaks={tweaks} setPage={setPage} setOpenEssay={setOpenEssay} setOpenConcept={setOpenConcept} zoomedDomain={zoomedDomain} setZoomedDomain={setZoomedDomain} />}
          {page === 'galaxy'     && <C2Galaxy P={P} tweaks={tweaks} setOpenConcept={setOpenConcept} />}
          {page === 'domains'    && <C2Domains P={P} setZoomedDomain={(d) => { setPage('dashboard'); setZoomedDomain(d); }} />}
          {page === 'essays'     && <C2Essays P={P} setOpenEssay={setOpenEssay} />}
          {page === 'collisions' && <C2Collisions P={P} tweaks={tweaks} />}
          {page === 'sparks'     && <C2Sparks P={P} />}
          {page === 'tensions'   && <C2Tensions P={P} />}
          {page === 'workshop'   && <C2Workshop P={P} />}
        </div>
        {openEssay   && <C2Reader P={P} essay={openEssay} close={() => setOpenEssay(null)} />}
        {openConcept && <C2ConceptPage P={P} tweaks={tweaks} concept={openConcept} close={() => setOpenConcept(null)} setOpenEssay={setOpenEssay} />}
      </div>
    </NylusDataCtx.Provider>
  );
}
