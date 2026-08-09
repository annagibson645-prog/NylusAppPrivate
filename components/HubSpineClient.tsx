'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import VaultSearch from '@/components/VaultSearch';

export interface SpineConcept {
  id: string; title: string; excerpt?: string;
  sources: number; backlinkCount: number; status?: string; links: string[];
}
export interface SpineSection {
  key: string; label: string;
  level: 'foundational' | 'intermediate' | 'advanced' | 'thematic';
  color: string; badge: string; concepts: SpineConcept[];
}
export interface HubSpineProps {
  title: string; domain: string; domainLabel: string; domainColor: string;
  excerpt?: string; path?: string; sections: SpineSection[]; unplaced: SpineConcept[];
}

/* ── Palettes ───────────────────────────────────────────────────── */
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
const circled = (n: number): string => n >= 1 && n <= 20 ? String.fromCharCode(0x245F + n) : String(n);

const STATUS_COLOR: Record<string, string> = {
  stable:'#6bab8a', developing:'#c8a460', stub:'#9f7ec0',
};

/* Level colors are a fixed traffic-light scheme, independent of each section's
   own `color` field (which comes from the vault data and uses a different
   blue/gold/red/slate palette) — foundational/intermediate/advanced always
   read as green/yellow/red on the rail. Thematic sections (and the
   "Other Concepts" catch-all) still get a dot, just no color band. */
const LEVEL_COLORS: Record<'foundational' | 'intermediate' | 'advanced', { dark: string; light: string }> = {
  foundational: { dark: '#57d489', light: '#2f9d5f' },
  intermediate: { dark: '#e8c34a', light: '#a97e12' },
  advanced:     { dark: '#e2483f', light: '#c23c33' },
};
const LEVEL_LABEL: Record<'foundational' | 'intermediate' | 'advanced', string> = {
  foundational: 'Foundational', intermediate: 'Intermediate', advanced: 'Advanced',
};
const COLOR_LEVELS = new Set(['foundational', 'intermediate', 'advanced']);

/* Measured render width ÷ font-size for each word in the Fraunces italic 900
   watermark face — lets the watermark shrink to fit its own zone instead of
   getting clipped mid-word or bleeding into the next zone. */
const WATERMARK_WPX: Record<'foundational' | 'intermediate' | 'advanced', number> = {
  foundational: 5.85, intermediate: 5.45, advanced: 4.3,
};
const WATERMARK_MIN_PX = 16;
const WATERMARK_MAX_PX = 52;

function hexToRgb(hex: string): string {
  const m = hex.replace('#', '');
  const n = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  return `${r}, ${g}, ${b}`;
}

/* ── PaletteDot ─────────────────────────────────────────────────── */
function PaletteDot({ name, active, color, onClick }: { name: PaletteKey; active: boolean; color: string; onClick: () => void }) {
  return (
    <button aria-label={`${name} palette`} onClick={onClick} style={{
      width:9, height:9, borderRadius:'50%', background:color, cursor:'pointer', padding:0, flexShrink:0,
      border: active ? '1.5px solid rgba(255,255,255,.6)' : '1.5px solid transparent',
      transition:'border-color .15s, transform .15s',
      transform: active ? 'scale(1.35)' : 'scale(1)',
    }} />
  );
}

/* ── SparksCanvas: page-wide ambient embers, unchanged house style ────── */
function SparksCanvas({ isSepia }: { isSepia: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let rafId: number;
    const resize = () => { if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } };
    resize(); window.addEventListener('resize', resize);
    const sparks = Array.from({ length: 40 }, () => ({
      x: Math.random(), vy: (0.28 + Math.random() * 0.5) * 0.00055,
      vx: (Math.random() - 0.5) * 0.00028, r: Math.random() * 1.5 + 0.4,
      life: Math.random(), maxLife: 0.65 + Math.random() * 0.35, gold: Math.random() < 0.55,
    }));
    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks.forEach(s => {
        s.life += s.vy; s.x += s.vx + Math.sin(s.life * 20) * 0.00012;
        if (s.life > s.maxLife) { s.x = Math.random(); s.life = 0; s.vx = (Math.random() - 0.5) * 0.00028; }
        const t = s.life / s.maxLife;
        const op = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, (1 - s.life) * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold ? `rgba(255,200,60,${op * (isSepia ? 0.1 : 0.28)})` : `rgba(239,90,111,${op * (isSepia ? 0.1 : 0.28)})`;
        ctx.fill();
      });
      rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafId); };
  }, [isSepia]);
  return <canvas ref={ref} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }} aria-hidden="true" />;
}

/* ── RailSparks: comet field behind the rail, tinted to the hub's own domain color.
   Lives OUTSIDE the horizontal scroller and sizes itself to the visible frame, not
   the full rail width. A canvas as wide as the content (10,000px+ on a large hub)
   is a multi-megabyte texture the compositor has to move every scroll frame, which
   is what made the rail wobble on mobile. Sized to the viewport it stays put and
   costs nothing to scroll past. */
function RailSparks({ isSepia, colorRgb }: { isSepia: boolean; colorRgb: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const parent = canvas.parentElement; if (!parent) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    let rafId = 0;
    let sparks: { x: number; vy: number; vx: number; r: number; life: number; maxLife: number; bright: boolean }[] = [];
    let w = 0, h = 0;

    const size = () => {
      const rect = parent.getBoundingClientRect();
      const nw = Math.max(1, Math.round(rect.width));
      const nh = Math.max(1, Math.round(rect.height));
      if (nw === w && nh === h) return;
      w = nw; h = nh;
      canvas.width = w; canvas.height = h;
      const count = Math.round(Math.min(220, Math.max(40, w / 9)));
      sparks = Array.from({ length: count }, () => ({
        x: Math.random(), vy: (0.24 + Math.random() * 0.4) * 0.0009,
        vx: (Math.random() - 0.5) * 0.0004, r: Math.random() * 1.4 + 0.4,
        life: Math.random(), maxLife: 0.6 + Math.random() * 0.35, bright: Math.random() < 0.55,
      }));
    };
    size();

    /* Width-only observer: on mobile, scrolling shows/hides the browser chrome,
       which fires height-only resizes constantly. Reacting to those mid-scroll is
       another source of visible jitter. */
    const ro = new ResizeObserver(() => size());
    ro.observe(parent);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const base = isSepia ? 0.22 : 0.42;
      sparks.forEach(s => {
        s.life += s.vy; s.x += s.vx + Math.sin(s.life * 20) * 0.0002;
        if (s.life > s.maxLife) { s.x = Math.random(); s.life = 0; s.vx = (Math.random() - 0.5) * 0.0004; }
        const t = s.life / s.maxLife;
        const op = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1;
        ctx.beginPath();
        ctx.arc(s.x * w, (1 - s.life) * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRgb},${op * base * (s.bright ? 1 : 0.7)})`;
        ctx.fill();
      });
      if (!reduceMotion) rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => { ro.disconnect(); cancelAnimationFrame(rafId); };
  }, [isSepia, colorRgb]);
  return <canvas ref={ref} className="hs-rail-sparks" aria-hidden="true" />;
}

type ZoneGeom = {
  level: 'foundational' | 'intermediate' | 'advanced';
  segTop: number; segHeight: number;
  zoneTop: number; zoneHeight: number;
  boundaryY: number; showTick: boolean;
  watermarkPx: number; showWatermark: boolean;
};
type RailLayout = { markX: number; totalHeight: number; zones: ZoneGeom[] };

/* ── HubSpineClient ─────────────────────────────────────────────── */
export default function HubSpineClient({ title, domain, domainLabel, domainColor, excerpt, path, sections, unplaced }: HubSpineProps) {
  const [paletteKey, setPaletteKey] = useState<PaletteKey>('ember');
  const P = PALETTES[paletteKey];

  useEffect(() => {
    const sync = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme === 'sepia') { setPaletteKey('sepia'); return; }
      try {
        const saved = localStorage.getItem('nylus-hub-palette') as PaletteKey | null;
        setPaletteKey((saved && saved in PALETTES && saved !== 'sepia') ? saved : 'ember');
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

  const allSections: SpineSection[] = unplaced.length > 0
    ? [...sections, { key:'__unplaced__', label:'Other Concepts', level:'thematic' as const, color:domainColor, badge:'', concepts:unplaced }]
    : sections;

  const ORDER = allSections.flatMap(s => s.concepts);
  const conceptMap = new Map(ORDER.map(c => [c.id, c]));

  /* All sections start collapsed */
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(allSections.map(s => s.key)));
  const toggleSection = useCallback((key: string) => {
    setCollapsed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  /* ── Rail layout: computed from real dot geometry ──────────────────── */
  const railInnerRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [layout, setLayout] = useState<RailLayout | null>(null);

  const computeLayout = useCallback(() => {
    const inner = railInnerRef.current;
    if (!inner) return;
    const innerRect = inner.getBoundingClientRect();
    const marks = allSections.map(s => dotRefs.current[s.key]?.querySelector<HTMLElement>('.hs-rail-mark') ?? null);
    if (marks.some(m => !m)) return;
    const rects = marks.map(m => m!.getBoundingClientRect());
    const centers = rects.map(r => r.top - innerRect.top + r.height / 2);
    const markX = rects[0].left - innerRect.left + rects[0].width / 2;
    const OUTER_PAD = 34;

    const zones: ZoneGeom[] = [];
    let i = 0;
    while (i < allSections.length) {
      const lvl = allSections[i].level;
      if (!COLOR_LEVELS.has(lvl)) { i++; continue; }
      let end = i;
      while (end + 1 < allSections.length && allSections[end + 1].level === lvl) end++;

      const segTop = centers[i];
      const segBottom = centers[end];
      const zoneTop = i > 0 ? (segTop + centers[i - 1]) / 2 : segTop - OUTER_PAD;
      const hasNext = end < allSections.length - 1;
      const zoneBottom = hasNext ? (segBottom + centers[end + 1]) / 2 : segBottom + OUTER_PAD;
      const zoneHeight = zoneBottom - zoneTop;

      const levelKey = lvl as 'foundational' | 'intermediate' | 'advanced';
      const fitPx = (zoneHeight - 24) / WATERMARK_WPX[levelKey];
      const watermarkPx = Math.max(WATERMARK_MIN_PX, Math.min(WATERMARK_MAX_PX, fitPx));

      zones.push({
        level: levelKey,
        segTop, segHeight: segBottom - segTop,
        zoneTop, zoneHeight,
        boundaryY: zoneBottom, showTick: hasNext,
        watermarkPx, showWatermark: fitPx >= WATERMARK_MIN_PX,
      });
      i = end + 1;
    }

    /* All visible watermarks share one uniform size — the smallest that still
       fits its own zone — rather than each word scaling independently, which
       read as three mismatched sizes across the rail. */
    const visible = zones.filter(z => z.showWatermark);
    if (visible.length > 0) {
      const uniformPx = Math.min(...visible.map(z => z.watermarkPx));
      zones.forEach(z => { if (z.showWatermark) z.watermarkPx = uniformPx; });
    }

    setLayout({ markX, totalHeight: inner.scrollHeight, zones });
  }, [allSections]);

  /* Recompute on WIDTH changes only. On mobile, scrolling shows/hides the browser
     chrome, which fires a stream of height-only resize events; re-running the
     layout mid-scroll repositions every absolutely-placed zone/watermark and is
     what made the rail visibly wobble. Height changes can't affect this layout. */
  useEffect(() => {
    computeLayout();
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      computeLayout();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [computeLayout]);

  const scrollDotIntoView = useCallback((key: string) => {
    dotRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }, []);

  const railScrollRef = useRef<HTMLDivElement>(null);

  const bookmarkKey = `nylus-bookmark-${path ?? title}`;
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(bookmarkKey);
      if (saved) {
        setBookmarkId(saved);
        const sec = allSections.find(s => s.concepts.some(c => c.id === saved));
        if (sec) {
          setCollapsed(prev => { const n = new Set(prev); n.delete(sec.key); return n; });
          setTimeout(() => scrollDotIntoView(sec.key), 250);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarkKey]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeC   = activeId ? conceptMap.get(activeId) : null;
  const activeIdx = activeId ? ORDER.findIndex(c => c.id === activeId) : -1;

  const conceptSection = useCallback((id: string) => allSections.find(s => s.concepts.some(c => c.id === id)), [allSections]);
  const openConcept    = useCallback((id: string) => {
    setActiveId(id);
    setBookmarkId(id);
    try { localStorage.setItem(bookmarkKey, id); } catch {}
  }, [bookmarkKey]);
  const closePanel     = useCallback(() => setActiveId(null), []);

  const navigate = useCallback((dir: number) => {
    if (activeIdx < 0) return;
    const next = activeIdx + dir;
    if (next < 0 || next >= ORDER.length) return;
    const nextId = ORDER[next].id;
    setActiveId(nextId);
    const sec = allSections.find(s => s.concepts.some(c => c.id === nextId));
    if (sec) {
      setCollapsed(prev => { const n = new Set(prev); n.delete(sec.key); return n; });
      scrollDotIntoView(sec.key);
    }
    setTimeout(() => document.querySelector(`[data-cid="${nextId}"]`)?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 80);
  }, [activeIdx, ORDER, allSections, scrollDotIntoView]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [closePanel, navigate]);

  const rootVars = {
    '--hs-bg': P.bg, '--hs-bg2': P.bg2, '--hs-ink': P.ink, '--hs-ink2': P.ink2,
    '--hs-ink3': P.ink3, '--hs-card': P.card, '--hs-card2': P.card2,
    '--hs-cardHov': P.cardHov, '--hs-border': P.border, '--hs-border2': P.border2,
    '--hs-nav': P.nav, '--domain-color': domainColor,
  } as React.CSSProperties;

  const totalConcepts = ORDER.length;
  const totalBl = ORDER.reduce((a, c) => a + c.backlinkCount, 0);

  return (
    <div className="hs-root" style={rootVars}>
      <SparksCanvas isSepia={!P.dark} />
      <div className="hs-stripe" />

      <nav className="hs-nav">
        <div className="hs-nav-inner">
          <span className="hs-nav-bread">{domainLabel}</span>
          <span className="hs-nav-sep" />
          <span className="hs-nav-title">{title}</span>
          <div className="hs-nav-right">
            {P.dark && (
              <div style={{ display:'flex', gap:6, alignItems:'center', marginRight:6 }}>
                {(['ember','aurora','monochrome'] as PaletteKey[]).map(k => (
                  <PaletteDot key={k} name={k} active={paletteKey === k} color={PALETTE_ACCENT[k]} onClick={() => switchPalette(k)} />
                ))}
              </div>
            )}
            <Link href={`/domain/${domain}`} className="hs-nav-link">← {domainLabel}</Link>
            <Link href="/" className="hs-nav-link">constellation</Link>
            {path && <a href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(path)}`} className="hs-nav-link">obsidian ↗</a>}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="hs-wrap">
        <header className="hs-header">
          <div className="hs-chip">{domainLabel} · Hub</div>
          <h1 className="hs-title">{title}</h1>
          {excerpt && <p className="hs-lede">{excerpt}</p>}
          <div className="hs-stats">
            <span className="hs-stat"><b>{totalConcepts}</b> concepts</span>
            <span className="hs-stat"><b>{allSections.length}</b> sections</span>
            {totalBl > 0 && <span className="hs-stat"><b>{totalBl}</b> backlinks</span>}
          </div>
          <div className="hs-rail-legend">
            <span><i className="hs-rail-legend-dot" style={{ ['--dc' as any]: LEVEL_COLORS.foundational[P.dark ? 'dark' : 'light'] }} />Foundational</span>
            <span><i className="hs-rail-legend-dot" style={{ ['--dc' as any]: LEVEL_COLORS.intermediate[P.dark ? 'dark' : 'light'] }} />Intermediate</span>
            <span><i className="hs-rail-legend-dot" style={{ ['--dc' as any]: LEVEL_COLORS.advanced[P.dark ? 'dark' : 'light'] }} />Advanced</span>
          </div>
        </header>

        {/* Vault search */}
        <div style={{ marginBottom: 32 }}>
          <VaultSearch
            placeholder="Search concepts in the vault…"
            showTypes={['concept', 'hub', 'collision', 'spark', 'source']}
            colors={{
              bg:      P.nav,
              border:  P.border,
              ink:     P.ink,
              ink2:    P.ink2,
              card:    P.card,
              cardHov: P.cardHov,
            }}
          />
        </div>

        {/* Vertical, level-colored rail. The comet canvas sits in the frame,
            outside the scroller, so it stays fixed while the rail scrolls
            under it. */}
        <div className="hs-rail-frame">
          <RailSparks isSepia={!P.dark} colorRgb={hexToRgb(domainColor)} />
          <div className="hs-rail-scroll" ref={railScrollRef}>
          <div className="hs-rail-inner" ref={railInnerRef}>
            {layout && <div className="hs-rail-track" style={{ left: layout.markX }} />}
            {layout && layout.zones.length === 0 && (
              /* No foundational/intermediate/advanced sections on this hub (all
                 thematic) — still give the rail a domain-colored backdrop rather
                 than leaving it bare, matching hubs that do have graded zones. */
              <div className="hs-rail-zone" style={{ top: 0, height: layout.totalHeight, left: layout.markX - 96, ['--dc' as any]: domainColor }} />
            )}
            {layout && layout.zones.map((z, zi) => {
              const dc = LEVEL_COLORS[z.level][P.dark ? 'dark' : 'light'];
              return (
                <div key={zi}>
                  <div className="hs-rail-zone" style={{ top: z.zoneTop, height: z.zoneHeight, left: layout.markX - 96, ['--dc' as any]: dc }} />
                  <div className="hs-rail-seg" style={{ top: z.segTop, height: z.segHeight, left: layout.markX - 1.5, ['--dc' as any]: dc }} />
                  {z.showWatermark && (
                    <div className="hs-rail-watermark" style={{ top: z.boundaryY, left: layout.markX - 18, fontSize: z.watermarkPx, ['--dc' as any]: dc }}>
                      {LEVEL_LABEL[z.level]}
                    </div>
                  )}
                  {z.showTick && <div className="hs-rail-tick" style={{ top: z.boundaryY, left: layout.markX - 11 }} />}
                </div>
              );
            })}
            <div className="hs-rail-dots">
              {allSections.map(sec => {
                const dc = COLOR_LEVELS.has(sec.level)
                  ? LEVEL_COLORS[sec.level as 'foundational' | 'intermediate' | 'advanced'][P.dark ? 'dark' : 'light']
                  : sec.color;
                const isOpen = !collapsed.has(sec.key);
                return (
                  <button
                    key={sec.key}
                    ref={el => { dotRefs.current[sec.key] = el; }}
                    className={`hs-rail-dot${isOpen ? ' active' : ''}`}
                    style={{ ['--dc' as any]: dc }}
                    onClick={() => toggleSection(sec.key)}
                    aria-expanded={isOpen}
                  >
                    <span className="hs-rail-mark" />
                    <span className="hs-rail-name">{sec.label}</span>
                    <span className="hs-rail-count">{sec.concepts.length} concepts</span>
                  </button>
                );
              })}
            </div>
          </div>
          </div>
        </div>

        <div className="hs-panels">
          {allSections.filter(sec => !collapsed.has(sec.key)).map(sec => {
            const [lead, ...rest] = sec.concepts;
            const leftCol  = rest.filter((_, i) => i % 2 === 0);
            const rightCol = rest.filter((_, i) => i % 2 === 1);
            return (
              <div key={sec.key} className="hs-panel">
                <button className="hs-panel-head" onClick={() => toggleSection(sec.key)}>
                  <span className="hs-panel-name">{sec.label}</span>
                  {sec.badge && <span className="hs-panel-badge" style={{ color: sec.color }}>{sec.badge}</span>}
                  <span className="hs-panel-close">collapse ▴</span>
                </button>
                {lead && (
                  <button className={`hs-bridge${lead.id === bookmarkId ? ' hs-bookmarked' : ''}`} data-cid={lead.id} style={{ animationDelay: '.08s' }} onClick={() => openConcept(lead.id)}>
                    {lead.id === bookmarkId && <><div className="hs-bookmark-ring" /><div className="hs-bookmark-label">left off here</div><div className="hs-bookmark-dot" /></>}
                    <div className="hs-bridge-meta"><span className="hs-order-lead">{circled(1)} read first</span><span>Lead Concept</span></div>
                    <div className="hs-bridge-title">{lead.title}</div>
                    {lead.excerpt && <div className="hs-bridge-exc">{lead.excerpt.slice(0, 240)}{lead.excerpt.length > 240 ? '…' : ''}</div>}
                    <div className="hs-bridge-foot">{lead.sources > 0 && `${lead.sources} src · `}{lead.backlinkCount > 0 && `${lead.backlinkCount} bl · `}{lead.status && `● ${lead.status}`}</div>
                  </button>
                )}
                {rest.length > 0 && (
                  <div className="hs-two-col">
                    {[leftCol, rightCol].map((col, ci) => (
                      <div key={ci} className="hs-col">
                        {col.map((c, j) => (
                          <button key={c.id} className={`hs-scard${ci === 1 ? ' hs-scard-right' : ''}${c.id === bookmarkId ? ' hs-bookmarked' : ''}`} data-cid={c.id} style={{ animationDelay: `${Math.min(0.16 + (j * 2 + ci) * 0.045, 0.6)}s` }} onClick={() => openConcept(c.id)}>
                            {c.id === bookmarkId && <><div className="hs-bookmark-ring" /><div className="hs-bookmark-label">left off here</div><div className="hs-bookmark-dot" /></>}
                            <span className="hs-scard-hint">open ↗</span>
                            <span className="hs-order-num">{circled(ci === 0 ? j * 2 + 2 : j * 2 + 3)}</span>
                            <div className="hs-scard-title">{c.title}</div>
                            {c.excerpt && <div className="hs-scard-exc">{c.excerpt.slice(0, 120)}{c.excerpt.length > 120 ? '…' : ''}</div>}
                            <div className="hs-scard-meta">{c.sources > 0 && `${c.sources} src · `}{c.backlinkCount > 0 && `${c.backlinkCount} bl`}</div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:64 }}>
          <Link href={`/domain/${domain}`} className="hs-back-link">← All {domainLabel} hubs</Link>
        </div>
      </div>

      {activeC && <div className="hs-backdrop" onClick={closePanel} aria-hidden="true" />}

      <div className={`hs-dp${activeC ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={activeC?.title ?? ''}>
        <div className="hs-dp-bar">
          {activeC && (() => {
            const sec = conceptSection(activeC.id);
            return (
              <>
                <span className="hs-dp-badge">{sec?.badge || sec?.label}</span>
                <span className="hs-dp-status" style={{ color: STATUS_COLOR[activeC.status ?? ''] ?? P.ink3 }}>● {activeC.status ?? 'unknown'}</span>
              </>
            );
          })()}
          <span className="hs-dp-prog">{activeIdx >= 0 ? `${activeIdx + 1} / ${ORDER.length}` : ''}</span>
          <button className="hs-dp-close" onClick={closePanel}>✕ close</button>
        </div>

        <div className="hs-dp-body">
          <div className="hs-dp-main">
            {activeC && (
              <Link href={`/concept/${activeC.id}`} className="hs-dp-title" onClick={closePanel}>
                {activeC.title}
              </Link>
            )}
            {activeC?.excerpt && <div className="hs-dp-exc">{activeC.excerpt}</div>}
            <div className="hs-dp-meta-row">
              {activeC && activeC.sources > 0 && <span className="hs-dp-pill">{activeC.sources} sources</span>}
              {activeC && activeC.backlinkCount > 0 && <span className="hs-dp-pill">{activeC.backlinkCount} backlinks</span>}
            </div>
          </div>
          {activeC && activeC.links.length > 0 && (
            <div className="hs-dp-aside">
              <div className="hs-dp-links-lbl">Linked</div>
              {activeC.links.slice(0, 6).map(lid => {
                const lc = conceptMap.get(lid); if (!lc) return null;
                return (
                  <button key={lid} className="hs-dp-link" onClick={() => {
                    setActiveId(lid);
                    const sec = allSections.find(s => s.concepts.some(c => c.id === lid));
                    if (sec) {
                      setCollapsed(prev => { const n = new Set(prev); n.delete(sec.key); return n; });
                      scrollDotIntoView(sec.key);
                    }
                  }}>{lc.title}</button>
                );
              })}
            </div>
          )}
        </div>

        {activeIdx >= 0 && activeIdx < ORDER.length - 1 && (
          <div className="hs-dp-next-band">
            <span className="hs-dp-next-lbl">Up next</span>
            <span className="hs-dp-next-title">{ORDER[activeIdx + 1]?.title}</span>
            <button className="hs-dp-next-arrow" onClick={() => navigate(1)}>→</button>
          </div>
        )}

        <div className="hs-dp-nav">
          <button className="hs-dp-btn hs-dp-prev" onClick={() => navigate(-1)} disabled={activeIdx <= 0}>
            <span className="hs-arr">←</span>
            <span className="hs-dp-btn-name">{activeIdx > 0 ? ORDER[activeIdx - 1]?.title : ''}</span>
          </button>
          <button className="hs-dp-btn hs-dp-next" onClick={() => navigate(1)} disabled={activeIdx >= ORDER.length - 1}>
            <span className="hs-dp-btn-name">{activeIdx < ORDER.length - 1 ? ORDER[activeIdx + 1]?.title : ''}</span>
            <span className="hs-arr">→</span>
          </button>
        </div>
      </div>

      {!activeC && <div className="hs-hint" aria-hidden="true">tap any concept to explore</div>}

      <style>{`
        .hs-root{min-height:100vh;background:var(--hs-bg,#03020a);color:var(--hs-ink,#f0eeff);overflow-x:hidden;position:relative}
        .hs-stripe{position:fixed;top:52px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--domain-color,#ef5a6f) 40%,var(--domain-color,#ef5a6f) 60%,transparent);opacity:.65;pointer-events:none;z-index:20}
        .hs-nav{position:fixed;top:0;left:0;right:0;height:52px;background:var(--hs-nav,rgba(3,2,10,.96));border-bottom:1px solid var(--hs-border,rgba(255,255,255,.07));z-index:50;backdrop-filter:blur(12px)}
        .hs-nav-inner{max-width:1100px;margin:0 auto;height:100%;display:flex;align-items:center;gap:16px;padding:0 20px}
        .hs-nav-bread{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--hs-ink3,#565278);white-space:nowrap;flex-shrink:0}
        .hs-nav-sep{width:1px;height:14px;background:var(--hs-border,rgba(255,255,255,.07));flex-shrink:0}
        .hs-nav-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:17px;color:var(--hs-ink,#f0eeff);flex:1;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hs-nav-right{display:flex;align-items:center;gap:14px;flex-shrink:0}
        .hs-nav-link{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--hs-ink3,#565278);text-decoration:none;transition:color .15s;white-space:nowrap}
        .hs-nav-link:hover{color:var(--domain-color,#ef5a6f)}
        @media(max-width:680px){.hs-nav-link,.hs-nav-bread,.hs-nav-sep{display:none}}
        .hs-wrap{position:relative;z-index:3;max-width:1180px;margin:0 auto;padding:96px 32px 180px}
        @media(max-width:680px){.hs-wrap{padding:72px 16px 120px}}
        .hs-header{text-align:center;margin-bottom:56px}
        .hs-chip{font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--domain-color,#ef5a6f);opacity:.75;margin-bottom:14px}
        .hs-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(42px,8.5vw,110px);line-height:.88;letter-spacing:-.04em;color:var(--hs-ink,#f0eeff);margin-bottom:20px;text-wrap:balance}
        .hs-lede{font-family:var(--font-newsreader,serif);font-style:italic;font-size:clamp(15px,1.9vw,18px);line-height:1.82;color:var(--hs-ink2,#b4acd0);max-width:500px;margin:0 auto 26px}
        .hs-stats{display:flex;justify-content:center;gap:32px;flex-wrap:wrap;margin-bottom:18px}
        .hs-stat{font-family:var(--font-jetbrains,monospace);font-size:11px;color:var(--hs-ink3,#565278);letter-spacing:.14em}
        .hs-stat b{color:var(--domain-color,#ef5a6f);font-weight:400}
        .hs-rail-legend{display:flex;justify-content:center;gap:20px;flex-wrap:wrap}
        .hs-rail-legend span{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--hs-ink3,#565278)}
        .hs-rail-legend-dot{width:8px;height:8px;border-radius:50%;background:var(--dc);box-shadow:0 0 7px 1px var(--dc);display:inline-block}
        /* The frame holds the fixed comet layer; only .hs-rail-scroll inside it moves. */
        .hs-rail-frame{position:relative;margin:8px auto 0;max-width:520px;isolation:isolate}
        .hs-rail-scroll{position:relative;z-index:1;overflow-y:auto;overflow-x:hidden;padding:10px 10px 10px 112px;
          max-height:min(62vh,720px);
          scrollbar-width:none;-ms-overflow-style:none;
          -webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;
          -webkit-mask-image:linear-gradient(180deg,transparent,#000 26px,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(180deg,transparent,#000 26px,#000 calc(100% - 26px),transparent)}
        .hs-rail-scroll::-webkit-scrollbar{display:none;width:0;height:0}
        /* translateZ promotes the scrolling content to its own layer so the browser
           can move it without repainting — without this, mobile scroll repaints the
           whole rail every frame and the absolutely-placed zones visibly shimmer. */
        .hs-rail-inner{position:relative;display:flex;flex-direction:column;min-height:100%;transform:translateZ(0);backface-visibility:hidden}
        .hs-rail-sparks{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
        .hs-rail-track{position:absolute;top:0;bottom:0;width:1px;background:var(--hs-border,rgba(255,255,255,.09));z-index:1}
        /* The along-rail fade uses fixed px insets and the cross-rail falloff lives
           in the mask, so the wash reads identically on a 200px zone and a 4000px
           one — a percentage-based radial gradient concentrated all its color in
           the middle and left the visible edges of long zones looking empty. */
        .hs-rail-zone{position:absolute;width:190px;z-index:1;pointer-events:none;
          background:linear-gradient(180deg,transparent 0,color-mix(in srgb, var(--dc) 17%, transparent) 70px,color-mix(in srgb, var(--dc) 17%, transparent) calc(100% - 70px),transparent 100%);
          -webkit-mask-image:linear-gradient(to right,transparent 0,#000 30%,#000 52%,transparent 100%);
          mask-image:linear-gradient(to right,transparent 0,#000 30%,#000 52%,transparent 100%)}
        /* The glow was an animated box-shadow, which is not compositor-accelerated:
           it forced a full repaint every frame on a bar that can be thousands of px
           long. Now the shadow is painted once and only a sibling layer's opacity
           animates, which runs entirely on the compositor. */
        .hs-rail-seg{position:absolute;width:3px;border-radius:2px;z-index:1;background:var(--dc);
          box-shadow:0 0 10px 1px color-mix(in srgb, var(--dc) 42%, transparent)}
        .hs-rail-seg::after{content:'';position:absolute;inset:-1px -5px;border-radius:6px;background:var(--dc);
          opacity:.22;filter:blur(6px);will-change:opacity;animation:hs-rail-breathe 3.6s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.hs-rail-seg::after{animation:none;opacity:.3}}
        @keyframes hs-rail-breathe{0%,100%{opacity:.16}50%{opacity:.46}}
        /* Rotated a quarter turn so the word runs along the rail and still ends at
           its zone boundary, exactly as it did when the rail was horizontal. */
        .hs-rail-watermark{position:absolute;transform-origin:0 0;transform:rotate(90deg) translate(-100%,0);font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;letter-spacing:-.02em;line-height:1;white-space:nowrap;padding-right:16px;color:var(--dc);opacity:.22;user-select:none;z-index:1;pointer-events:none}
        .hs-rail-tick{position:absolute;height:1px;width:22px;background:var(--hs-ink3,#565278);opacity:.55;z-index:1}
        .hs-rail-dots{position:relative;z-index:3;display:flex;flex-direction:column;gap:64px;padding:20px 0}
        .hs-rail-dot{flex:0 0 auto;min-height:60px;width:200px;background:none;border:none;cursor:pointer;padding:0;
          display:grid;grid-template-columns:14px 1fr;column-gap:12px;align-items:center;justify-items:start;
          text-align:left;font-family:inherit;color:inherit;scroll-snap-align:center}
        .hs-rail-mark{grid-row:1 / 3;align-self:center;width:14px;height:14px;border-radius:50%;border:2px solid var(--dc);background:var(--hs-bg,#03020a);transition:transform .25s cubic-bezier(.16,1,.3,1),background .2s,box-shadow .25s;position:relative;z-index:2}
        .hs-rail-mark::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:1px solid var(--dc);opacity:0;transform:scale(.7);pointer-events:none}
        .hs-rail-dot.active .hs-rail-mark{background:var(--dc);transform:scale(1.3);box-shadow:0 0 12px 2px color-mix(in srgb,var(--dc) 45%,transparent)}
        .hs-rail-dot.active .hs-rail-mark::after{animation:hs-dot-ripple .62s cubic-bezier(.16,1,.3,1) forwards}
        @keyframes hs-dot-ripple{0%{opacity:.85;transform:scale(.7)}100%{opacity:0;transform:scale(2.4)}}
        .hs-rail-name{grid-column:2;grid-row:1;font-family:var(--font-newsreader,serif);font-style:italic;font-size:14px;color:var(--hs-ink2,#b4acd0);text-align:left;line-height:1.28;transition:color .15s}
        .hs-rail-dot.active .hs-rail-name{color:var(--hs-ink,#f0eeff)}
        .hs-rail-count{grid-column:2;grid-row:2;font-family:var(--font-jetbrains,monospace);font-size:9px;color:var(--hs-ink3,#565278)}
        @media(max-width:680px){
          .hs-rail-scroll{padding-left:92px;max-height:min(58vh,560px)}
          .hs-rail-dot{width:auto;min-height:52px}
          .hs-rail-dots{gap:52px}
        }
        .hs-panels{margin-top:32px;display:flex;flex-direction:column;gap:24px}
        /* Panels mount only while their rail dot is open, so these run once on
           expand: the shell settles first, then its cards fade up in sequence. */
        .hs-panel{position:relative;animation:hs-panel-in .42s cubic-bezier(.16,1,.3,1) both}
        @keyframes hs-panel-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .hs-panel .hs-bridge,.hs-panel .hs-scard{animation:hs-card-in .5s cubic-bezier(.16,1,.3,1) both}
        @keyframes hs-card-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){
          .hs-panel,.hs-panel .hs-bridge,.hs-panel .hs-scard{animation:hs-fade-in .2s ease both}
          .hs-rail-dot.active .hs-rail-mark::after{animation:none}
        }
        @keyframes hs-fade-in{from{opacity:0}to{opacity:1}}
        .hs-panel-head{display:flex;align-items:center;gap:10px;width:100%;padding:14px 20px;background:var(--hs-card2,rgba(9,7,18,.88));border:1px solid var(--hs-border,rgba(255,255,255,.07));border-bottom:none;cursor:pointer;color:inherit;text-align:left}
        .hs-panel-name{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(16px,2.2vw,22px);color:var(--domain-color,#ef5a6f)}
        .hs-panel-badge{font-family:var(--font-jetbrains,monospace);font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.8}
        .hs-panel-close{margin-left:auto;font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--hs-ink3,#565278)}
        .hs-bridge{display:block;width:100%;padding:32px 40px;background:var(--hs-card,rgba(10,8,24,.88));border:1px solid var(--hs-border,rgba(255,255,255,.07));position:relative;z-index:3;cursor:pointer;overflow:hidden;text-align:left;color:inherit;transition:background .25s}
        .hs-bridge::before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--domain-color,#ef5a6f);transform:scaleY(0);transform-origin:top;transition:transform .4s cubic-bezier(.16,1,.3,1)}
        .hs-bridge:hover{background:var(--hs-cardHov,rgba(16,12,36,.95))}
        .hs-bridge:hover::before{transform:scaleY(1)}
        .hs-bridge-meta{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--hs-ink3,#565278);margin-bottom:10px;display:flex;align-items:center;gap:10px}
        .hs-order-lead{font-family:var(--font-jetbrains,monospace);font-size:11px;letter-spacing:.18em;color:var(--domain-color,#ef5a6f);border:1px solid color-mix(in srgb,var(--domain-color,#ef5a6f) 45%,transparent);padding:3px 11px;opacity:1;flex-shrink:0;white-space:nowrap;font-weight:600}
        .hs-order-num{display:block;font-family:var(--font-jetbrains,monospace);font-size:11px;color:var(--domain-color,#ef5a6f);opacity:.5;line-height:1;pointer-events:none;user-select:none;margin-bottom:7px;letter-spacing:.08em}
        @media(max-width:680px){.hs-order-num{font-size:10px;margin-bottom:5px}}
        .hs-bridge-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(24px,3.6vw,44px);color:var(--domain-color,#ef5a6f);line-height:1.04;margin-bottom:14px;letter-spacing:-.025em;transition:opacity .15s;text-wrap:balance}
        .hs-bridge:hover .hs-bridge-title{opacity:.8}
        .hs-bridge-exc{font-family:var(--font-newsreader,serif);font-style:italic;font-size:clamp(14px,1.6vw,17px);line-height:1.76;color:var(--hs-ink2,#b4acd0);font-weight:300}
        .hs-bridge-foot{font-family:var(--font-jetbrains,monospace);font-size:10px;color:var(--hs-ink3,#565278);letter-spacing:.1em;margin-top:16px}
        @media(max-width:680px){.hs-bridge{padding:22px 18px}}
        .hs-two-col{display:grid;grid-template-columns:1fr 1fr;gap:1px;position:relative;z-index:2;margin-top:1px}
        @media(max-width:680px){.hs-two-col{grid-template-columns:1fr}}
        .hs-col{display:flex;flex-direction:column;gap:1px}
        .hs-scard{display:block;width:100%;padding:20px 24px;background:var(--hs-card2,rgba(9,7,20,.85));cursor:pointer;text-align:left;color:inherit;border:1px solid transparent;transition:background .17s,border-color .2s;position:relative}
        .hs-scard:hover{background:var(--hs-cardHov,rgba(16,13,34,.96))}
        .hs-col .hs-scard:hover{border-right-color:var(--domain-color,#ef5a6f)}
        .hs-col:last-child .hs-scard:hover,.hs-scard-right:hover{border-left-color:var(--domain-color,#ef5a6f);border-right-color:transparent}
        .hs-scard-hint{position:absolute;right:10px;top:10px;font-family:var(--font-jetbrains,monospace);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--domain-color,#ef5a6f);opacity:0;transition:opacity .2s;pointer-events:none}
        .hs-scard:hover .hs-scard-hint{opacity:.6}
        .hs-scard-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(17px,2.2vw,24px);color:var(--domain-color,#ef5a6f);line-height:1.15;transition:opacity .15s;text-wrap:balance}
        .hs-scard:hover .hs-scard-title{opacity:.75}
        .hs-scard-exc{font-family:var(--font-newsreader,serif);font-style:italic;font-size:clamp(13px,1.4vw,15px);line-height:1.65;color:var(--hs-ink2,#b4acd0);margin-top:8px;font-weight:300}
        .hs-scard-meta{font-family:var(--font-jetbrains,monospace);font-size:10px;color:var(--hs-ink3,#565278);letter-spacing:.1em;margin-top:10px}
        @media(max-width:680px){.hs-scard{padding:16px 14px}}
        .hs-back-link{font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--hs-ink3,#565278);text-decoration:none;transition:color .15s}
        .hs-back-link:hover{color:var(--domain-color,#ef5a6f)}
        .hs-backdrop{position:fixed;inset:0;background:color-mix(in srgb,var(--hs-bg,#03020a) 85%,transparent);backdrop-filter:blur(6px);z-index:30}
        .hs-dp{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--hs-nav,rgba(3,2,10,.99));border-top:1px solid var(--hs-border,rgba(255,255,255,.09));transform:translateY(100%);transition:transform .45s cubic-bezier(.16,1,.3,1);display:flex;flex-direction:column;max-height:62vh}
        .hs-dp.open{transform:translateY(0)}
        @media(max-width:680px){.hs-dp{max-height:78vh}}
        .hs-dp-bar{display:flex;align-items:center;padding:14px 20px 0;gap:12px;flex-shrink:0;flex-wrap:wrap}
        .hs-dp-badge{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--domain-color,#ef5a6f);padding:4px 10px;border:1px solid color-mix(in srgb,var(--domain-color,#ef5a6f) 55%,transparent);opacity:.85}
        .hs-dp-status{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.14em}
        .hs-dp-prog{font-family:var(--font-jetbrains,monospace);font-size:9px;color:var(--hs-ink3,#565278);letter-spacing:.14em;margin-left:auto}
        .hs-dp-close{font-family:var(--font-jetbrains,monospace);font-size:11px;color:var(--hs-ink3,#565278);cursor:pointer;padding:6px 12px;transition:color .15s;background:none;border:none;min-height:44px}
        .hs-dp-close:hover{color:var(--domain-color,#ef5a6f)}
        .hs-dp-body{padding:16px 20px 10px;flex:1;overflow-y:auto;display:flex;gap:32px;-webkit-overflow-scrolling:touch}
        .hs-dp-main{flex:1;min-width:0}
        .hs-dp-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(22px,3.5vw,44px);line-height:.95;letter-spacing:-.03em;color:var(--domain-color,#ef5a6f);margin-bottom:14px;text-wrap:balance;text-decoration:none;display:block;cursor:pointer;transition:opacity .15s}
        .hs-dp-title:hover{opacity:.75;text-decoration:underline;text-underline-offset:4px}
        .hs-dp-exc{font-family:var(--font-newsreader,serif);font-style:italic;font-size:clamp(14px,1.6vw,17px);line-height:1.8;color:var(--hs-ink2,#b4acd0);font-weight:300}
        .hs-dp-meta-row{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center}
        .hs-dp-pill{font-family:var(--font-jetbrains,monospace);font-size:9px;color:var(--hs-ink3,#565278);letter-spacing:.12em;padding:4px 10px;border:1px solid var(--hs-border2,rgba(255,255,255,.05))}
        .hs-dp-aside{width:180px;flex-shrink:0;border-left:1px solid var(--hs-border2,rgba(255,255,255,.05));padding-left:24px}
        .hs-dp-links-lbl{font-family:var(--font-jetbrains,monospace);font-size:8px;letter-spacing:.24em;text-transform:uppercase;color:var(--hs-ink3,#565278);margin-bottom:12px}
        .hs-dp-link{font-family:var(--font-newsreader,serif);font-style:italic;font-size:14px;color:var(--hs-ink2,#b4acd0);margin-bottom:8px;cursor:pointer;transition:color .15s;display:block;line-height:1.3;text-align:left;background:none;border:none;padding:0;width:100%}
        .hs-dp-link:hover{color:var(--domain-color,#ef5a6f)}
        @media(max-width:680px){.hs-dp-aside{display:none}.hs-dp-body{flex-direction:column}}
        .hs-dp-next-band{padding:10px 20px;background:color-mix(in srgb,var(--hs-ink,#f0eeff) 3%,transparent);border-top:1px solid var(--hs-border2,rgba(255,255,255,.05));display:flex;align-items:center;gap:14px;flex-shrink:0}
        .hs-dp-next-lbl{font-family:var(--font-jetbrains,monospace);font-size:8px;letter-spacing:.28em;text-transform:uppercase;color:var(--hs-ink3,#565278);white-space:nowrap;flex-shrink:0}
        .hs-dp-next-title{font-family:var(--font-fraunces,serif);font-style:italic;font-size:18px;color:var(--hs-ink2,#b4acd0);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hs-dp-next-arrow{font-family:var(--font-jetbrains,monospace);font-size:11px;color:var(--domain-color,#ef5a6f);flex-shrink:0;cursor:pointer;padding:8px 16px;border:1px solid currentColor;opacity:.6;transition:opacity .15s;background:none;min-height:44px}
        .hs-dp-next-arrow:hover{opacity:1}
        .hs-dp-nav{display:flex;padding:8px 20px 12px;border-top:1px solid var(--hs-border2,rgba(255,255,255,.05));flex-shrink:0;gap:8px}
        .hs-dp-btn{font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.1em;cursor:pointer;padding:8px 14px;border:1px solid var(--hs-border,rgba(255,255,255,.08));color:var(--hs-ink2,#b4acd0);transition:all .18s;display:flex;align-items:center;gap:8px;background:none;min-height:44px}
        .hs-dp-btn:disabled{opacity:.25;cursor:not-allowed}
        .hs-dp-btn:not(:disabled):hover{border-color:color-mix(in srgb,var(--domain-color,#ef5a6f) 45%,transparent);color:var(--hs-ink,#f0eeff)}
        .hs-arr{color:var(--domain-color,#ef5a6f);opacity:.85;font-size:13px}
        .hs-dp-btn-name{font-family:var(--font-fraunces,serif);font-style:italic;font-size:13px;color:var(--hs-ink,#f0eeff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px}
        @media(max-width:680px){.hs-dp-btn-name{display:none}}
        .hs-dp-next{margin-left:auto}
        .hs-hint{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.22em;color:color-mix(in srgb,var(--hs-ink,#f0eeff) 16%,transparent);text-transform:uppercase;z-index:5;pointer-events:none;white-space:nowrap}
        .hs-bookmark-ring{position:absolute;inset:-1px;border:1px solid rgba(90,169,239,.5);pointer-events:none;z-index:2}
        .hs-bookmark-label{position:absolute;top:-9px;left:10px;font-family:var(--font-jetbrains,monospace);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:#5aa9ef;background:var(--hs-bg,#03020a);padding:0 4px;pointer-events:none;z-index:3;white-space:nowrap}
        .hs-bookmark-dot{position:absolute;top:10px;right:10px;width:7px;height:7px;border-radius:50%;background:#5aa9ef;pointer-events:none;z-index:3}
        .hs-bookmark-dot::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid rgba(90,169,239,.4);animation:hs-bpulse 1.8s ease-out infinite}
        @keyframes hs-bpulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2.4);opacity:0}}
      `}</style>
    </div>
  );
}
