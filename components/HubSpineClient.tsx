'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

/* ── Types ─────────────────────────────────────────────────────── */

export interface SpineConcept {
  id: string;
  title: string;
  excerpt?: string;
  sources: number;
  backlinkCount: number;
  status?: string;
  links: string[];
}

export interface SpineSection {
  key: string;
  label: string;
  level: 'foundational' | 'intermediate' | 'advanced' | 'thematic';
  color: string;
  badge: string;
  concepts: SpineConcept[];
}

export interface HubSpineProps {
  title: string;
  domain: string;
  domainLabel: string;
  domainColor: string;
  excerpt?: string;
  path?: string;
  sections: SpineSection[];
  unplaced: SpineConcept[];
}

/* ── Palette system ─────────────────────────────────────────────── */

const PALETTES = {
  ember: {
    bg:      '#03020a',
    bg2:     '#0d0b18',
    bg3:     '#15131f',
    ink:     '#f0eeff',
    ink2:    '#b4acd0',
    ink3:    '#565278',
    card:    'rgba(13,11,24,.92)',
    card2:   'rgba(9,7,18,.88)',
    cardHov: 'rgba(18,15,32,.97)',
    border:  'rgba(255,255,255,.07)',
    border2: 'rgba(255,255,255,.04)',
    nav:     'rgba(3,2,10,.96)',
    dark:    true,
  },
  aurora: {
    bg:      '#04080f',
    bg2:     '#08101e',
    bg3:     '#0d1830',
    ink:     '#e8f0ff',
    ink2:    '#a0b8e8',
    ink3:    '#3a5070',
    card:    'rgba(8,16,30,.92)',
    card2:   'rgba(5,11,22,.88)',
    cardHov: 'rgba(12,22,42,.97)',
    border:  'rgba(160,200,255,.08)',
    border2: 'rgba(160,200,255,.04)',
    nav:     'rgba(4,8,15,.96)',
    dark:    true,
  },
  monochrome: {
    bg:      '#080808',
    bg2:     '#111111',
    bg3:     '#1a1a1a',
    ink:     '#f5f5f5',
    ink2:    '#aaaaaa',
    ink3:    '#555555',
    card:    'rgba(17,17,17,.92)',
    card2:   'rgba(10,10,10,.88)',
    cardHov: 'rgba(24,24,24,.97)',
    border:  'rgba(255,255,255,.07)',
    border2: 'rgba(255,255,255,.04)',
    nav:     'rgba(8,8,8,.96)',
    dark:    true,
  },
  sepia: {
    bg:      '#f4f0e8',
    bg2:     '#ede6d4',
    bg3:     '#e6dcc8',
    ink:     '#1a1420',
    ink2:    '#4a3e60',
    ink3:    '#9080a8',
    card:    'rgba(255,252,248,.97)',
    card2:   'rgba(248,244,238,.93)',
    cardHov: 'rgba(240,235,225,.99)',
    border:  'rgba(0,0,0,.08)',
    border2: 'rgba(0,0,0,.05)',
    nav:     'rgba(244,240,232,.97)',
    dark:    false,
  },
} as const;

type PaletteKey = keyof typeof PALETTES;

/* ── Helpers ─────────────────────────────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  stable:     '#6bab8a',
  developing: '#c8a460',
  stub:       '#9f7ec0',
};

const PALETTE_ACCENT: Record<PaletteKey, string> = {
  ember:      '#c8733a',
  aurora:     '#3a78c8',
  monochrome: '#888888',
  sepia:      '#7a5c3a',
};

/* ── PaletteDot ──────────────────────────────────────────────────── */

function PaletteDot({
  name, active, color, onClick,
}: {
  name: PaletteKey; active: boolean; color: string; onClick: () => void;
}) {
  return (
    <button
      aria-label={`Switch to ${name} palette`}
      onClick={onClick}
      style={{
        width: 9, height: 9, borderRadius: '50%',
        background: color,
        border: active ? '1.5px solid rgba(255,255,255,.6)' : '1.5px solid transparent',
        cursor: 'pointer', padding: 0, flexShrink: 0,
        transition: 'border-color .15s, transform .15s',
        transform: active ? 'scale(1.3)' : 'scale(1)',
      }}
    />
  );
}

/* ── Sparks canvas ───────────────────────────────────────────────── */

function SparksCanvas({ isSepia }: { isSepia: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;

    function resize() {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const N = 40;
    const sparks = Array.from({ length: N }, () => ({
      x:       Math.random(),
      y:       0.6 + Math.random() * 0.4,
      vy:      (0.28 + Math.random() * 0.5) * 0.00055,
      vx:      (Math.random() - 0.5) * 0.00028,
      r:       Math.random() * 1.5 + 0.4,
      life:    Math.random(),
      maxLife: 0.65 + Math.random() * 0.35,
      gold:    Math.random() < 0.55,
    }));

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparks.forEach(s => {
        s.life += s.vy;
        s.x    += s.vx + Math.sin(s.life * 20) * 0.00012;

        if (s.life > s.maxLife) {
          s.x = Math.random();
          s.y = 0.82 + Math.random() * 0.18;
          s.life = 0;
          s.vx   = (Math.random() - 0.5) * 0.00028;
        }

        const t       = s.life / s.maxLife;
        const opacity = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1;
        const alpha   = opacity * (isSepia ? 0.10 : 0.28);

        ctx.beginPath();
        ctx.arc(
          s.x * canvas.width,
          (1 - s.life) * canvas.height,
          s.r, 0, Math.PI * 2
        );
        ctx.fillStyle = s.gold
          ? `rgba(255,200,60,${alpha})`
          : `rgba(239,90,111,${alpha})`;
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, [isSepia]);

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

/* ── Main component ──────────────────────────────────────────────── */

export default function HubSpineClient({
  title,
  domain,
  domainLabel,
  domainColor,
  excerpt,
  path,
  sections,
  unplaced,
}: HubSpineProps) {

  /* Palette state */
  const [paletteKey, setPaletteKey] = useState<PaletteKey>('ember');
  const P = PALETTES[paletteKey];

  /* Sync palette with data-theme attribute */
  useEffect(() => {
    const sync = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme === 'sepia') {
        setPaletteKey('sepia');
        return;
      }
      try {
        const saved = localStorage.getItem('nylus-hub-palette') as PaletteKey | null;
        if (saved && saved in PALETTES && saved !== 'sepia') {
          setPaletteKey(saved);
        } else {
          setPaletteKey('ember');
        }
      } catch {
        setPaletteKey('ember');
      }
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

  /* Build ordered flat concept list for prev/next */
  const allSections: SpineSection[] = unplaced.length > 0
    ? [...sections, {
        key: '__unplaced__',
        label: 'Other Concepts',
        level: 'thematic' as const,
        color: domainColor,
        badge: '',
        concepts: unplaced,
      }]
    : sections;

  const ORDER: SpineConcept[] = allSections.flatMap(s => s.concepts);
  const conceptMap = new Map(ORDER.map(c => [c.id, c]));

  /* Collapsed state */
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleSection = useCallback((key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  /* Detail panel */
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeC   = activeId ? conceptMap.get(activeId) : null;
  const activeIdx = activeId ? ORDER.findIndex(c => c.id === activeId) : -1;

  const conceptSection = useCallback((id: string) =>
    allSections.find(s => s.concepts.some(c => c.id === id)),
  [allSections]);

  const openConcept = useCallback((id: string) => setActiveId(id), []);
  const closePanel  = useCallback(() => setActiveId(null), []);

  const navigate = useCallback((dir: number) => {
    if (activeIdx < 0) return;
    const next = activeIdx + dir;
    if (next < 0 || next >= ORDER.length) return;
    const nextId = ORDER[next].id;
    setActiveId(nextId);
    const sec = allSections.find(s => s.concepts.some(c => c.id === nextId));
    if (sec) setCollapsed(prev => { const n = new Set(prev); n.delete(sec.key); return n; });
    setTimeout(() => {
      document.querySelector(`[data-cid="${nextId}"]`)?.scrollIntoView({
        behavior: 'smooth', block: 'nearest',
      });
    }, 80);
  }, [activeIdx, ORDER, allSections]);

  /* Keyboard nav */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     closePanel();
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [closePanel, navigate]);

  const totalConcepts = ORDER.length;
  const totalBl = ORDER.reduce((a, c) => a + c.backlinkCount, 0);

  /* CSS variable injection from JS palette state */
  const rootVars = {
    '--hs-bg':      P.bg,
    '--hs-bg2':     P.bg2,
    '--hs-ink':     P.ink,
    '--hs-ink2':    P.ink2,
    '--hs-ink3':    P.ink3,
    '--hs-card':    P.card,
    '--hs-card2':   P.card2,
    '--hs-cardHov': P.cardHov,
    '--hs-border':  P.border,
    '--hs-border2': P.border2,
    '--hs-nav':     P.nav,
    '--domain-color': domainColor,
  } as React.CSSProperties;

  /* ── Render ── */
  return (
    <div className="hs-root" style={rootVars}>
      <SparksCanvas isSepia={!P.dark} />

      {/* Domain color stripe under nav */}
      <div className="hs-stripe" />

      {/* Nav */}
      <nav className="hs-nav">
        <div className="hs-nav-inner">
          <span className="hs-nav-bread">{domainLabel}</span>
          <span className="hs-nav-sep" />
          <span className="hs-nav-title">{title}</span>

          <div className="hs-nav-right">
            {/* Palette dots — only in dark palettes */}
            {P.dark && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginRight: 6 }}>
                {(['ember', 'aurora', 'monochrome'] as PaletteKey[]).map(k => (
                  <PaletteDot
                    key={k}
                    name={k}
                    active={paletteKey === k}
                    color={PALETTE_ACCENT[k]}
                    onClick={() => switchPalette(k)}
                  />
                ))}
              </div>
            )}
            <Link href={`/domain/${domain}`} className="hs-nav-link">← {domainLabel}</Link>
            <Link href="/" className="hs-nav-link">constellation</Link>
            {path && (
              <a
                href={`obsidian://open?vault=NylusS&file=${encodeURIComponent(path)}`}
                className="hs-nav-link"
              >
                obsidian ↗
              </a>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main scroll */}
      <div className="hs-wrap">

        {/* Header */}
        <header className="hs-header">
          <div className="hs-chip">{domainLabel} · Hub</div>
          <h1 className="hs-title">{title}</h1>
          {excerpt && <p className="hs-lede">{excerpt}</p>}
          <div className="hs-stats">
            <span className="hs-stat"><b>{totalConcepts}</b> concepts</span>
            <span className="hs-stat"><b>{allSections.length}</b> levels</span>
            {totalBl > 0 && <span className="hs-stat"><b>{totalBl}</b> backlinks</span>}
          </div>
        </header>

        {/* Spine */}
        <div className="hs-spine-wrap">
          <div className="hs-spine-line" />
          <div className="hs-spine-pulse" />

          {allSections.map((sec, si) => {
            const isCollapsed = collapsed.has(sec.key);
            const lead = sec.concepts[0];
            const rest = sec.concepts.slice(1);
            const leftCol  = rest.filter((_, i) => i % 2 === 0);
            const rightCol = rest.filter((_, i) => i % 2 === 1);

            return (
              <div key={sec.key} className={`hs-sec hs-sec-${si}`}>
                <div className="hs-sec-num">0{si + 1}</div>
                <div className="hs-sec-mark" />

                {/* Section header */}
                <button
                  className={`hs-sec-header${isCollapsed ? ' collapsed' : ''}`}
                  onClick={() => toggleSection(sec.key)}
                  aria-expanded={!isCollapsed}
                >
                  <span className="hs-sec-name">{sec.label}</span>
                  {sec.badge && <span className="hs-sec-badge">{sec.badge}</span>}
                  <span className="hs-sec-count">· {sec.concepts.length} concepts</span>
                  <span className="hs-sec-chevron" aria-hidden="true">▾</span>
                </button>

                {/* Section body */}
                <div className={`hs-sec-body${isCollapsed ? ' collapsed' : ''}`}>

                  {/* Bridge / lead card */}
                  {lead && (
                    <button
                      className="hs-bridge"
                      data-cid={lead.id}
                      onClick={() => openConcept(lead.id)}
                    >
                      <div className="hs-bridge-meta">Lead Concept</div>
                      <div className="hs-bridge-title">{lead.title}</div>
                      {lead.excerpt && (
                        <div className="hs-bridge-exc">
                          {lead.excerpt.slice(0, 240)}{lead.excerpt.length > 240 ? '…' : ''}
                        </div>
                      )}
                      <div className="hs-bridge-foot">
                        {lead.sources > 0 && `${lead.sources} src · `}
                        {lead.backlinkCount > 0 && `${lead.backlinkCount} bl · `}
                        {lead.status && `● ${lead.status}`}
                      </div>
                    </button>
                  )}

                  {/* Two-column supporting cards */}
                  {rest.length > 0 && (
                    <div className="hs-two-col">
                      <div className="hs-col">
                        {leftCol.map(c => (
                          <button
                            key={c.id}
                            className="hs-scard"
                            data-cid={c.id}
                            onClick={() => openConcept(c.id)}
                          >
                            <span className="hs-scard-hint">open ↗</span>
                            <div className="hs-scard-title">{c.title}</div>
                            {c.excerpt && (
                              <div className="hs-scard-exc">
                                {c.excerpt.slice(0, 120)}{c.excerpt.length > 120 ? '…' : ''}
                              </div>
                            )}
                            <div className="hs-scard-meta">
                              {c.sources > 0 && `${c.sources} src · `}
                              {c.backlinkCount > 0 && `${c.backlinkCount} bl`}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="hs-col">
                        {rightCol.map(c => (
                          <button
                            key={c.id}
                            className="hs-scard hs-scard-right"
                            data-cid={c.id}
                            onClick={() => openConcept(c.id)}
                          >
                            <span className="hs-scard-hint">open ↗</span>
                            <div className="hs-scard-title">{c.title}</div>
                            {c.excerpt && (
                              <div className="hs-scard-exc">
                                {c.excerpt.slice(0, 120)}{c.excerpt.length > 120 ? '…' : ''}
                              </div>
                            )}
                            <div className="hs-scard-meta">
                              {c.sources > 0 && `${c.sources} src · `}
                              {c.backlinkCount > 0 && `${c.backlinkCount} bl`}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="hs-sec-gap" />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 64 }}>
          <Link href={`/domain/${domain}`} className="hs-back-link">
            ← All {domainLabel} hubs
          </Link>
        </div>
      </div>

      {/* Backdrop */}
      {activeC && (
        <div className="hs-backdrop" onClick={closePanel} aria-hidden="true" />
      )}

      {/* Detail panel */}
      <div
        className={`hs-dp${activeC ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={activeC?.title ?? ''}
      >
        {/* Bar */}
        <div className="hs-dp-bar">
          {activeC && (() => {
            const sec = conceptSection(activeC.id);
            return (
              <>
                <span className="hs-dp-badge">{sec?.badge || sec?.label}</span>
                <span
                  className="hs-dp-status"
                  style={{ color: STATUS_COLOR[activeC.status ?? ''] ?? P.ink3 }}
                >
                  ● {activeC.status ?? 'unknown'}
                </span>
              </>
            );
          })()}
          <span className="hs-dp-prog">
            {activeIdx >= 0 ? `${activeIdx + 1} / ${ORDER.length}` : ''}
          </span>
          <button className="hs-dp-close" onClick={closePanel} aria-label="Close">
            ✕ close
          </button>
        </div>

        {/* Body */}
        <div className="hs-dp-body">
          <div className="hs-dp-main">
            <div className="hs-dp-title">{activeC?.title}</div>
            {activeC?.excerpt && (
              <div className="hs-dp-exc">{activeC.excerpt}</div>
            )}
            <div className="hs-dp-meta-row">
              {activeC && activeC.sources > 0 && (
                <span className="hs-dp-pill">{activeC.sources} sources</span>
              )}
              {activeC && activeC.backlinkCount > 0 && (
                <span className="hs-dp-pill">{activeC.backlinkCount} backlinks</span>
              )}
              {activeC && (
                <Link
                  href={`/concept/${activeC.id}`}
                  className="hs-dp-page-link"
                  onClick={closePanel}
                >
                  Open page →
                </Link>
              )}
            </div>
          </div>

          {/* Linked concepts aside */}
          {activeC && activeC.links.length > 0 && (
            <div className="hs-dp-aside">
              <div className="hs-dp-links-lbl">Linked Concepts</div>
              {activeC.links.slice(0, 6).map(lid => {
                const lc = conceptMap.get(lid);
                if (!lc) return null;
                return (
                  <button
                    key={lid}
                    className="hs-dp-link"
                    onClick={() => {
                      setActiveId(lid);
                      const sec = allSections.find(s => s.concepts.some(c => c.id === lid));
                      if (sec) setCollapsed(prev => { const n = new Set(prev); n.delete(sec.key); return n; });
                    }}
                  >
                    {lc.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Up next band */}
        {activeIdx >= 0 && activeIdx < ORDER.length - 1 && (
          <div className="hs-dp-next-band">
            <span className="hs-dp-next-lbl">Up next</span>
            <span className="hs-dp-next-title">{ORDER[activeIdx + 1]?.title}</span>
            <button className="hs-dp-next-arrow" onClick={() => navigate(1)}>→</button>
          </div>
        )}

        {/* Prev / next nav */}
        <div className="hs-dp-nav">
          <button
            className="hs-dp-btn hs-dp-prev"
            onClick={() => navigate(-1)}
            disabled={activeIdx <= 0}
          >
            <span className="hs-arr">←</span>
            <span className="hs-dp-btn-name">
              {activeIdx > 0 ? ORDER[activeIdx - 1]?.title : ''}
            </span>
          </button>
          <button
            className="hs-dp-btn hs-dp-next"
            onClick={() => navigate(1)}
            disabled={activeIdx >= ORDER.length - 1}
          >
            <span className="hs-dp-btn-name">
              {activeIdx < ORDER.length - 1 ? ORDER[activeIdx + 1]?.title : ''}
            </span>
            <span className="hs-arr">→</span>
          </button>
        </div>
      </div>

      {!activeC && (
        <div className="hs-hint" aria-hidden="true">Click any concept to explore</div>
      )}

      <style>{`
        /* ── Root ────────────────────────────────────────────── */
        .hs-root {
          min-height: 100vh;
          background: var(--hs-bg, #03020a);
          color: var(--hs-ink, #f0eeff);
          overflow-x: hidden;
          position: relative;
        }

        /* ── Stripe ─────────────────────────────────────────── */
        .hs-stripe {
          position: fixed; top: 52px; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg,
            transparent,
            var(--domain-color, #ef5a6f) 40%,
            var(--domain-color, #ef5a6f) 60%,
            transparent);
          opacity: .65; pointer-events: none; z-index: 20;
        }

        /* ── Nav ─────────────────────────────────────────────── */
        .hs-nav {
          position: fixed; top: 0; left: 0; right: 0; height: 52px;
          background: var(--hs-nav, rgba(3,2,10,.96));
          border-bottom: 1px solid var(--hs-border, rgba(255,255,255,.07));
          z-index: 50; backdrop-filter: blur(12px);
        }
        .hs-nav-inner {
          max-width: 1100px; margin: 0 auto;
          height: 100%; display: flex; align-items: center;
          gap: 16px; padding: 0 24px;
        }
        .hs-nav-bread {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .22em; text-transform: uppercase;
          color: var(--hs-ink3, #565278); white-space: nowrap; flex-shrink: 0;
        }
        .hs-nav-sep {
          width: 1px; height: 14px;
          background: var(--hs-border, rgba(255,255,255,.07)); flex-shrink: 0;
        }
        .hs-nav-title {
          font-family: var(--font-fraunces, serif);
          font-style: italic; font-weight: 900; font-size: 17px;
          color: var(--hs-ink, #f0eeff);
          flex: 1; letter-spacing: -.02em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .hs-nav-right {
          display: flex; align-items: center; gap: 16px; flex-shrink: 0;
        }
        .hs-nav-link {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .18em; text-transform: uppercase;
          color: var(--hs-ink3, #565278); text-decoration: none;
          transition: color .15s; white-space: nowrap;
        }
        .hs-nav-link:hover { color: var(--domain-color, #ef5a6f); }
        @media (max-width: 680px) { .hs-nav-link { display: none; } }

        /* ── Layout ──────────────────────────────────────────── */
        .hs-wrap {
          position: relative; z-index: 3;
          max-width: 1100px; margin: 0 auto;
          padding: 96px 32px 180px;
        }
        @media (max-width: 680px) { .hs-wrap { padding: 76px 18px 140px; } }

        /* ── Header ──────────────────────────────────────────── */
        .hs-header { text-align: center; margin-bottom: 88px; padding: 0 16px; }
        .hs-chip {
          font-family: var(--font-jetbrains, monospace);
          font-size: 10px; letter-spacing: .3em; text-transform: uppercase;
          color: var(--domain-color, #ef5a6f); opacity: .75; margin-bottom: 14px;
        }
        .hs-title {
          font-family: var(--font-fraunces, serif);
          font-style: italic; font-weight: 900;
          font-size: clamp(54px, 8.5vw, 110px);
          line-height: .88; letter-spacing: -.04em;
          color: var(--hs-ink, #f0eeff);
          margin-bottom: 20px; text-wrap: balance;
        }
        .hs-lede {
          font-family: var(--font-newsreader, serif); font-style: italic;
          font-size: clamp(15px, 1.9vw, 18px); line-height: 1.82;
          color: var(--hs-ink2, #b4acd0);
          max-width: 500px; margin: 0 auto 26px;
        }
        .hs-stats {
          display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;
        }
        .hs-stat {
          font-family: var(--font-jetbrains, monospace);
          font-size: 11px; color: var(--hs-ink3, #565278); letter-spacing: .14em;
        }
        .hs-stat b { color: var(--domain-color, #ef5a6f); font-weight: 400; }

        /* ── Spine ───────────────────────────────────────────── */
        .hs-spine-wrap { position: relative; }
        .hs-spine-line {
          position: absolute; left: 50%; top: 0; bottom: 0; width: 1px;
          transform: translateX(-50%);
          background: linear-gradient(to bottom,
            var(--domain-color, #ef5a6f),
            color-mix(in srgb, var(--domain-color, #ef5a6f) 5%, transparent));
          z-index: 1; pointer-events: none;
        }
        .hs-spine-pulse {
          position: absolute; left: 50%; top: 0; bottom: 0; width: 3px;
          transform: translateX(-50%); pointer-events: none; z-index: 1;
        }
        .hs-spine-pulse::after {
          content: ''; position: absolute; left: -1px; width: 3px; height: 90px;
          background: linear-gradient(to bottom,
            transparent,
            rgba(255,210,70,.8),
            transparent);
          animation: hs-spulse 5.5s ease-in-out infinite; top: 0;
        }
        @keyframes hs-spulse {
          0%   { top: -90px; opacity: 0; }
          45%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @media (max-width: 680px) {
          .hs-spine-line, .hs-spine-pulse { display: none; }
        }

        /* ── Sections ────────────────────────────────────────── */
        .hs-sec { position: relative; margin-bottom: 0; }
        .hs-sec-0 { margin-top: 0; }
        .hs-sec-1 { margin-top: 0; }
        .hs-sec-2 { margin-top: 0; }
        .hs-sec-3 { margin-top: 0; }

        .hs-sec-num {
          position: absolute; left: 50%; transform: translateX(-50%);
          font-family: var(--font-fraunces, serif); font-weight: 900;
          font-size: 130px; line-height: 1;
          color: var(--domain-color, #ef5a6f);
          opacity: .04; pointer-events: none; z-index: 0;
          letter-spacing: -.06em; text-align: center;
          width: 200px; margin-left: -100px; user-select: none;
          top: 60px;
        }
        @media (max-width: 680px) { .hs-sec-num { display: none; } }

        .hs-sec-mark {
          position: absolute; left: 50%; top: 28px;
          transform: translateX(-50%);
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--hs-bg, #03020a);
          border: 2px solid var(--domain-color, #ef5a6f);
          z-index: 4;
        }

        /* ── Section header ──────────────────────────────────── */
        .hs-sec-header {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; padding: 14px 0 20px;
          min-height: 64px;
          cursor: pointer; position: relative; z-index: 3;
          user-select: none; background: none; border: none;
          width: 100%; color: inherit;
        }
        .hs-sec-name {
          font-family: var(--font-fraunces, serif); font-style: italic; font-weight: 900;
          font-size: clamp(16px, 2.2vw, 22px);
          color: var(--domain-color, #ef5a6f);
          letter-spacing: .01em; transition: opacity .15s;
        }
        .hs-sec-badge {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .22em; text-transform: uppercase;
          color: var(--hs-ink3, #565278);
        }
        .hs-sec-count {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; color: var(--hs-ink3, #565278); letter-spacing: .12em;
        }
        .hs-sec-chevron {
          font-size: 10px; color: var(--domain-color, #ef5a6f);
          opacity: .55; transition: transform .35s cubic-bezier(.16,1,.3,1);
          display: inline-block; margin-left: 4px;
        }
        .hs-sec-header.collapsed .hs-sec-chevron { transform: rotate(-90deg); }
        .hs-sec-header:hover .hs-sec-name { opacity: .75; }

        /* ── Collapsible body ────────────────────────────────── */
        .hs-sec-body {
          overflow: hidden;
          transition: max-height .45s cubic-bezier(.16,1,.3,1), opacity .35s ease;
          max-height: 5000px; opacity: 1;
        }
        .hs-sec-body.collapsed { max-height: 0; opacity: 0; }
        .hs-sec-gap { height: 64px; }

        /* ── Bridge card ─────────────────────────────────────── */
        .hs-bridge {
          display: block; width: 100%; padding: 36px 48px;
          background: var(--hs-card, rgba(10,8,24,.88));
          border: 1px solid var(--hs-border, rgba(255,255,255,.07));
          position: relative; z-index: 3; cursor: pointer; overflow: hidden;
          text-align: left; color: inherit;
          transition: background .25s;
        }
        .hs-bridge::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px;
          background: var(--domain-color, #ef5a6f);
          transform: scaleY(0); transform-origin: top;
          transition: transform .4s cubic-bezier(.16,1,.3,1);
        }
        .hs-bridge:hover { background: var(--hs-cardHov, rgba(16,12,36,.95)); }
        .hs-bridge:hover::before { transform: scaleY(1); }
        .hs-bridge-meta {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
          color: var(--hs-ink3, #565278); margin-bottom: 10px;
        }
        .hs-bridge-title {
          font-family: var(--font-fraunces, serif); font-style: italic; font-weight: 900;
          font-size: clamp(26px, 3.6vw, 44px);
          color: var(--domain-color, #ef5a6f);
          line-height: 1.04; margin-bottom: 14px;
          letter-spacing: -.025em; transition: opacity .15s; text-wrap: balance;
        }
        .hs-bridge:hover .hs-bridge-title { opacity: .8; }
        .hs-bridge-exc {
          font-family: var(--font-newsreader, serif); font-style: italic;
          font-size: clamp(14px, 1.6vw, 17px); line-height: 1.76;
          color: var(--hs-ink2, #b4acd0); font-weight: 300;
        }
        .hs-bridge-foot {
          font-family: var(--font-jetbrains, monospace);
          font-size: 10px; color: var(--hs-ink3, #565278);
          letter-spacing: .1em; margin-top: 16px;
        }
        @media (max-width: 680px) { .hs-bridge { padding: 24px 20px; } }

        /* ── Two-column cards ────────────────────────────────── */
        .hs-two-col {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1px; position: relative; z-index: 2; margin-top: 1px;
        }
        @media (max-width: 680px) { .hs-two-col { grid-template-columns: 1fr; } }
        .hs-col { display: flex; flex-direction: column; gap: 1px; }
        .hs-scard {
          display: block; width: 100%; padding: 22px 28px;
          background: var(--hs-card2, rgba(9,7,20,.85));
          cursor: pointer; text-align: left; color: inherit;
          border: 1px solid transparent;
          transition: background .17s, border-color .2s;
          position: relative;
        }
        .hs-scard:hover { background: var(--hs-cardHov, rgba(16,13,34,.96)); }
        .hs-col .hs-scard:hover {
          border-right-color: var(--domain-color, #ef5a6f);
        }
        .hs-col:last-child .hs-scard:hover,
        .hs-scard-right:hover {
          border-left-color: var(--domain-color, #ef5a6f);
          border-right-color: transparent;
        }
        .hs-scard-hint {
          position: absolute; right: 10px; top: 10px;
          font-family: var(--font-jetbrains, monospace);
          font-size: 8px; letter-spacing: .2em; text-transform: uppercase;
          color: var(--domain-color, #ef5a6f);
          opacity: 0; transition: opacity .2s; pointer-events: none;
        }
        .hs-scard:hover .hs-scard-hint { opacity: .6; }
        .hs-scard-title {
          font-family: var(--font-fraunces, serif); font-style: italic; font-weight: 900;
          font-size: clamp(18px, 2.2vw, 24px);
          color: var(--domain-color, #ef5a6f);
          line-height: 1.15; transition: opacity .15s; text-wrap: balance;
        }
        .hs-scard:hover .hs-scard-title { opacity: .75; }
        .hs-scard-exc {
          font-family: var(--font-newsreader, serif); font-style: italic;
          font-size: clamp(13px, 1.4vw, 15px); line-height: 1.65;
          color: var(--hs-ink2, #b4acd0); margin-top: 8px; font-weight: 300;
        }
        .hs-scard-meta {
          font-family: var(--font-jetbrains, monospace);
          font-size: 10px; color: var(--hs-ink3, #565278);
          letter-spacing: .1em; margin-top: 10px;
        }
        @media (max-width: 680px) { .hs-scard { padding: 18px 16px; } }

        /* ── Back link ───────────────────────────────────────── */
        .hs-back-link {
          font-family: var(--font-jetbrains, monospace);
          font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
          color: var(--hs-ink3, #565278); text-decoration: none; transition: color .15s;
        }
        .hs-back-link:hover { color: var(--domain-color, #ef5a6f); }

        /* ── Backdrop ────────────────────────────────────────── */
        .hs-backdrop {
          position: fixed; inset: 0;
          background: color-mix(in srgb, var(--hs-bg, #03020a) 85%, transparent);
          backdrop-filter: blur(6px); z-index: 30;
        }

        /* ── Detail panel ────────────────────────────────────── */
        .hs-dp {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
          background: var(--hs-nav, rgba(3,2,10,.99));
          border-top: 1px solid var(--hs-border, rgba(255,255,255,.09));
          transform: translateY(100%);
          transition: transform .45s cubic-bezier(.16,1,.3,1);
          display: flex; flex-direction: column; max-height: 62vh;
        }
        .hs-dp.open { transform: translateY(0); }

        .hs-dp-bar {
          display: flex; align-items: center; padding: 16px 28px 0;
          gap: 14px; flex-shrink: 0;
        }
        .hs-dp-badge {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .22em; text-transform: uppercase;
          color: var(--domain-color, #ef5a6f);
          padding: 4px 10px;
          border: 1px solid color-mix(in srgb, var(--domain-color, #ef5a6f) 55%, transparent);
          opacity: .85;
        }
        .hs-dp-status {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .14em;
        }
        .hs-dp-prog {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; color: var(--hs-ink3, #565278);
          letter-spacing: .14em; margin-left: auto;
        }
        .hs-dp-close {
          font-family: var(--font-jetbrains, monospace); font-size: 11px;
          color: var(--hs-ink3, #565278); cursor: pointer; padding: 4px 10px;
          transition: color .15s; background: none; border: none;
        }
        .hs-dp-close:hover { color: var(--domain-color, #ef5a6f); }

        .hs-dp-body {
          padding: 18px 28px 10px; flex: 1; overflow-y: auto;
          display: flex; gap: 40px;
        }
        .hs-dp-main { flex: 1; min-width: 0; }
        .hs-dp-title {
          font-family: var(--font-fraunces, serif); font-style: italic; font-weight: 900;
          font-size: clamp(26px, 3.5vw, 44px); line-height: .95;
          letter-spacing: -.03em;
          color: var(--domain-color, #ef5a6f);
          margin-bottom: 14px; text-wrap: balance;
        }
        .hs-dp-exc {
          font-family: var(--font-newsreader, serif); font-style: italic;
          font-size: clamp(14px, 1.6vw, 17px); line-height: 1.8;
          color: var(--hs-ink2, #b4acd0); font-weight: 300;
        }
        .hs-dp-meta-row {
          display: flex; gap: 10px; margin-top: 14px;
          flex-wrap: wrap; align-items: center;
        }
        .hs-dp-pill {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; color: var(--hs-ink3, #565278);
          letter-spacing: .12em; padding: 4px 10px;
          border: 1px solid var(--hs-border2, rgba(255,255,255,.05));
        }
        .hs-dp-page-link {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .14em;
          color: var(--domain-color, #ef5a6f);
          text-decoration: none; padding: 4px 12px;
          border: 1px solid currentColor; opacity: .7;
          transition: all .15s; display: inline-block;
        }
        .hs-dp-page-link:hover { opacity: 1; background: rgba(255,255,255,.05); }

        .hs-dp-aside {
          width: 200px; flex-shrink: 0;
          border-left: 1px solid var(--hs-border2, rgba(255,255,255,.05));
          padding-left: 28px;
        }
        .hs-dp-links-lbl {
          font-family: var(--font-jetbrains, monospace);
          font-size: 8px; letter-spacing: .24em; text-transform: uppercase;
          color: var(--hs-ink3, #565278); margin-bottom: 12px;
        }
        .hs-dp-link {
          font-family: var(--font-newsreader, serif); font-style: italic;
          font-size: 14px; color: var(--hs-ink2, #b4acd0);
          margin-bottom: 8px; cursor: pointer; transition: color .15s;
          display: block; line-height: 1.3; text-align: left;
          background: none; border: none; padding: 0; width: 100%;
        }
        .hs-dp-link:hover { color: var(--domain-color, #ef5a6f); }

        /* ── Up next band ────────────────────────────────────── */
        .hs-dp-next-band {
          padding: 10px 28px;
          background: color-mix(in srgb, var(--hs-ink, #f0eeff) 3%, transparent);
          border-top: 1px solid var(--hs-border2, rgba(255,255,255,.05));
          display: flex; align-items: center; gap: 16px; flex-shrink: 0;
        }
        .hs-dp-next-lbl {
          font-family: var(--font-jetbrains, monospace);
          font-size: 8px; letter-spacing: .28em; text-transform: uppercase;
          color: var(--hs-ink3, #565278); white-space: nowrap; flex-shrink: 0;
        }
        .hs-dp-next-title {
          font-family: var(--font-fraunces, serif); font-style: italic;
          font-size: 18px; color: var(--hs-ink2, #b4acd0);
          flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .hs-dp-next-arrow {
          font-family: var(--font-jetbrains, monospace); font-size: 11px;
          color: var(--domain-color, #ef5a6f);
          flex-shrink: 0; cursor: pointer; padding: 6px 14px;
          border: 1px solid currentColor; opacity: .6;
          transition: opacity .15s; background: none;
        }
        .hs-dp-next-arrow:hover { opacity: 1; }

        /* ── Prev / next nav ─────────────────────────────────── */
        .hs-dp-nav {
          display: flex; padding: 10px 28px 14px;
          border-top: 1px solid var(--hs-border2, rgba(255,255,255,.05));
          flex-shrink: 0; gap: 10px;
        }
        .hs-dp-btn {
          font-family: var(--font-jetbrains, monospace);
          font-size: 10px; letter-spacing: .1em; cursor: pointer;
          padding: 8px 16px;
          border: 1px solid var(--hs-border, rgba(255,255,255,.08));
          color: var(--hs-ink2, #b4acd0); transition: all .18s;
          display: flex; align-items: center; gap: 10px; background: none;
        }
        .hs-dp-btn:disabled { opacity: .25; cursor: not-allowed; }
        .hs-dp-btn:not(:disabled):hover {
          border-color: color-mix(in srgb, var(--domain-color, #ef5a6f) 45%, transparent);
          color: var(--hs-ink, #f0eeff);
        }
        .hs-arr { color: var(--domain-color, #ef5a6f); opacity: .85; font-size: 13px; }
        .hs-dp-btn-name {
          font-family: var(--font-fraunces, serif); font-style: italic;
          font-size: 13px; color: var(--hs-ink, #f0eeff);
        }
        .hs-dp-next { margin-left: auto; }
        .hs-dp-prev .hs-dp-btn-name { text-align: left; }
        .hs-dp-next .hs-dp-btn-name { text-align: right; }

        @media (max-width: 680px) {
          .hs-dp-aside { display: none; }
          .hs-dp-body { flex-direction: column; }
          .hs-dp { max-height: 72vh; }
        }

        /* ── Hint ────────────────────────────────────────────── */
        .hs-hint {
          position: fixed; bottom: 28px; left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .22em;
          color: color-mix(in srgb, var(--hs-ink, #f0eeff) 16%, transparent);
          text-transform: uppercase; z-index: 5;
          pointer-events: none; white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
