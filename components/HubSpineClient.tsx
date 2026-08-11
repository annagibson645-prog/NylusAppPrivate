'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
/* The rail is one vertical line per level, left to right. Thematic sections
   (and the "Other Concepts" catch-all) collect into a trailing lane that uses
   the hub's own domain color instead of a traffic-light one. */
type LaneKey = 'foundational' | 'intermediate' | 'advanced' | 'thematic';
const LANE_ORDER: LaneKey[] = ['foundational', 'intermediate', 'advanced', 'thematic'];
const LEVEL_LABEL: Record<LaneKey, string> = {
  foundational: 'Foundational', intermediate: 'Intermediate', advanced: 'Advanced', thematic: 'Other',
};

/* Domain colors are picked to glow on a near-black page. On the sepia palette
   they sit almost the same value as the paper and vanish, so `darken` pulls
   them toward ink for light mode instead of just fading them out. */
function hexToRgb(hex: string, darken = 0): string {
  const m = hex.replace('#', '');
  const n = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  const k = 1 - darken;
  const r = Math.round((parseInt(n.slice(0, 2), 16) || 0) * k);
  const g = Math.round((parseInt(n.slice(2, 4), 16) || 0) * k);
  const b = Math.round((parseInt(n.slice(4, 6), 16) || 0) * k);
  return `${r}, ${g}, ${b}`;
}

/* ── Domain sigils ──────────────────────────────────────────────────
   A geometric mark per domain, stroked in the domain color, to anchor the
   top of the page — the header was a title floating in empty space. */
const DOMAIN_GLYPH: Record<string, React.ReactNode> = {
  psychology: <><circle cx="32" cy="32" r="16" /><circle cx="32" cy="32" r="7" /><path d="M32 16V9M32 55v-7M16 32H9M55 32h-7" /></>,
  history: <><path d="M18 13h28M18 51h28M22 13l20 38M42 13L22 51" /></>,
  'behavioral-mechanics': <><circle cx="32" cy="15" r="4" /><circle cx="16" cy="45" r="4" /><circle cx="48" cy="45" r="4" /><path d="M30 19 18 41m16-22 12 22M20 45h24" /></>,
  'eastern-spirituality': <><circle cx="32" cy="32" r="17" strokeDasharray="88 19" transform="rotate(-38 32 32)" /><circle cx="32" cy="32" r="3.5" /></>,
  'cross-domain': <><circle cx="25" cy="32" r="13" /><circle cx="39" cy="32" r="13" /></>,
  'creative-practice': <><path d="M32 11 47 47H17z" /><path d="M32 29v18" /></>,
  business: <><path d="M13 49h38" /><path d="M18 41l9-11 8 6 12-17" /><path d="M40 19h7v7" /></>,
  'african-spirituality': <><path d="M32 11 47 32 32 53 17 32z" /><path d="M32 21v22M21 32h22" /></>,
};
const DEFAULT_GLYPH = <><circle cx="32" cy="32" r="16" /><circle cx="32" cy="32" r="3.5" /></>;

function DomainSigil({ domain }: { domain: string }) {
  return (
    <div className="hs-sigil" aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <circle className="hs-sigil-ring" cx="32" cy="32" r="30" />
        <g className="hs-sigil-glyph">{DOMAIN_GLYPH[domain] ?? DEFAULT_GLYPH}</g>
      </svg>
    </div>
  );
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

/* ── CometField ─────────────────────────────────────────────────────
   Comets falling downward, drawn as a tapered streak with a bright head and
   tinted with the hub's own domain color rather than the old fixed gold/rose
   embers. Two presets share the code:

     page — sized to the viewport, the ambient layer over empty background
     rail — sized to its parent box, deliberately sparse and faint because it
            sits behind the lanes and must not compete with their content

   Comets travel in a straight line. An earlier version added a sinusoidal x
   wobble, which combined with a round head and a trailing tail to read as
   swimming rather than falling — the wiggle is the whole tell, so there is
   none. Lean comes only from a comet's own constant sideways drift.

   The rail canvas deliberately measures its PARENT and not the scrolling
   content: a canvas as tall as a long rail is a multi-megabyte texture the
   compositor has to move every scroll frame, which is what made the rail
   wobble on mobile. Sized to the visible frame it stays put and costs nothing
   to scroll past. */
type CometVariant = 'page' | 'rail';
const COMET_PRESETS: Record<CometVariant, {
  perPx: number; min: number; max: number;
  speed: number; drift: number;
  rMin: number; rVar: number; tailMin: number; tailVar: number;
}> = {
  page: { perPx: 40, min: 18, max: 52, speed: 0.0022, drift: 0.00035, rMin: 0.45, rVar: 1.15, tailMin: 60, tailVar: 120 },
  rail: { perPx: 30, min: 12, max: 46, speed: 0.0032, drift: 0.00042, rMin: 0.3,  rVar: 0.85, tailMin: 26, tailVar: 54 },
};

type Comet = { x: number; vy: number; vx: number; r: number; tail: number; life: number; maxLife: number; bright: boolean };

function CometField({ variant, colorRgb, intensity, className, style }: {
  variant: CometVariant; colorRgb: string; intensity: number;
  className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const parent = canvas.parentElement;
    if (variant === 'rail' && !parent) return;
    const cfg = COMET_PRESETS[variant];

    let rafId = 0;
    let comets: Comet[] = [];
    let w = 0, h = 0;

    /* The slow end of the speed range is well off zero: a comet that crawls
       reads as drifting debris, not as something falling. Tail length scales
       with speed so the faster ones streak further, which is most of what
       sells the motion. */
    const spawn = (): Comet => {
      const rate = 0.55 + Math.random() * 0.75;
      return {
        x: Math.random(),
        vy: rate * cfg.speed,
        vx: (Math.random() - 0.5) * cfg.drift,
        r: Math.random() * cfg.rVar + cfg.rMin,
        tail: (cfg.tailMin + Math.random() * cfg.tailVar) * rate,
        life: Math.random(), maxLife: 0.62 + Math.random() * 0.35,
        bright: Math.random() < 0.55,
      };
    };

    const size = () => {
      const nw = variant === 'page' ? window.innerWidth : Math.round(parent!.getBoundingClientRect().width);
      const nh = variant === 'page' ? window.innerHeight : Math.round(parent!.getBoundingClientRect().height);
      /* Bail on a zero-sized box (hidden tab, not laid out yet) WITHOUT recording
         it — otherwise w/h latch at 0, every later measurement compares equal to
         the stored size, and the field never populates once the box is real. */
      if (nw < 1 || nh < 1) return;
      if (nw === w && nh === h) return;
      w = nw; h = nh;
      canvas.width = w; canvas.height = h;
      const count = Math.round(Math.min(cfg.max, Math.max(cfg.min, w / cfg.perPx)));
      comets = Array.from({ length: count }, spawn);
    };
    size();

    /* Width-driven resizing only. On mobile, scrolling shows/hides the browser
       chrome, which fires a stream of height-only resizes; reacting to those
       mid-scroll respawns the whole field and reads as a flicker. */
    let ro: ResizeObserver | undefined;
    const onResize = () => size();
    if (variant === 'page') window.addEventListener('resize', onResize);
    else { ro = new ResizeObserver(() => size()); ro.observe(parent!); }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      comets.forEach(c => {
        c.life += c.vy;
        c.x += c.vx;
        if (c.life > c.maxLife) { const n = spawn(); n.life = 0; Object.assign(c, n); }
        const t = c.life / c.maxLife;
        /* Fade in over the first tenth of the arc and out over the last fifth,
           so comets never pop into or out of existence mid-screen. */
        const fade = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1;
        const op = fade * intensity * (c.bright ? 1 : 0.66);
        if (op <= 0.002) return;

        const px = c.x * w;
        /* Head descends as life accrues, and the streak is drawn BEHIND it —
           up and against the sideways drift — so the bright end always leads
           the fall instead of trailing it. */
        const py = c.life * h;
        const ex = px - (c.vx / c.vy) * c.tail;
        const ey = py - c.tail;

        /* Most of the alpha is spent in the first fifth of the streak, so the
           comet reads as a bright leading edge dissolving behind it rather than
           an evenly-lit line with a blob on the end. */
        const grad = ctx.createLinearGradient(px, py, ex, ey);
        grad.addColorStop(0, `rgba(${colorRgb},${op})`);
        grad.addColorStop(0.18, `rgba(${colorRgb},${op * 0.55})`);
        grad.addColorStop(1, `rgba(${colorRgb},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = c.r * 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        /* Head kept smaller than the streak is wide — a full-radius disc on the
           front of a tapering tail is exactly the silhouette to avoid. */
        ctx.beginPath();
        ctx.arc(px, py, c.r * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRgb},${Math.min(1, op * 1.25)})`;
        ctx.fill();
      });
      if (!reduceMotion) rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (variant === 'page') window.removeEventListener('resize', onResize);
      ro?.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [variant, colorRgb, intensity]);

  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />;
}

/* Per-lane geometry, measured from the real dots so the colored line starts at
   the first mark and ends at the last one rather than floating past either. */
type LaneGeom = { markX: number; segTop: number; segHeight: number };
type RailLayout = Record<string, LaneGeom>;

function sameLayout(a: RailLayout | null, b: RailLayout): boolean {
  if (!a) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => {
    const x = a[k], y = b[k];
    return y && x.markX === y.markX && x.segTop === y.segTop && x.segHeight === y.segHeight;
  });
}

/* ── HubSpineClient ─────────────────────────────────────────────── */
export default function HubSpineClient({ title, domain, domainLabel, domainColor, excerpt, path, sections, unplaced }: HubSpineProps) {
  const [paletteKey, setPaletteKey] = useState<PaletteKey>('ember');
  const P = PALETTES[paletteKey];
  /* On sepia the comets draw on near-white paper, so the domain color has to be
     pulled toward ink to stay visible instead of just washing out. */
  const cometRgb = hexToRgb(domainColor, P.dark ? 0 : 0.5);

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

  /* Memoized: these feed the layout effect's dependency chain, and rebuilding
     them on every render would make that effect re-measure and re-set state in
     a loop on any hub that has unplaced concepts. */
  const rawSections: SpineSection[] = useMemo(() => unplaced.length > 0
    ? [...sections, { key:'__unplaced__', label:'Other Concepts', level:'thematic' as const, color:domainColor, badge:'', concepts:unplaced }]
    : sections, [sections, unplaced, domainColor]);

  /* One lane per level, in fixed left-to-right order, each holding every
     section of that level regardless of where it sat in the vault. */
  const lanes = useMemo(() => LANE_ORDER
    .map(level => ({ level, sections: rawSections.filter(s => s.level === level) }))
    .filter(l => l.sections.length > 0), [rawSections]);

  /* Reading order follows the lanes, so prev/next walks the rail as it reads:
     all of Foundational, then Intermediate, then Advanced, then Other. */
  const allSections = useMemo(() => lanes.flatMap(l => l.sections), [lanes]);
  const ORDER = useMemo(() => allSections.flatMap(s => s.concepts), [allSections]);
  const conceptMap = useMemo(() => new Map(ORDER.map(c => [c.id, c])), [ORDER]);
  const allKeys = useMemo(() => allSections.map(s => s.key), [allSections]);

  /* Exactly one section is open at a time, and it takes over the rail's own
     frame rather than stacking below it: click a dot and the lanes give way to
     that section in place; the back arrow puts the lanes right back. Nothing
     moves down the page, so the reading position never has to be hunted for. */
  const [openKey, setOpenKey] = useState<string | null>(null);
  const openOnly = useCallback((key: string | null) => setOpenKey(key), []);
  const toggleSection = useCallback((key: string) => {
    setOpenKey(prev => (prev === key ? null : key));
  }, []);
  /* A hub whose sections changed under us (palette/route reuse) must not keep
     pointing at a key that no longer exists. */
  useEffect(() => {
    setOpenKey(prev => (prev && allKeys.includes(prev) ? prev : null));
  }, [allKeys]);

  /* ── Rail layout: each lane's line measured from its own dots ──────── */
  const laneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [layout, setLayout] = useState<RailLayout | null>(null);

  const computeLayout = useCallback(() => {
    const next: RailLayout = {};
    for (const lane of lanes) {
      const el = laneRefs.current[lane.level];
      if (!el) return;
      const marks = lane.sections.map(s => dotRefs.current[s.key]?.querySelector<HTMLElement>('.hs-rail-mark') ?? null);
      if (marks.some(m => !m)) return;
      const rects = marks.map(m => m!.getBoundingClientRect());
      const box = el.getBoundingClientRect();
      const first = rects[0], last = rects[rects.length - 1];
      next[lane.level] = {
        markX:     first.left - box.left + first.width / 2,
        segTop:    first.top - box.top + first.height / 2,
        /* A lane holding a single section still gets a short stub of line so it
           reads as part of the rail rather than as a loose dot. */
        segHeight: Math.max(3, (last.top + last.height / 2) - (first.top + first.height / 2)),
      };
    }
    setLayout(prev => sameLayout(prev, next) ? prev : next);
  }, [lanes]);

  /* Recompute on WIDTH changes only. On mobile, scrolling shows/hides the browser
     chrome, which fires a stream of height-only resize events; re-running the
     layout mid-scroll repositions every absolutely-placed line and is what made
     the rail visibly wobble. Height changes can't affect this layout. */
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
  const railFrameRef  = useRef<HTMLDivElement>(null);

  const openSection = useMemo(
    () => allSections.find(s => s.key === openKey) ?? null,
    [allSections, openKey],
  );
  const openLevelColor = openSection && openSection.level !== 'thematic'
    ? LEVEL_COLORS[openSection.level][P.dark ? 'dark' : 'light']
    : domainColor;

  /* The frame keeps its place on screen through the swap, so the only scrolling
     needed is when it has drifted out of the comfortable band — pulling it back
     under the nav on every toggle would fight the reader. */
  const didSwap = useRef(false);
  useEffect(() => {
    if (!didSwap.current) { didSwap.current = true; return; }
    const el = railFrameRef.current; if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 64 || top > window.innerHeight * 0.55) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [openKey]);

  /* The lanes unmount while a section holds the frame, so their measured
     geometry has to be taken again the moment they come back. */
  useEffect(() => {
    if (openKey) return;
    const id = requestAnimationFrame(() => computeLayout());
    return () => cancelAnimationFrame(id);
  }, [openKey, computeLayout]);

  const bookmarkKey = `nylus-bookmark-${path ?? title}`;
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(bookmarkKey);
      if (saved) {
        setBookmarkId(saved);
        const sec = allSections.find(s => s.concepts.some(c => c.id === saved));
        if (sec) {
          openOnly(sec.key);
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
      openOnly(sec.key);
      scrollDotIntoView(sec.key);
    }
    setTimeout(() => document.querySelector(`[data-cid="${nextId}"]`)?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 80);
  }, [activeIdx, ORDER, allSections, scrollDotIntoView, openOnly]);

  /* Escape unwinds one layer at a time: the concept drawer first, then the open
     section back to the lanes. */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (activeId) closePanel(); else setOpenKey(null); }
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [activeId, closePanel, navigate]);

  /* The section body, rendered into the frame the lanes just vacated. Its own
     header is the stage head above it, so it carries cards only. */
  const renderPanel = (sec: SpineSection) => {
    const [lead, ...rest] = sec.concepts;
    const leftCol  = rest.filter((_, i) => i % 2 === 0);
    const rightCol = rest.filter((_, i) => i % 2 === 1);
    return (
      <div className="hs-panel">
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
  };

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
      <CometField
        variant="page"
        colorRgb={cometRgb}
        intensity={P.dark ? 0.3 : 0.26}
        style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}
      />
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
          <DomainSigil domain={domain} />
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

        {/* One vertical, level-colored line per lane — Foundational on the far
            left, then Intermediate, then Advanced — each carrying its own
            sections top to bottom. The comet canvas sits in the frame, outside
            the scroller, so it stays fixed while the lanes scroll under it.

            Opening a section swaps the lanes out for that section IN THIS SAME
            FRAME: the concepts land exactly where the lines were, and the back
            arrow returns the lines. Nothing below the frame moves, so there is
            never anything to scroll down and find. */}
        <div className="hs-rail-frame" ref={railFrameRef}>
          {openSection ? (
            <div key={openSection.key} className="hs-stage" style={{ ['--dc' as any]: openLevelColor }}>
              <div className="hs-stage-head">
                <button className="hs-stage-back" onClick={() => setOpenKey(null)}>
                  <span className="hs-stage-back-arr">←</span>
                  <span>all sections</span>
                </button>
                <div className="hs-stage-id">
                  <span className="hs-stage-level">{LEVEL_LABEL[openSection.level]}</span>
                  <span className="hs-stage-name">{openSection.label}</span>
                </div>
                {openSection.badge && <span className="hs-stage-badge">{openSection.badge}</span>}
                <span className="hs-stage-count">{openSection.concepts.length} concepts</span>
              </div>
              <div className="hs-panels">{renderPanel(openSection)}</div>
            </div>
          ) : (
          <div className="hs-rail-live">
          <CometField variant="rail" colorRgb={cometRgb} intensity={P.dark ? 0.2 : 0.17} className="hs-rail-sparks" />
          <div className="hs-rail-scroll" ref={railScrollRef}>
          <div className="hs-rail-inner" style={{ ['--lanes' as any]: lanes.length }}>
            {lanes.map(lane => {
              const dc = lane.level === 'thematic'
                ? domainColor
                : LEVEL_COLORS[lane.level][P.dark ? 'dark' : 'light'];
              const g = layout?.[lane.level];
              return (
                <div key={lane.level} className="hs-rail-lane" style={{ ['--dc' as any]: dc }}>
                  <div className="hs-rail-lane-head">
                    <span className="hs-rail-lane-name">{LEVEL_LABEL[lane.level]}</span>
                    <span className="hs-rail-lane-count">{lane.sections.length} {lane.sections.length === 1 ? 'section' : 'sections'}</span>
                  </div>
                  <div className="hs-rail-lane-body" ref={el => { laneRefs.current[lane.level] = el; }}>
                    <div className="hs-rail-zone" />
                    {g && <div className="hs-rail-track" style={{ left: g.markX }} />}
                    {g && <div className="hs-rail-seg" style={{ top: g.segTop, height: g.segHeight, left: g.markX - 1.5 }} />}
                    <div className="hs-rail-dots">
                      {lane.sections.map(sec => {
                        const isOpen = openKey === sec.key;
                        return (
                          <button
                            key={sec.key}
                            ref={el => { dotRefs.current[sec.key] = el; }}
                            className={`hs-rail-dot${isOpen ? ' active' : ''}`}
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
              );
            })}
          </div>
          </div>
          </div>
          )}
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
                      openOnly(sec.key);
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

      {!activeC && (
        <div className="hs-hint" aria-hidden="true">
          {openSection ? 'tap any concept to explore · esc to go back' : 'tap a section to open it here'}
        </div>
      )}

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
        /* The header block drifts up on load, one element at a time. */
        .hs-header > *{animation:hs-rise .6s cubic-bezier(.16,1,.3,1) both}
        .hs-header > *:nth-child(1){animation-delay:0s}
        .hs-header > *:nth-child(2){animation-delay:.07s}
        .hs-header > *:nth-child(3){animation-delay:.13s}
        .hs-header > *:nth-child(4){animation-delay:.2s}
        .hs-header > *:nth-child(5){animation-delay:.27s}
        .hs-header > *:nth-child(6){animation-delay:.33s}
        @keyframes hs-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        /* Domain sigil: a slow-turning dashed ring around a fixed geometric mark,
           over a breathing glow — gives the top of the page something to sit on. */
        .hs-sigil{position:relative;width:92px;height:92px;margin:0 auto 20px;color:var(--domain-color,#ef5a6f)}
        .hs-sigil svg{position:relative;width:100%;height:100%;overflow:visible;display:block}
        .hs-sigil::before{content:'';position:absolute;inset:-24%;border-radius:50%;z-index:-1;
          background:radial-gradient(circle,color-mix(in srgb,var(--domain-color,#ef5a6f) 26%,transparent) 0,transparent 68%);
          will-change:opacity,transform;animation:hs-sigil-breathe 5.6s ease-in-out infinite}
        .hs-sigil-ring{fill:none;stroke:currentColor;stroke-width:1;opacity:.3;stroke-dasharray:3 8;
          transform-origin:32px 32px;animation:hs-sigil-spin 44s linear infinite}
        .hs-sigil-glyph{fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;opacity:.92}
        @keyframes hs-sigil-spin{to{transform:rotate(360deg)}}
        @keyframes hs-sigil-breathe{0%,100%{opacity:.55;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}
        @media (prefers-reduced-motion:reduce){
          .hs-header > *{animation:hs-fade-in .25s ease both}
          .hs-sigil-ring,.hs-sigil::before{animation:none}
        }
        @media(max-width:680px){.hs-sigil{width:72px;height:72px;margin-bottom:16px}}
        .hs-chip{font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--domain-color,#ef5a6f);opacity:.75;margin-bottom:14px}
        .hs-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(42px,8.5vw,110px);line-height:.88;letter-spacing:-.04em;color:var(--hs-ink,#f0eeff);margin-bottom:20px;text-wrap:balance}
        .hs-lede{font-family:var(--font-newsreader,serif);font-style:italic;font-size:clamp(15px,1.9vw,18px);line-height:1.82;color:var(--hs-ink2,#b4acd0);max-width:500px;margin:0 auto 26px}
        .hs-stats{display:flex;justify-content:center;gap:32px;flex-wrap:wrap;margin-bottom:18px}
        .hs-stat{font-family:var(--font-jetbrains,monospace);font-size:11px;color:var(--hs-ink3,#565278);letter-spacing:.14em}
        .hs-stat b{color:var(--domain-color,#ef5a6f);font-weight:400}
        .hs-rail-legend{display:flex;justify-content:center;gap:20px;flex-wrap:wrap}
        .hs-rail-legend span{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--hs-ink3,#565278)}
        .hs-rail-legend-dot{width:8px;height:8px;border-radius:50%;background:var(--dc);box-shadow:0 0 7px 1px var(--dc);display:inline-block}
        /* The frame is the one place the rail and an open section ever occupy:
           whichever is showing starts at the same point on the page, so opening
           a section is a swap in place, not a jump somewhere further down.
           scroll-margin keeps it clear of the fixed nav when it is scrolled to. */
        .hs-rail-frame{position:relative;margin:8px auto 0;max-width:1000px;isolation:isolate;scroll-margin-top:72px}
        /* Both faces of the swap enter the same way — a short rise — so the
           frame reads as one surface turning over rather than two views. */
        .hs-rail-live,.hs-stage{position:relative;animation:hs-swap-in .42s cubic-bezier(.16,1,.3,1) both}
        @keyframes hs-swap-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.hs-rail-live,.hs-stage{animation:hs-fade-in .2s ease both}}
        /* Same rule as a lane head — same rhythm, same level color, so the open
           section looks like the lane it came out of. */
        .hs-stage-head{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:0 2px 12px;
          border-bottom:1px solid color-mix(in srgb, var(--dc) 40%, transparent)}
        .hs-stage-back{display:inline-flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;padding:6px 0;
          font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.2em;text-transform:uppercase;
          color:var(--hs-ink3,#565278);transition:color .15s;flex-shrink:0}
        .hs-stage-back:hover{color:var(--dc)}
        .hs-stage-back-arr{font-size:13px;line-height:1;color:var(--dc);transition:transform .22s cubic-bezier(.16,1,.3,1)}
        .hs-stage-back:hover .hs-stage-back-arr{transform:translateX(-4px)}
        .hs-stage-id{display:flex;flex-direction:column;gap:3px;min-width:0}
        .hs-stage-level{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--dc)}
        .hs-stage-name{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(18px,2.6vw,26px);letter-spacing:-.02em;line-height:1.05;color:var(--hs-ink,#f0eeff)}
        .hs-stage-badge{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--dc);opacity:.8;
          border:1px solid color-mix(in srgb, var(--dc) 45%, transparent);padding:3px 9px}
        .hs-stage-count{margin-left:auto;font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--hs-ink3,#565278);flex-shrink:0}
        @media(max-width:680px){.hs-stage-count{margin-left:0}}
        .hs-rail-scroll{position:relative;z-index:1;overflow-y:auto;overflow-x:hidden;padding:10px 4px;
          max-height:min(62vh,720px);
          scrollbar-width:none;-ms-overflow-style:none;
          -webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;
          -webkit-mask-image:linear-gradient(180deg,transparent,#000 26px,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(180deg,transparent,#000 26px,#000 calc(100% - 26px),transparent)}
        .hs-rail-scroll::-webkit-scrollbar{display:none;width:0;height:0}
        /* Lanes sit side by side and share one scroller, so the three levels stay
           aligned to each other as you move down them. translateZ promotes the
           scrolling content to its own layer so the browser can move it without
           repainting — without this, mobile scroll repaints the whole rail every
           frame and the absolutely-placed lines visibly shimmer. */
        .hs-rail-inner{position:relative;display:grid;grid-template-columns:repeat(var(--lanes,3),minmax(0,1fr));gap:20px;
          align-items:start;min-height:100%;transform:translateZ(0);backface-visibility:hidden}
        /* Held off the lane headers and the bottom edge, so the band the eye
           actually reads stays clear of moving pixels. */
        .hs-rail-sparks{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;
          -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 22%,#000 84%,transparent 100%);
          mask-image:linear-gradient(180deg,transparent 0,#000 22%,#000 84%,transparent 100%)}
        /* Each lane is its own positioning context: its line, wash, and dots are
           measured and placed against the lane, not the rail as a whole. */
        .hs-rail-lane{padding-left:14px}
        .hs-rail-lane-body{position:relative}
        .hs-rail-lane-head{position:relative;z-index:3;display:flex;flex-direction:column;gap:3px;padding:0 0 12px 2px;
          border-bottom:1px solid color-mix(in srgb, var(--dc) 40%, transparent)}
        .hs-rail-lane-name{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(15px,1.9vw,21px);letter-spacing:-.02em;line-height:1;color:var(--dc)}
        .hs-rail-lane-count{font-family:var(--font-jetbrains,monospace);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--hs-ink3,#565278)}
        .hs-rail-track{position:absolute;top:0;bottom:0;width:1px;background:var(--hs-border,rgba(255,255,255,.09));z-index:1}
        /* The wash fills the lane and fades out to the right across the labels, so
           the color reads strongest at the line itself and never turns the section
           names into low-contrast text. */
        .hs-rail-zone{position:absolute;inset:0;z-index:1;pointer-events:none;
          background:linear-gradient(180deg,transparent 0,color-mix(in srgb, var(--dc) 17%, transparent) 70px,color-mix(in srgb, var(--dc) 17%, transparent) calc(100% - 70px),transparent 100%);
          -webkit-mask-image:linear-gradient(to right,#000 0,#000 30%,transparent 100%);
          mask-image:linear-gradient(to right,#000 0,#000 30%,transparent 100%)}
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
        .hs-rail-dots{position:relative;z-index:3;display:flex;flex-direction:column;gap:30px;padding:26px 0 20px}
        .hs-rail-dot{flex:0 0 auto;width:100%;background:none;border:none;cursor:pointer;padding:0;
          display:grid;grid-template-columns:14px minmax(0,1fr);column-gap:12px;align-items:center;justify-items:start;
          text-align:left;font-family:inherit;color:inherit;scroll-snap-align:center}
        .hs-rail-mark{grid-row:1 / 3;align-self:center;width:14px;height:14px;border-radius:50%;border:2px solid var(--dc);background:var(--hs-bg,#03020a);transition:transform .25s cubic-bezier(.16,1,.3,1),background .2s,box-shadow .25s;position:relative;z-index:2}
        .hs-rail-mark::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:1px solid var(--dc);opacity:0;transform:scale(.7);pointer-events:none}
        .hs-rail-dot.active .hs-rail-mark{background:var(--dc);transform:scale(1.3);box-shadow:0 0 12px 2px color-mix(in srgb,var(--dc) 45%,transparent)}
        .hs-rail-dot.active .hs-rail-mark::after{animation:hs-dot-ripple .62s cubic-bezier(.16,1,.3,1) forwards}
        @keyframes hs-dot-ripple{0%{opacity:.85;transform:scale(.7)}100%{opacity:0;transform:scale(2.4)}}
        .hs-rail-name{grid-column:2;grid-row:1;font-family:var(--font-newsreader,serif);font-style:italic;font-size:14px;color:var(--hs-ink2,#b4acd0);text-align:left;line-height:1.28;transition:color .15s}
        .hs-rail-dot.active .hs-rail-name{color:var(--hs-ink,#f0eeff)}
        .hs-rail-count{grid-column:2;grid-row:2;font-family:var(--font-jetbrains,monospace);font-size:9px;color:var(--hs-ink3,#565278)}
        /* Three lanes side by side get too narrow to read on a phone, so they
           stack into three color-coded groups instead — same lines, same colors,
           one under the other. */
        @media(max-width:760px){
          .hs-rail-inner{grid-template-columns:1fr;gap:34px}
          .hs-rail-scroll{max-height:min(58vh,560px)}
          .hs-rail-dots{gap:26px;padding:20px 0 16px}
        }
        .hs-panels{margin-top:20px;display:flex;flex-direction:column;gap:24px}
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
