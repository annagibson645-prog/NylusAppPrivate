"use client";
// ConstellationV2.tsx — full port of constellation-v2.jsx + constellation-views.jsx
// All window.NYLUS_DATA / window.useC2Time / window.c2Style references replaced
// with React Context + direct definitions.

import {
  useState, useMemo, useEffect, useRef,
  createContext, useContext,
  type ReactNode,
} from 'react';
import type { NylusData, NylusDomain, NylusConcept, NylusEssay } from '@/lib/adapt-vault';
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
    text: '#f0ecf5', dim: '#7a7588', dim2: '#494456',
    border: 'rgba(255,255,255,0.08)', borderHi: 'rgba(255,255,255,0.18)',
    hub: '#e8b86a', hubGlow: 'rgba(232,184,106,0.18)',
  },
  aurora: {
    bg: '#0a0e1a', bg2: '#101626', bg3: '#161e30',
    text: '#e8f0ff', dim: '#7888a8', dim2: '#3a4868',
    border: 'rgba(160,200,255,0.08)', borderHi: 'rgba(160,200,255,0.2)',
    hub: '#7dd3fc', hubGlow: 'rgba(125,211,252,0.2)',
  },
  monochrome: {
    bg: '#0a0a0a', bg2: '#121212', bg3: '#1a1a1a',
    text: '#f5f5f5', dim: '#888', dim2: '#444',
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
function C2Header({ P, page, setPage, tweaks, onCyclePalette }: {
  P: Palette; page: string; setPage: (p: string) => void;
  tweaks: Tweaks; onCyclePalette: () => void;
}) {
  const C2_DATA = useNylusData();
  const items = ['dashboard','domains','essays','workshop','collisions','sparks','tensions','research'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 28px',
      borderBottom: `1px solid ${P.border}`, gap: 24, position: 'relative', zIndex: 2,
      background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(10px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <C2Logo P={P} />
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>Nylus</div>
        <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim2, letterSpacing: '0.18em', textTransform: 'uppercase', marginLeft: 4 }}>constellation · v2</div>
      </div>
      <div style={{ display: 'flex', gap: 2, marginLeft: 12, flexWrap: 'nowrap', overflow: 'auto' }}>
        {items.map(n => {
          const active = n === page;
          return (
            <button key={n} onClick={() => setPage(n)}
              style={{ background: active ? P.bg3 : 'transparent', border: 'none', cursor: 'pointer',
                padding: '6px 11px', borderRadius: 999, color: active ? P.text : P.dim,
                fontFamily: c2Style.font, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {n}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <button onClick={onCyclePalette} style={{ background: P.bg3, border: `1px solid ${P.border}`, color: P.dim, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: c2Style.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 8 }}>
        {tweaks.palette}
      </button>
      <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.1em' }}>
        ⊹ {C2_DATA.STATS.concepts.toLocaleString()} stars · <span style={{ color: P.hub }}>{C2_DATA.STATS.seeds} ripe</span>
      </div>
    </div>
  );
}

// ─── LIVE TICKER ──────────────────────────────────────────────────────────────
function C2LiveTicker({ P, setPage, setOpenConcept }: {
  P: Palette; setPage: (p: string) => void; setOpenConcept: (c: NylusConcept) => void;
}) {
  const C2_DATA = useNylusData();
  const [items, setItems] = uS<Array<{t:string;c:string;txt:string;sub:string}>>([]);

  uE(() => {
    const pool = [
      ...C2_DATA.SPARKS.slice(0, 8).map(s => {
        const d = C2_DATA.DOMAINS.find(x => x.id === s.domain);
        return { t: 'spark', c: d?.color ?? '#e8b86a', txt: s.text };
      }),
      ...C2_DATA.COLLISIONS.slice(0, 8).map(c => ({ t: 'collision', c: '#a78bfa', txt: `${c.a} × ${c.b}` })),
    ];
    setItems(pool.slice(0, 4).map((x, i) => ({ ...x, sub: i === 0 ? 'just now' : `${i * 12}m ago` })));
    const iv = setInterval(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setItems(prev => [{ ...pick, sub: 'just now' }, ...prev.slice(0, 3).map(x => ({ ...x, sub: x.sub === 'just now' ? '2m ago' : x.sub }))]);
    }, 5500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      {items.map((row, i) => (
        <div key={`${row.txt}-${i}`} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${P.border}` }}>
          <span style={{ width: 6, height: 6, background: row.c, borderRadius: '50%', marginTop: 5, flexShrink: 0,
            boxShadow: i === 0 ? `0 0 8px ${row.c}` : 'none' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, lineHeight: 1.35 }}>{row.txt}</div>
            <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim2, marginTop: 2 }}>{row.t} · {row.sub}</div>
          </div>
        </div>
      ))}
      <style>{`@keyframes c2fadein { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: none } }`}</style>
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
  const [hover, setHover] = uS<string | null>(null);
  const t = useTime(tweaks.motion);
  const cx = 380, cy = 320, R = 220;

  const domains = uM(() => C2_DATA.DOMAINS.map((d, i) => ({
    ...d,
    baseAngle: (i / C2_DATA.DOMAINS.length) * Math.PI * 2 - Math.PI / 2,
    orbitR: R * (0.6 + (d.concepts / 800) * 0.5),
    radius: 7 + Math.sqrt(Math.max(d.concepts, 1)) * 0.55,
    speed: 0.04 + (1 / (i + 2)) * 0.12,
  })), [C2_DATA.DOMAINS]);

  const positioned = domains.map(d => {
    const angle = d.baseAngle + (tweaks.motion ? t * d.speed * 0.3 : 0);
    return { ...d, x: cx + Math.cos(angle) * d.orbitR, y: cy + Math.sin(angle) * d.orbitR, angle };
  });

  const zoomed = zoomedDomain ? positioned.find(d => d.id === zoomedDomain.id) ?? null : null;
  const subConcepts = zoomed ? C2_DATA.CONCEPTS.filter(c => c.domain === zoomed.id).slice(0, 8) : [];

  const cod = C2_DATA.CONCEPTS[0];
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
          {[0.6, 0.85, 1.1].map((m, i) => (
            <circle key={i} cx={cx} cy={cy} r={R * m} fill="none" stroke={P.border} strokeDasharray="2 5" />
          ))}
          {!zoomed && positioned.map(d => (
            <line key={'l'+d.id} x1={cx} y1={cy} x2={d.x} y2={d.y}
              stroke={hover === d.id ? d.color : 'rgba(255,255,255,0.06)'}
              strokeWidth={hover === d.id ? 1.5 : 0.5}
              style={{ transition: 'stroke 0.2s' }} />
          ))}
          {!zoomed && C2_DATA.COLLISIONS.map((c, i) => {
            const a = positioned.find(d => d.id === c.domains[0]);
            const b = positioned.find(d => d.id === c.domains[1]);
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            const dx = b.x - a.x, dy = b.y - a.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            const nx = -dy / dist, ny = dx / dist;
            const cpx = mx + nx * dist * 0.3, cpy = my + ny * dist * 0.3;
            const lit = hover && (a.id === hover || b.id === hover);
            return <path key={c.id} d={`M ${a.x} ${a.y} Q ${cpx} ${cpy} ${b.x} ${b.y}`}
              stroke={lit ? P.hub : 'rgba(232,184,106,0.18)'}
              strokeWidth={lit ? 1.4 : 0.7} fill="none"
              strokeDasharray={lit ? '0' : '3 4'}
              style={{ transition: 'stroke 0.2s' }} />;
          })}
          <circle cx={cx} cy={cy} r={6} fill={P.hub} />
          <circle cx={cx} cy={cy} r={14} fill="none" stroke={P.hub} strokeOpacity="0.4" />
          {tweaks.motion && (
            <circle cx={cx} cy={cy} r={14 + (Math.sin(t * 2) + 1) * 4} fill="none" stroke={P.hub} strokeOpacity={0.3 - (Math.sin(t * 2) + 1) * 0.1} />
          )}
          <text x={cx} y={cy + 36} textAnchor="middle" fill={P.dim} fontSize="9" fontFamily={c2Style.mono} letterSpacing="0.18em">VAULT</text>
          {positioned.map(d => {
            const isHover = hover === d.id;
            const isZoomed = zoomed && zoomed.id === d.id;
            const dim = zoomed && !isZoomed;
            return (
              <g key={d.id}
                onMouseEnter={() => setHover(d.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setZoomedDomain(isZoomed ? null : d)}
                style={{ cursor: 'pointer', opacity: dim ? 0.2 : 1, transition: 'opacity 0.3s' }}>
                <circle cx={d.x} cy={d.y} r={d.radius * 3} fill={`url(#g-${d.id})`} opacity={isHover || isZoomed ? 1 : 0.7} />
                <circle cx={d.x} cy={d.y} r={d.radius + 4} fill={d.color} opacity={isHover || isZoomed ? 0.4 : 0.2} />
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
          {zoomed && subConcepts.map((c, i) => {
            const a = (i / subConcepts.length) * Math.PI * 2 + (tweaks.motion ? t * 0.15 : 0);
            const r = 65;
            const cxx = zoomed.x + Math.cos(a) * r;
            const cyy = zoomed.y + Math.sin(a) * r;
            return (
              <g key={c.id} onClick={(e) => { e.stopPropagation(); setOpenConcept(c); }} style={{ cursor: 'pointer' }}>
                <line x1={zoomed.x} y1={zoomed.y} x2={cxx} y2={cyy} stroke={zoomed.color} strokeOpacity="0.3" strokeWidth="0.6" />
                <circle cx={cxx} cy={cyy} r={3} fill={zoomed.color} />
                <text x={cxx} y={cyy - 8} textAnchor="middle" fill={P.text} fontSize="9" fontFamily={c2Style.font}>
                  {c.title.length > 24 ? c.title.slice(0, 22) + '…' : c.title}
                </text>
              </g>
            );
          })}
        </svg>
        <div style={{ position: 'absolute', top: 18, left: 24, fontFamily: c2Style.mono,
          fontSize: 10, color: P.dim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          ⊹ live · {tweaks.motion ? 'orbiting' : 'paused'} · click a star to enter
        </div>
        {hover && !zoomed && (() => {
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
              <div style={{ fontSize: 10, color: P.dim2, marginTop: 8, fontFamily: c2Style.mono }}>click to zoom in →</div>
            </div>
          );
        })()}
        {zoomed && (
          <div style={{ position: 'absolute', top: 18, right: 24, background: P.bg2,
            border: `1px solid ${zoomed.color}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, fontFamily: c2Style.mono, letterSpacing: '0.05em' }}>
            <span style={{ color: zoomed.color }}>● {zoomed.name}</span>
            <button onClick={() => setZoomedDomain(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: P.dim, cursor: 'pointer', fontFamily: c2Style.mono, fontSize: 10 }}>esc · zoom out</button>
          </div>
        )}
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
          <div onClick={() => setOpenConcept(cod)} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 10, padding: '18px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: `radial-gradient(${codDom.color}, transparent 70%)`, opacity: 0.3 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, position: 'relative' }}>
              <span style={{ width: 6, height: 6, background: codDom.color, borderRadius: '50%' }} />
              <span style={{ fontFamily: c2Style.mono, fontSize: 9, color: codDom.color, letterSpacing: '0.18em', textTransform: 'uppercase' }}>star of the day</span>
            </div>
            <div style={{ fontFamily: c2Style.serif, fontSize: 21, lineHeight: 1.2, marginBottom: 12 }}>{cod.title}</div>
            <div style={{ display: 'flex', gap: 14, fontFamily: c2Style.mono, fontSize: 10, color: P.dim }}>
              <span>{cod.sources} sources</span><span>{cod.collisions} ×</span><span>{cod.sparks} ⚡</span>
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
  return (
    <div style={{ flex: 1, padding: '40px 56px 60px', overflow: 'auto' }}>
      <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>⊹ Domains</div>
      <h1 style={{ fontFamily: c2Style.serif, fontSize: 44, fontWeight: 400, margin: '0 0 28px', letterSpacing: '-0.02em' }}>The eight <em>orbits</em>.</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {C2_DATA.DOMAINS.map((d, i) => (
          <div key={d.id} onClick={() => setZoomedDomain(d)} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 12, padding: 22, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: `radial-gradient(${d.color}, transparent 65%)`, opacity: 0.18 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative' }}>
              <C2Orbit color={d.color} size={44} dots={Math.min(8, Math.ceil((d.concepts / 800) * 8) || 2)} />
              <div>
                <div style={{ fontFamily: c2Style.serif, fontSize: 21, fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim, letterSpacing: '0.15em' }}>orbit № 0{i+1}</div>
              </div>
            </div>
            <div style={{ color: P.dim, fontSize: 13, lineHeight: 1.5, marginBottom: 12, position: 'relative' }}>{d.desc}</div>
            <div style={{ display: 'flex', gap: 16, fontFamily: c2Style.mono, fontSize: 11, paddingTop: 10, borderTop: `1px solid ${P.border}` }}>
              <span><span style={{ color: d.color, fontFamily: c2Style.serif, fontSize: 16 }}>{d.concepts}</span><span style={{ color: P.dim, marginLeft: 4 }}>★</span></span>
              <span><span style={{ color: d.color, fontFamily: c2Style.serif, fontSize: 16 }}>{d.collisions}</span><span style={{ color: P.dim, marginLeft: 4 }}>×</span></span>
              <span><span style={{ color: d.color, fontFamily: c2Style.serif, fontSize: 16 }}>{d.sparks}</span><span style={{ color: P.dim, marginLeft: 4 }}>⚡</span></span>
            </div>
          </div>
        ))}
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

// ─── COLLISION ARC (self-drawing SVG ribbon) ─────────────────────────────────
function C2CollisionArc({ dA, dB, active }: { dA: NylusDomain; dB: NylusDomain; active: boolean }) {
  const len = 600;
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: active ? 1 : 0.12, transition: 'opacity 0.5s', pointerEvents: 'none' }}
      preserveAspectRatio="none" viewBox="0 0 800 140">
      <defs>
        <linearGradient id={`grad-${dA.id}-${dB.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={dA.color} stopOpacity="0.6" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor={dB.color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path d="M 60 70 Q 200 10, 400 70 T 740 70" fill="none" stroke={`url(#grad-${dA.id}-${dB.id})`} strokeWidth="2"
        strokeDasharray={len} strokeDashoffset={active ? 0 : len}
        style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
      {active && <circle cx="400" cy="70" r="8" fill="white" opacity="0.8">
        <animate attributeName="r" from="3" to="20" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
      </circle>}
    </svg>
  );
}

// ─── COLLISIONS ───────────────────────────────────────────────────────────────
function C2Collisions({ P, tweaks }: { P: Palette; tweaks: Tweaks }) {
  const C2_DATA = useNylusData();
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
          <div key={c.id} style={{ background: P.bg2, border: `1px solid ${isActive ? P.borderHi : P.border}`, borderRadius: 12, padding: 22, marginBottom: 14, position: 'relative', overflow: 'hidden', transition: 'border 0.4s' }}>
            <C2CollisionArc dA={dA} dB={dB} active={isActive && tweaks.motion} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 18, marginBottom: 12, position: 'relative' }}>
              <div style={{ fontFamily: c2Style.serif, fontSize: 19, textAlign: 'right', lineHeight: 1.2 }}>{c.a}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${dA.color}, ${dB.color})`, fontWeight: 600, fontSize: 14, boxShadow: isActive ? `0 0 24px ${dA.color}` : 'none', transition: 'box-shadow 0.4s' }}>×</div>
              <div style={{ fontFamily: c2Style.serif, fontSize: 19, lineHeight: 1.2 }}>{c.b}</div>
            </div>
            <div style={{ color: P.dim, fontSize: 13, lineHeight: 1.55, fontStyle: 'italic', textAlign: 'center', maxWidth: 600, margin: '0 auto', position: 'relative' }}>{c.note}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SPARKS ───────────────────────────────────────────────────────────────────
function C2Sparks({ P }: { P: Palette }) {
  const C2_DATA = useNylusData();
  return (
    <div style={{ flex: 1, padding: '40px 56px 60px', overflow: 'auto', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      <div style={{ fontFamily: c2Style.mono, fontSize: 10, color: P.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>⚡ Sparks</div>
      <h1 style={{ fontFamily: c2Style.serif, fontSize: 44, fontWeight: 400, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Live <em>ignitions</em>.</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {C2_DATA.SPARKS.map(s => {
          const d = C2_DATA.DOMAINS.find(x => x.id === s.domain) ?? C2_DATA.DOMAINS[0];
          return (
            <div key={s.id} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderLeft: `3px solid ${d.color}`, borderRadius: 10, padding: 18, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 14, color: d.color }}>⚡</div>
              <div style={{ fontFamily: c2Style.serif, fontSize: 15, lineHeight: 1.45, marginBottom: 10 }}>{s.text}</div>
              <div style={{ fontFamily: c2Style.mono, fontSize: 9, color: P.dim, letterSpacing: '0.15em' }}>● {d.name}</div>
            </div>
          );
        })}
      </div>
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

// ─── WORKSHOP ────────────────────────────────────────────────────────────────
function C2Workshop({ P }: { P: Palette }) {
  const C2_DATA = useNylusData();
  return (
    <div style={{ flex: 1, padding: '40px 56px 60px', overflow: 'auto', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontFamily: c2Style.serif, fontSize: 44, fontWeight: 400, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Workshop<em>.</em></h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        {[
          ['◌ seeds', C2_DATA.SPARKS.map(s => s.text), '#e8b86a'] as const,
          ['◐ drafts', C2_DATA.ESSAYS.filter(e => e.status === 'draft').map(e => e.title), '#a78bfa'] as const,
          ['● fixed',  C2_DATA.ESSAYS.filter(e => e.status === 'complete').slice(0,4).map(e => e.title), '#5fc9a8'] as const,
        ].map(([label, items, color]) => (
          <div key={label}>
            <div style={{ fontFamily: c2Style.mono, fontSize: 10, color, letterSpacing: '0.2em', textTransform: 'uppercase', paddingBottom: 12, borderBottom: `1px solid ${color}`, marginBottom: 14 }}>{label} · {items.length}</div>
            {(items as string[]).map((t2, i) => (
              <div key={i} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 8, padding: 14, marginBottom: 10, fontFamily: c2Style.serif, fontSize: 13, lineHeight: 1.4 }}>{t2}</div>
            ))}
          </div>
        ))}
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
          <div key={e.id} onClick={() => setOpenEssay(e)} style={{ background: P.bg2, border: `1px solid ${P.border}`, borderRadius: 12, padding: 22, marginBottom: 12, cursor: 'pointer' }}>
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

// ─── READER ───────────────────────────────────────────────────────────────────
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

  // Parse content into paragraphs
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

// ─── CONCEPT PAGE ─────────────────────────────────────────────────────────────
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
    { label: 'sparks', count: concept.sparks, r: 160, color: '#e8b86a', items: C2_DATA.SPARKS.filter(s => s.domain === concept.domain).slice(0, Math.min(concept.sparks || 3, 6)) },
    { label: 'collisions', count: concept.collisions, r: 230, color: '#a78bfa', items: C2_DATA.COLLISIONS.filter(c => c.domains.includes(concept.domain)).slice(0, Math.min(concept.collisions || 2, 4)) },
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
            {[['sources', concept.sources, P.dim], ['sparks', concept.sparks, '#e8b86a'], ['×', concept.collisions, '#a78bfa']].map(([k,v,c2]) => (
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

// ─── MAIN CONSTELLATION V2 ────────────────────────────────────────────────────
interface ConstellationV2Props {
  data: NylusData;
  initialPage?: string;
}

export default function ConstellationV2({ data, initialPage }: ConstellationV2Props) {
  const [page, setPage] = uS(initialPage ?? 'dashboard');
  const [openEssay, setOpenEssay] = uS<NylusEssay | null>(null);
  const [zoomedDomain, setZoomedDomain] = uS<NylusDomain | null>(null);
  const [openConcept, setOpenConcept] = uS<NylusConcept | null>(null);
  const [tweaks, setTweaks] = uS<Tweaks>(C2_DEFAULTS);
  const P = C2_PALETTES[tweaks.palette] ?? C2_PALETTES.ember;

  function setTweak(k: keyof Tweaks, v: unknown) {
    setTweaks(t => ({ ...t, [k]: v }));
  }

  function onCyclePalette() {
    const order = ['ember', 'aurora', 'monochrome'];
    const next = order[(order.indexOf(tweaks.palette) + 1) % order.length];
    setTweak('palette', next);
  }

  return (
    <NylusDataCtx.Provider value={data}>
      <div style={{ width: '100%', height: '100%', background: P.bg, color: P.text,
        fontFamily: c2Style.font, display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden' }}>
        <C2Starfield P={P} density={tweaks.starDensity} motion={tweaks.motion} />
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
          {page === 'research'   && <C2Research P={P} setOpenEssay={setOpenEssay} />}
        </div>
        {openConcept && <C2ConceptPage P={P} tweaks={tweaks} concept={openConcept} close={() => setOpenConcept(null)} setOpenEssay={setOpenEssay} />}
      </div>
    </NylusDataCtx.Provider>
  );
}
