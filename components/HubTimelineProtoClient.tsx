'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import VaultSearch from '@/components/VaultSearch';

export interface ProtoConcept {
  id: string; title: string; excerpt?: string;
  sources: number; backlinkCount: number; status?: string;
}
export interface ProtoSection {
  key: string; label: string;
  level?: 'foundational' | 'intermediate' | 'advanced' | 'thematic';
  badge?: string; concepts: ProtoConcept[];
}
export interface HubTimelineProtoProps {
  title: string; domain: string; domainLabel: string; domainColor: string;
  excerpt?: string; path?: string; sections: ProtoSection[];
}

/* ── Palettes (ported from HubSpineClient) ─────────────────────────── */
const PALETTES = {
  ember:      { bg:'#03020a', bg2:'#0d0b18', ink:'#f0eeff', ink2:'#b4acd0', ink3:'#565278', card:'rgba(13,11,24,.92)', card2:'rgba(9,7,18,.88)', cardHov:'rgba(18,15,32,.97)', border:'rgba(255,255,255,.07)', border2:'rgba(255,255,255,.04)', nav:'rgba(3,2,10,.96)', dark:true },
  aurora:     { bg:'#04080f', bg2:'#08101e', ink:'#e8f0ff', ink2:'#a0b8e8', ink3:'#3a5070', card:'rgba(8,16,30,.92)', card2:'rgba(5,11,22,.88)', cardHov:'rgba(12,22,42,.97)', border:'rgba(160,200,255,.08)', border2:'rgba(160,200,255,.04)', nav:'rgba(4,8,15,.96)', dark:true },
  monochrome: { bg:'#080808', bg2:'#111111', ink:'#f5f5f5', ink2:'#aaaaaa', ink3:'#555555', card:'rgba(17,17,17,.92)', card2:'rgba(10,10,10,.88)', cardHov:'rgba(24,24,24,.97)', border:'rgba(255,255,255,.07)', border2:'rgba(255,255,255,.04)', nav:'rgba(8,8,8,.96)', dark:true },
  sepia:      { bg:'#f4f0e8', bg2:'#ede6d4', ink:'#1a1420', ink2:'#4a3e60', ink3:'#9080a8', card:'rgba(255,252,248,.97)', card2:'rgba(248,244,238,.93)', cardHov:'rgba(240,235,225,.99)', border:'rgba(0,0,0,.08)', border2:'rgba(0,0,0,.05)', nav:'rgba(244,240,232,.97)', dark:false },
} as const;
type PaletteKey = keyof typeof PALETTES;
const PALETTE_ACCENT: Record<PaletteKey, string> = {
  ember:'#c8733a', aurora:'#3a78c8', monochrome:'#888888', sepia:'#7a5c3a',
};

/* Level colors are fixed per the requested traffic-light scheme — independent of
   each hub's own sec.color, which uses a different blue/gold/red/slate palette. */
const LEVEL_COLORS: Record<'foundational' | 'intermediate' | 'advanced', { dark: string; light: string }> = {
  foundational: { dark: '#57d489', light: '#2f9d5f' },
  intermediate: { dark: '#e8c34a', light: '#a97e12' },
  advanced:     { dark: '#e2483f', light: '#c23c33' },
};
const LEVEL_LABEL: Record<'foundational' | 'intermediate' | 'advanced', string> = {
  foundational: 'Foundational', intermediate: 'Intermediate', advanced: 'Advanced',
};
const COLOR_LEVELS = new Set(['foundational', 'intermediate', 'advanced']);

/* Measured render width ÷ font-size for each word, in the Fraunces italic 900
   watermark face — lets the watermark shrink to fit its own zone instead of
   getting clipped mid-word (was rendering as "tional…ermediate" fragments). */
const WATERMARK_WPX: Record<'foundational' | 'intermediate' | 'advanced', number> = {
  foundational: 5.85, intermediate: 5.45, advanced: 4.3,
};
const WATERMARK_MIN_PX = 16;
const WATERMARK_MAX_PX = 52;

const STATUS_COLOR: Record<string, string> = { stable:'#6bab8a', developing:'#c8a460', stub:'#9f7ec0' };
const circled = (n: number): string => (n >= 1 && n <= 20 ? String.fromCharCode(0x245F + n) : String(n));

function hexToRgb(hex: string): string {
  const m = hex.replace('#', '');
  const n = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  return `${r}, ${g}, ${b}`;
}

/* ── PaletteDot ─────────────────────────────────────────────────── */
function PaletteDot({ active, color, onClick }: { active: boolean; color: string; onClick: () => void }) {
  return (
    <button aria-label="switch palette" onClick={onClick} style={{
      width:9, height:9, borderRadius:'50%', background:color, cursor:'pointer', padding:0, flexShrink:0,
      border: active ? '1.5px solid rgba(255,255,255,.6)' : '1.5px solid transparent',
      transition:'border-color .15s, transform .15s',
      transform: active ? 'scale(1.35)' : 'scale(1)',
    }} />
  );
}

/* ── Sparks (comet field), ported from HubSpineClient's SparksCanvas ──── */
function RailSparks({ width, isSepia, colorRgb }: { width: number; isSepia: boolean; colorRgb: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas || width <= 0) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = width; canvas.height = 190;
    let rafId: number;
    const sparks = Array.from({ length: 34 }, () => ({
      x: Math.random(), vy: (0.24 + Math.random() * 0.4) * 0.0009,
      vx: (Math.random() - 0.5) * 0.0004, r: Math.random() * 1.4 + 0.4,
      life: Math.random(), maxLife: 0.6 + Math.random() * 0.35, bright: Math.random() < 0.55,
    }));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks.forEach(s => {
        s.life += s.vy; s.x += s.vx + Math.sin(s.life * 20) * 0.0002;
        if (s.life > s.maxLife) { s.x = Math.random(); s.life = 0; s.vx = (Math.random() - 0.5) * 0.0004; }
        const t = s.life / s.maxLife;
        const op = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, (1 - s.life) * canvas.height, s.r, 0, Math.PI * 2);
        const base = isSepia ? 0.16 : 0.34;
        const mult = s.bright ? 1 : 0.7;
        ctx.fillStyle = `rgba(${colorRgb},${op * base * mult})`;
        ctx.fill();
      });
      if (!reduceMotion) rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [width, isSepia, colorRgb]);
  return <canvas ref={ref} className="htp-sparks" aria-hidden="true" />;
}

type ZoneGeom = {
  level: 'foundational' | 'intermediate' | 'advanced';
  segLeft: number; segWidth: number;
  zoneLeft: number; zoneWidth: number;
  boundaryX: number; showTick: boolean;
  watermarkPx: number; showWatermark: boolean;
};
type RailLayout = { markY: number; totalWidth: number; zones: ZoneGeom[] };

/* ── HubTimelineProtoClient ─────────────────────────────────────────── */
export default function HubTimelineProtoClient({ title, domain, domainLabel, domainColor, excerpt, path, sections }: HubTimelineProtoProps) {
  const [paletteKey, setPaletteKey] = useState<PaletteKey>('ember');
  const P = PALETTES[paletteKey];

  useEffect(() => {
    const sync = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme === 'sepia') { setPaletteKey('sepia'); return; }
      try {
        const saved = localStorage.getItem('nylus-hub-palette') as PaletteKey | null;
        setPaletteKey(saved && saved in PALETTES && saved !== 'sepia' ? saved : 'ember');
      } catch { setPaletteKey('ember'); }
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  const switchPalette = useCallback((k: PaletteKey) => {
    setPaletteKey(k);
    try { localStorage.setItem('nylus-hub-palette', k); } catch {}
  }, []);

  const ORDER = sections.flatMap(s => s.concepts);
  const conceptMap = new Map(ORDER.map(c => [c.id, c]));
  const sectionOf = useCallback((cid: string) => sections.find(s => s.concepts.some(c => c.id === cid)), [sections]);

  const bookmarkKey = `nylus-timeline-bookmark-${path ?? title}`;
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(bookmarkKey);
      if (saved && conceptMap.has(saved)) {
        setBookmarkId(saved);
        const sec = sectionOf(saved);
        if (sec) setOpen(prev => new Set(prev).add(sec.key));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarkKey]);

  const toggleSection = useCallback((key: string) => {
    setOpen(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeC = activeId ? conceptMap.get(activeId) : null;
  const activeIdx = activeId ? ORDER.findIndex(c => c.id === activeId) : -1;

  const openConcept = useCallback((id: string) => {
    setActiveId(id);
    setBookmarkId(id);
    try { localStorage.setItem(bookmarkKey, id); } catch {}
  }, [bookmarkKey]);
  const closePanel = useCallback(() => setActiveId(null), []);
  const navigate = useCallback((dir: number) => {
    if (activeIdx < 0) return;
    const next = activeIdx + dir;
    if (next < 0 || next >= ORDER.length) return;
    setActiveId(ORDER[next].id);
  }, [activeIdx, ORDER]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [closePanel, navigate]);

  /* ── Rail layout: computed from real dot geometry, not guessed pixels ── */
  const railInnerRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [layout, setLayout] = useState<RailLayout | null>(null);

  const computeLayout = useCallback(() => {
    const inner = railInnerRef.current;
    if (!inner) return;
    const innerRect = inner.getBoundingClientRect();
    const marks = sections.map(s => dotRefs.current[s.key]?.querySelector<HTMLElement>('.htp-mark') ?? null);
    if (marks.some(m => !m)) return;
    const rects = marks.map(m => m!.getBoundingClientRect());
    const centers = rects.map(r => r.left - innerRect.left + r.width / 2);
    const markY = rects[0].top - innerRect.top + rects[0].height / 2;
    const OUTER_PAD = 34;

    const zones: ZoneGeom[] = [];
    let i = 0;
    while (i < sections.length) {
      const lvl = sections[i].level;
      if (!lvl || !COLOR_LEVELS.has(lvl)) { i++; continue; }
      let end = i;
      while (end + 1 < sections.length && sections[end + 1].level === lvl) end++;

      const segLeft = centers[i];
      const segRight = centers[end];
      const zoneLeft = i > 0 ? (segLeft + centers[i - 1]) / 2 : segLeft - OUTER_PAD;
      const hasNext = end < sections.length - 1;
      const zoneRight = hasNext ? (segRight + centers[end + 1]) / 2 : segRight + OUTER_PAD;
      const zoneWidth = zoneRight - zoneLeft;

      const levelKey = lvl as 'foundational' | 'intermediate' | 'advanced';
      const fitPx = (zoneWidth - 24) / WATERMARK_WPX[levelKey];
      const watermarkPx = Math.max(WATERMARK_MIN_PX, Math.min(WATERMARK_MAX_PX, fitPx));

      zones.push({
        level: levelKey,
        segLeft, segWidth: segRight - segLeft,
        zoneLeft, zoneWidth,
        boundaryX: zoneRight, showTick: hasNext,
        watermarkPx, showWatermark: fitPx >= WATERMARK_MIN_PX,
      });
      i = end + 1;
    }

    setLayout({ markY, totalWidth: inner.scrollWidth, zones });
  }, [sections]);

  useEffect(() => {
    computeLayout();
    const onResize = () => computeLayout();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [computeLayout]);

  /* ── Resume: scroll the rail + open the section the bookmark lives in ── */
  useEffect(() => {
    if (!bookmarkId || !layout) return;
    const sec = sectionOf(bookmarkId);
    if (!sec) return;
    const dotEl = dotRefs.current[sec.key];
    if (dotEl) dotEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout === null]);

  const rootVars = {
    '--hs-bg': P.bg, '--hs-bg2': P.bg2, '--hs-ink': P.ink, '--hs-ink2': P.ink2,
    '--hs-ink3': P.ink3, '--hs-card': P.card, '--hs-card2': P.card2,
    '--hs-cardHov': P.cardHov, '--hs-border': P.border, '--hs-border2': P.border2,
    '--hs-nav': P.nav, '--domain-color': domainColor,
  } as React.CSSProperties;

  const totalConcepts = ORDER.length;

  return (
    <div className="htp-root" style={rootVars}>
      <div className="htp-stripe" />
      <nav className="htp-nav">
        <div className="htp-nav-inner">
          <span className="htp-nav-bread">{domainLabel} · timeline prototype</span>
          <span className="htp-nav-sep" />
          <span className="htp-nav-title">{title}</span>
          <div className="htp-nav-right">
            {P.dark && (
              <div style={{ display:'flex', gap:6, alignItems:'center', marginRight:6 }}>
                {(['ember','aurora','monochrome'] as PaletteKey[]).map(k => (
                  <PaletteDot key={k} active={paletteKey === k} color={PALETTE_ACCENT[k]} onClick={() => switchPalette(k)} />
                ))}
              </div>
            )}
            <Link href="/hubs" className="htp-nav-link">← hubs</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="htp-wrap">
        <header className="htp-header">
          <div className="htp-chip">{domainLabel} · Hub · timeline rail prototype</div>
          <h1 className="htp-title">{title}</h1>
          {excerpt && <p className="htp-lede">{excerpt}</p>}
          <div className="htp-stats">
            <span className="htp-stat"><b>{totalConcepts}</b> concepts</span>
            <span className="htp-stat"><b>{sections.length}</b> sections</span>
          </div>
          <div className="htp-legend">
            <span><i className="htp-legend-dot" style={{ ['--dc' as any]: LEVEL_COLORS.foundational[P.dark ? 'dark' : 'light'] }} />Foundational</span>
            <span><i className="htp-legend-dot" style={{ ['--dc' as any]: LEVEL_COLORS.intermediate[P.dark ? 'dark' : 'light'] }} />Intermediate</span>
            <span><i className="htp-legend-dot" style={{ ['--dc' as any]: LEVEL_COLORS.advanced[P.dark ? 'dark' : 'light'] }} />Advanced</span>
          </div>
        </header>

        <div style={{ marginBottom: 32 }}>
          <VaultSearch
            placeholder="Search concepts in the vault…"
            showTypes={['concept', 'hub', 'collision', 'spark', 'source']}
            colors={{ bg: P.nav, border: P.border, ink: P.ink, ink2: P.ink2, card: P.card, cardHov: P.cardHov }}
          />
        </div>

        <div className="htp-scroll">
          <div className="htp-inner" ref={railInnerRef}>
            {layout && layout.totalWidth > 0 && <RailSparks width={layout.totalWidth} isSepia={!P.dark} colorRgb={hexToRgb(domainColor)} />}
            {layout && <div className="htp-track" style={{ top: layout.markY }} />}
            {layout && layout.zones.map((z, zi) => {
              const dc = LEVEL_COLORS[z.level][P.dark ? 'dark' : 'light'];
              return (
                <div key={zi}>
                  <div className="htp-zone-glow" style={{ left: z.zoneLeft, width: z.zoneWidth, top: layout.markY - 96, ['--dc' as any]: dc }} />
                  <div className="htp-seg" style={{ left: z.segLeft, width: z.segWidth, top: layout.markY - 1.5, ['--dc' as any]: dc }} />
                  {z.showWatermark && (
                    <div
                      className="htp-watermark"
                      style={{ left: z.boundaryX, top: layout.markY - 18, fontSize: z.watermarkPx, ['--dc' as any]: dc }}
                    >
                      {LEVEL_LABEL[z.level]}
                    </div>
                  )}
                  {z.showTick && <div className="htp-tick" style={{ left: z.boundaryX, top: layout.markY - 11 }} />}
                </div>
              );
            })}
            <div className="htp-dots">
              {sections.map(s => {
                const dc = s.level && COLOR_LEVELS.has(s.level)
                  ? LEVEL_COLORS[s.level as 'foundational' | 'intermediate' | 'advanced'][P.dark ? 'dark' : 'light']
                  : P.ink3;
                const isOpen = open.has(s.key);
                return (
                  <button
                    key={s.key}
                    ref={el => { dotRefs.current[s.key] = el; }}
                    className={`htp-dot${isOpen ? ' active' : ''}`}
                    style={{ ['--dc' as any]: dc }}
                    onClick={() => toggleSection(s.key)}
                    aria-expanded={isOpen}
                  >
                    <span className="htp-mark" />
                    <span className="htp-name">{s.label}</span>
                    <span className="htp-count">{s.concepts.length} concepts</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="htp-panels">
          {sections.filter(s => open.has(s.key)).map(sec => {
            const [lead, ...rest] = sec.concepts;
            return (
              <div key={sec.key} className="htp-panel">
                <button className="htp-panel-head" onClick={() => toggleSection(sec.key)}>
                  <span className="htp-panel-name">{sec.label}</span>
                  {sec.badge && <span className="htp-panel-badge">{sec.badge}</span>}
                  <span className="htp-panel-close">collapse ▴</span>
                </button>
                {lead && (
                  <button className={`htp-lead${lead.id === bookmarkId ? ' htp-bookmarked' : ''}`} onClick={() => openConcept(lead.id)}>
                    {lead.id === bookmarkId && (<><div className="htp-bookmark-ring" /><div className="htp-bookmark-label">left off here</div><div className="htp-bookmark-dot" /></>)}
                    <div className="htp-lead-meta"><span className="htp-order-lead">{circled(1)} read first</span></div>
                    <div className="htp-lead-title">{lead.title}</div>
                    {lead.excerpt && <div className="htp-lead-exc">{lead.excerpt.slice(0, 220)}{lead.excerpt.length > 220 ? '…' : ''}</div>}
                  </button>
                )}
                {rest.length > 0 && (
                  <div className="htp-grid">
                    {rest.map((c, i) => (
                      <button key={c.id} className={`htp-card${c.id === bookmarkId ? ' htp-bookmarked' : ''}`} onClick={() => openConcept(c.id)}>
                        {c.id === bookmarkId && (<><div className="htp-bookmark-ring" /><div className="htp-bookmark-label">left off here</div><div className="htp-bookmark-dot" /></>)}
                        <span className="htp-order-num">{circled(i + 2)}</span>
                        <div className="htp-card-title">{c.title}</div>
                        {c.excerpt && <div className="htp-card-exc">{c.excerpt.slice(0, 120)}{c.excerpt.length > 120 ? '…' : ''}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:64 }}>
          <Link href={`/domain/${domain}`} className="htp-back-link">← All {domainLabel} hubs</Link>
        </div>
      </div>

      {activeC && <div className="htp-backdrop" onClick={closePanel} aria-hidden="true" />}
      <div className={`htp-dp${activeC ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={activeC?.title ?? ''}>
        <div className="htp-dp-bar">
          {activeC && (() => {
            const sec = sectionOf(activeC.id);
            return (
              <>
                <span className="htp-dp-badge">{sec?.badge || sec?.label}</span>
                <span className="htp-dp-status" style={{ color: STATUS_COLOR[activeC.status ?? ''] ?? P.ink3 }}>● {activeC.status ?? 'unknown'}</span>
              </>
            );
          })()}
          <span className="htp-dp-prog">{activeIdx >= 0 ? `${activeIdx + 1} / ${ORDER.length}` : ''}</span>
          <button className="htp-dp-close" onClick={closePanel}>✕ close</button>
        </div>
        <div className="htp-dp-body">
          <div className="htp-dp-main">
            {activeC && <Link href={`/concept/${activeC.id}`} className="htp-dp-title" onClick={closePanel}>{activeC.title}</Link>}
            {activeC?.excerpt && <div className="htp-dp-exc">{activeC.excerpt}</div>}
          </div>
        </div>
        <div className="htp-dp-nav">
          <button className="htp-dp-btn" onClick={() => navigate(-1)} disabled={activeIdx <= 0}>
            <span className="htp-arr">←</span>
            <span className="htp-dp-btn-name">{activeIdx > 0 ? ORDER[activeIdx - 1]?.title : ''}</span>
          </button>
          <button className="htp-dp-btn htp-dp-next" onClick={() => navigate(1)} disabled={activeIdx >= ORDER.length - 1}>
            <span className="htp-dp-btn-name">{activeIdx < ORDER.length - 1 ? ORDER[activeIdx + 1]?.title : ''}</span>
            <span className="htp-arr">→</span>
          </button>
        </div>
      </div>

      <style>{`
        .htp-root{min-height:100vh;background:var(--hs-bg,#03020a);color:var(--hs-ink,#f0eeff);overflow-x:hidden;position:relative}
        .htp-stripe{position:fixed;top:52px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--domain-color,#ef5a6f) 40%,var(--domain-color,#ef5a6f) 60%,transparent);opacity:.65;pointer-events:none;z-index:20}
        .htp-nav{position:fixed;top:0;left:0;right:0;height:52px;background:var(--hs-nav,rgba(3,2,10,.96));border-bottom:1px solid var(--hs-border,rgba(255,255,255,.07));z-index:50;backdrop-filter:blur(12px)}
        .htp-nav-inner{max-width:1180px;margin:0 auto;height:100%;display:flex;align-items:center;gap:16px;padding:0 20px}
        .htp-nav-bread{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--hs-ink3,#565278);white-space:nowrap;flex-shrink:0}
        .htp-nav-sep{width:1px;height:14px;background:var(--hs-border,rgba(255,255,255,.07));flex-shrink:0}
        .htp-nav-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:17px;color:var(--hs-ink,#f0eeff);flex:1;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .htp-nav-right{display:flex;align-items:center;gap:14px;flex-shrink:0}
        .htp-nav-link{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--hs-ink3,#565278);text-decoration:none;transition:color .15s;white-space:nowrap}
        .htp-nav-link:hover{color:var(--domain-color,#ef5a6f)}
        .htp-wrap{position:relative;z-index:3;max-width:1180px;margin:0 auto;padding:96px 32px 160px}
        .htp-header{text-align:center;margin-bottom:56px}
        .htp-chip{font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--domain-color,#ef5a6f);opacity:.75;margin-bottom:14px}
        .htp-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(38px,7.5vw,88px);line-height:.9;letter-spacing:-.04em;color:var(--hs-ink,#f0eeff);margin-bottom:18px;text-wrap:balance}
        .htp-lede{font-family:var(--font-newsreader,serif);font-style:italic;font-size:clamp(15px,1.9vw,18px);line-height:1.8;color:var(--hs-ink2,#b4acd0);max-width:560px;margin:0 auto 22px}
        .htp-stats{display:flex;justify-content:center;gap:28px;flex-wrap:wrap;margin-bottom:18px}
        .htp-stat{font-family:var(--font-jetbrains,monospace);font-size:11px;color:var(--hs-ink3,#565278);letter-spacing:.14em}
        .htp-stat b{color:var(--domain-color,#ef5a6f);font-weight:400}
        .htp-legend{display:flex;justify-content:center;gap:20px;flex-wrap:wrap}
        .htp-legend span{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--hs-ink3,#565278)}
        .htp-legend-dot{width:8px;height:8px;border-radius:50%;background:var(--dc);box-shadow:0 0 7px 1px var(--dc);display:inline-block}
        .htp-scroll{position:relative;overflow-x:auto;overflow-y:visible;scroll-behavior:smooth;padding:112px 4px 10px;margin-top:8px;
          scrollbar-width:none;-ms-overflow-style:none;
          -webkit-mask-image:linear-gradient(90deg,transparent,#000 26px,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(90deg,transparent,#000 26px,#000 calc(100% - 26px),transparent)}
        .htp-scroll::-webkit-scrollbar{display:none;width:0;height:0}
        .htp-inner{position:relative;display:inline-flex;min-width:100%}
        .htp-sparks{position:absolute;left:0;top:-96px;z-index:0;pointer-events:none}
        .htp-track{position:absolute;left:0;right:0;height:1px;background:var(--hs-border,rgba(255,255,255,.09));z-index:1}
        .htp-zone-glow{position:absolute;height:190px;border-radius:20px;z-index:1;pointer-events:none;background:radial-gradient(ellipse 62% 100% at 50% 38%,color-mix(in srgb, var(--dc) 20%, transparent),transparent 74%)}
        .htp-seg{position:absolute;height:3px;border-radius:2px;z-index:1;background:var(--dc);animation:htp-breathe 3.6s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.htp-seg{animation:none;box-shadow:0 0 12px 2px color-mix(in srgb, var(--dc) 50%, transparent)}}
        @keyframes htp-breathe{0%,100%{box-shadow:0 0 9px 1px color-mix(in srgb, var(--dc) 38%, transparent)}50%{box-shadow:0 0 20px 4px color-mix(in srgb, var(--dc) 70%, transparent)}}
        .htp-watermark{position:absolute;transform:translate(-100%,-100%);font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;letter-spacing:-.02em;line-height:1;white-space:nowrap;padding-right:16px;color:var(--dc);opacity:.22;user-select:none;z-index:1;pointer-events:none}
        .htp-tick{position:absolute;width:1px;height:22px;background:var(--hs-ink3,#565278);opacity:.55;z-index:1}
        .htp-dots{position:relative;z-index:3;display:flex;gap:44px;padding:0 20px}
        .htp-dot{flex:0 0 168px;background:none;border:none;cursor:pointer;padding:0;display:flex;flex-direction:column;align-items:center;gap:12px;font-family:inherit;color:inherit;scroll-snap-align:center}
        .htp-mark{width:14px;height:14px;border-radius:50%;border:2px solid var(--dc);background:var(--hs-bg,#03020a);transition:transform .25s cubic-bezier(.16,1,.3,1),background .2s;position:relative;z-index:2}
        .htp-dot.active .htp-mark{background:var(--dc);transform:scale(1.3)}
        .htp-name{font-family:var(--font-newsreader,serif);font-style:italic;font-size:14px;color:var(--hs-ink2,#b4acd0);text-align:center;line-height:1.28;transition:color .15s}
        .htp-dot.active .htp-name{color:var(--hs-ink,#f0eeff)}
        .htp-count{font-family:var(--font-jetbrains,monospace);font-size:9px;color:var(--hs-ink3,#565278)}
        .htp-panels{margin-top:32px;display:flex;flex-direction:column;gap:24px}
        .htp-panel{border:1px solid var(--hs-border,rgba(255,255,255,.07))}
        .htp-panel-head{display:flex;align-items:center;gap:10px;width:100%;padding:14px 20px;background:var(--hs-card2,rgba(9,7,18,.88));border:none;cursor:pointer;color:inherit;text-align:left}
        .htp-panel-name{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:16px;color:var(--domain-color,#ef5a6f)}
        .htp-panel-badge{font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--hs-ink3,#565278)}
        .htp-panel-close{margin-left:auto;font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--hs-ink3,#565278)}
        .htp-lead{display:block;width:100%;padding:30px 34px;background:var(--hs-card,rgba(13,11,24,.92));border:none;border-top:1px solid var(--hs-border,rgba(255,255,255,.07));position:relative;cursor:pointer;text-align:left;color:inherit;transition:background .2s}
        .htp-lead:hover{background:var(--hs-cardHov,rgba(18,15,32,.97))}
        .htp-lead-meta{margin-bottom:10px}
        .htp-order-lead{font-family:var(--font-jetbrains,monospace);font-size:11px;letter-spacing:.18em;color:var(--domain-color,#ef5a6f);border:1px solid color-mix(in srgb,var(--domain-color,#ef5a6f) 45%,transparent);padding:3px 11px;font-weight:600}
        .htp-lead-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(22px,3vw,34px);color:var(--domain-color,#ef5a6f);line-height:1.08;margin-bottom:10px;text-wrap:balance}
        .htp-lead-exc{font-family:var(--font-newsreader,serif);font-style:italic;font-size:14.5px;line-height:1.75;color:var(--hs-ink2,#b4acd0)}
        .htp-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--hs-border2,rgba(255,255,255,.04))}
        @media(max-width:640px){.htp-grid{grid-template-columns:1fr}}
        .htp-card{display:block;width:100%;padding:18px 20px;background:var(--hs-card2,rgba(9,7,18,.88));border:none;cursor:pointer;text-align:left;color:inherit;position:relative;transition:background .17s}
        .htp-card:hover{background:var(--hs-cardHov,rgba(18,15,32,.97))}
        .htp-order-num{display:block;font-family:var(--font-jetbrains,monospace);font-size:11px;color:var(--domain-color,#ef5a6f);opacity:.5;margin-bottom:6px}
        .htp-card-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:16.5px;color:var(--domain-color,#ef5a6f);line-height:1.2;margin-bottom:6px;text-wrap:balance}
        .htp-card-exc{font-family:var(--font-newsreader,serif);font-style:italic;font-size:13px;line-height:1.6;color:var(--hs-ink2,#b4acd0)}
        .htp-bookmark-ring{position:absolute;inset:-1px;border:1px solid rgba(90,169,239,.5);pointer-events:none;z-index:2}
        .htp-bookmark-label{position:absolute;top:-9px;left:12px;font-family:var(--font-jetbrains,monospace);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:#5aa9ef;background:var(--hs-bg,#03020a);padding:0 4px;z-index:3;white-space:nowrap}
        .htp-bookmark-dot{position:absolute;top:10px;right:10px;width:7px;height:7px;border-radius:50%;background:#5aa9ef;z-index:3}
        .htp-bookmark-dot::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid rgba(90,169,239,.4);animation:htp-bpulse 1.8s ease-out infinite}
        @keyframes htp-bpulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2.4);opacity:0}}
        .htp-back-link{font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--hs-ink3,#565278);text-decoration:none}
        .htp-back-link:hover{color:var(--domain-color,#ef5a6f)}
        .htp-backdrop{position:fixed;inset:0;background:color-mix(in srgb,var(--hs-bg,#03020a) 85%,transparent);backdrop-filter:blur(6px);z-index:30}
        .htp-dp{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--hs-nav,rgba(3,2,10,.99));border-top:1px solid var(--hs-border,rgba(255,255,255,.09));transform:translateY(100%);transition:transform .45s cubic-bezier(.16,1,.3,1);display:flex;flex-direction:column;max-height:56vh}
        .htp-dp.open{transform:translateY(0)}
        .htp-dp-bar{display:flex;align-items:center;padding:14px 20px 0;gap:12px;flex-shrink:0;flex-wrap:wrap}
        .htp-dp-badge{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--domain-color,#ef5a6f);padding:4px 10px;border:1px solid color-mix(in srgb,var(--domain-color,#ef5a6f) 55%,transparent);opacity:.85}
        .htp-dp-status{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.14em}
        .htp-dp-prog{font-family:var(--font-jetbrains,monospace);font-size:9px;color:var(--hs-ink3,#565278);letter-spacing:.14em;margin-left:auto}
        .htp-dp-close{font-family:var(--font-jetbrains,monospace);font-size:11px;color:var(--hs-ink3,#565278);cursor:pointer;padding:6px 12px;background:none;border:none;min-height:44px}
        .htp-dp-close:hover{color:var(--domain-color,#ef5a6f)}
        .htp-dp-body{padding:16px 20px 10px;flex:1;overflow-y:auto}
        .htp-dp-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(22px,3.5vw,40px);line-height:.98;letter-spacing:-.03em;color:var(--domain-color,#ef5a6f);margin-bottom:12px;text-wrap:balance;text-decoration:none;display:block;cursor:pointer}
        .htp-dp-title:hover{opacity:.75;text-decoration:underline;text-underline-offset:4px}
        .htp-dp-exc{font-family:var(--font-newsreader,serif);font-style:italic;font-size:15px;line-height:1.8;color:var(--hs-ink2,#b4acd0)}
        .htp-dp-nav{display:flex;padding:8px 20px 12px;border-top:1px solid var(--hs-border2,rgba(255,255,255,.05));flex-shrink:0;gap:8px}
        .htp-dp-btn{font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.1em;cursor:pointer;padding:8px 14px;border:1px solid var(--hs-border,rgba(255,255,255,.08));color:var(--hs-ink2,#b4acd0);display:flex;align-items:center;gap:8px;background:none;min-height:44px}
        .htp-dp-btn:disabled{opacity:.25;cursor:not-allowed}
        .htp-dp-btn:not(:disabled):hover{border-color:color-mix(in srgb,var(--domain-color,#ef5a6f) 45%,transparent);color:var(--hs-ink,#f0eeff)}
        .htp-arr{color:var(--domain-color,#ef5a6f);opacity:.85;font-size:13px}
        .htp-dp-btn-name{font-family:var(--font-fraunces,serif);font-style:italic;font-size:13px;color:var(--hs-ink,#f0eeff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
        .htp-dp-next{margin-left:auto}
        @media(max-width:680px){
          .htp-nav-link,.htp-nav-bread,.htp-nav-sep{display:none}
          .htp-wrap{padding:72px 16px 120px}
          .htp-dp-btn-name{display:none}
          .htp-lead{padding:22px 18px}
          .htp-card{padding:14px 16px}
          .htp-panel-head{padding:12px 16px}
        }
      `}</style>
    </div>
  );
}
