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

/* ── Helpers ────────────────────────────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  stable:     '#6bab8a',
  developing: '#c8a460',
  stub:       '#9f7ec0',
};

/* ── Sparks canvas component ─────────────────────────────────────── */

function SparksCanvas() {
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
      const sepia = document.documentElement.getAttribute('data-theme') === 'sepia';

      sparks.forEach(s => {
        s.life += s.vy;
        s.x    += s.vx + Math.sin(s.life * 20) * 0.00012;

        if (s.life > s.maxLife) {
          s.x = Math.random();
          s.y = 0.82 + Math.random() * 0.18;
          s.life = 0;
          s.vx   = (Math.random() - 0.5) * 0.00028;
        }

        const t = s.life / s.maxLife;
        const opacity = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1;
        const alpha   = opacity * (sepia ? 0.15 : 0.28);

        ctx.beginPath();
        ctx.arc(
          s.x * canvas.width,
          (1 - s.life) * canvas.height,
          s.r,
          0,
          Math.PI * 2
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
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
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

  /* Build ordered flat concept list for prev/next */
  const allSections: SpineSection[] = unplaced.length > 0
    ? [...sections, {
        key: '__unplaced__',
        label: 'Other Concepts',
        level: 'thematic' as const,
        color: '#4a4468',
        badge: '',
        concepts: unplaced,
      }]
    : sections;

  const ORDER: SpineConcept[] = allSections.flatMap(s => s.concepts);

  /* Concept lookup by id */
  const conceptMap = new Map(ORDER.map(c => [c.id, c]));

  /* Collapsed state — all expanded by default */
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
  const activeC = activeId ? conceptMap.get(activeId) : null;
  const activeIdx = activeId ? ORDER.findIndex(c => c.id === activeId) : -1;

  /* Find which section a concept is in */
  const conceptSection = useCallback((id: string) =>
    allSections.find(s => s.concepts.some(c => c.id === id)),
  [allSections]);

  const openConcept = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const closePanel = useCallback(() => {
    setActiveId(null);
  }, []);

  const navigate = useCallback((dir: number) => {
    if (activeIdx < 0) return;
    const next = activeIdx + dir;
    if (next < 0 || next >= ORDER.length) return;
    const nextId = ORDER[next].id;
    setActiveId(nextId);
    /* Auto-expand collapsed section */
    const sec = allSections.find(s => s.concepts.some(c => c.id === nextId));
    if (sec) setCollapsed(prev => { const n = new Set(prev); n.delete(sec.key); return n; });
    /* Scroll card into view */
    setTimeout(() => {
      document.querySelector(`[data-cid="${nextId}"]`)?.scrollIntoView({
        behavior: 'smooth', block: 'nearest',
      });
    }, 80);
  }, [activeIdx, ORDER, allSections]);

  /* Keyboard nav */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      closePanel();
      if (e.key === 'ArrowLeft')   navigate(-1);
      if (e.key === 'ArrowRight')  navigate(1);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [closePanel, navigate]);

  const totalConcepts = ORDER.length;
  const totalBl = ORDER.reduce((a, c) => a + c.backlinkCount, 0);

  /* ── Render ── */
  return (
    <div
      className="hs-root"
      style={{ '--domain-color': domainColor } as React.CSSProperties}
    >
      <SparksCanvas />

      {/* Top stripe */}
      <div className="hs-stripe" />

      {/* Nav bar */}
      <nav className="hs-nav">
        <div className="hs-nav-inner">
          <span className="hs-nav-bread">{domainLabel}</span>
          <span className="hs-nav-sep" />
          <span className="hs-nav-title">{title}</span>

          <div className="hs-nav-right">
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

      {/* Main scroll content */}
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
            const leftCol = rest.filter((_, i) => i % 2 === 0);
            const rightCol = rest.filter((_, i) => i % 2 === 1);

            return (
              <div
                key={sec.key}
                className={`hs-sec hs-sec-${si}`}
                style={{ '--lc': sec.color } as React.CSSProperties}
              >
                <div className="hs-sec-num">0{si + 1}</div>
                <div className="hs-sec-mark" />

                {/* Section header (collapsible toggle) */}
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
                  {/* Lead / bridge card */}
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
        <div
          className="hs-backdrop"
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      {/* Detail panel */}
      <div
        className={`hs-dp${activeC ? ' open' : ''}`}
        style={{
          '--dp-lc': activeC ? conceptSection(activeC.id)?.color ?? domainColor : domainColor,
        } as React.CSSProperties}
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
                <span
                  className="hs-dp-badge"
                  style={{ borderColor: (sec?.color ?? domainColor) + '88', color: sec?.color ?? domainColor }}
                >
                  {sec?.badge || sec?.label} · {sec?.label}
                </span>
                <span
                  className="hs-dp-status"
                  style={{ color: STATUS_COLOR[activeC.status ?? ''] ?? '#888' }}
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
            <div className="hs-dp-exc">{activeC?.excerpt}</div>
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

        {/* "Up next" band */}
        {activeIdx >= 0 && activeIdx < ORDER.length - 1 && (
          <div className="hs-dp-next-band">
            <span className="hs-dp-next-lbl">Up next</span>
            <span className="hs-dp-next-title">
              {ORDER[activeIdx + 1]?.title}
            </span>
            <button className="hs-dp-next-arrow" onClick={() => navigate(1)} aria-label="Next concept">
              →
            </button>
          </div>
        )}

        {/* Prev / next nav */}
        <div className="hs-dp-nav">
          <button
            className="hs-dp-btn hs-dp-prev"
            onClick={() => navigate(-1)}
            disabled={activeIdx <= 0}
            aria-label="Previous concept"
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
            aria-label="Next concept"
          >
            <span className="hs-dp-btn-name">
              {activeIdx < ORDER.length - 1 ? ORDER[activeIdx + 1]?.title : ''}
            </span>
            <span className="hs-arr">→</span>
          </button>
        </div>
      </div>

      {/* Hint */}
      {!activeC && (
        <div className="hs-hint" aria-hidden="true">Click any concept to explore</div>
      )}

      <style>{`
        /* ── Root / tokens ───────────────────────────────────── */
        .hs-root {
          min-height: 100vh;
          background: var(--hs-bg, #03020a);
          color: var(--hs-ink, #f0eeff);
          overflow-x: hidden;
          position: relative;
        }
        [data-theme="sepia"] .hs-root {
          --hs-bg: #f4f0e8;
          --hs-ink: #1a1420;
          --hs-ink2: #4e4270;
          --hs-ink3: #8c80a8;
          --hs-card: rgba(255,252,248,.94);
          --hs-card2: rgba(248,244,238,.90);
          --hs-border: rgba(0,0,0,.08);
          --hs-border2: rgba(0,0,0,.05);
          --hs-nav: rgba(244,240,232,.96);
        }
        :root .hs-root, [data-theme="void"] .hs-root {
          --hs-bg: #03020a;
          --hs-ink: #f0eeff;
          --hs-ink2: #b4acd0;
          --hs-ink3: #565278;
          --hs-card: rgba(10,8,24,.88);
          --hs-card2: rgba(9,7,20,.85);
          --hs-border: rgba(255,255,255,.07);
          --hs-border2: rgba(255,255,255,.05);
          --hs-nav: rgba(3,2,10,.95);
        }

        /* ── Stripe ────────────────────────────────────────────── */
        .hs-stripe {
          position: fixed; top: 52px; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--domain-color, #ef5a6f) 40%, var(--domain-color, #ef5a6f) 60%, transparent);
          opacity: .65; pointer-events: none; z-index: 20;
        }

        /* ── Nav ────────────────────────────────────────────────── */
        .hs-nav {
          position: fixed; top: 0; left: 0; right: 0; height: 52px;
          background: var(--hs-nav, rgba(3,2,10,.95));
          border-bottom: 1px solid var(--hs-border, rgba(255,255,255,.07));
          z-index: 50; backdrop-filter: blur(12px);
        }
        .hs-nav-inner {
          max-width: 1100px; margin: 0 auto;
          height: 100%; display: flex; align-items: center; gap: 16px; padding: 0 24px;
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
        @media (max-width: 680px) {
          .hs-nav-link { display: none; }
        }

        /* ── Layout ─────────────────────────────────────────────── */
        .hs-wrap {
          position: relative; z-index: 3;
          max-width: 1100px; margin: 0 auto;
          padding: 96px 32px 180px;
        }
        @media (max-width: 680px) {
          .hs-wrap { padding: 76px 18px 140px !important; }
        }

        /* ── Header ─────────────────────────────────────────────── */
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
          font-family: var(--font-newsreader, serif);
          font-style: italic; font-size: clamp(15px, 1.9vw, 18px);
          line-height: 1.82; color: var(--hs-ink2, #b4acd0);
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

        /* ── Spine ──────────────────────────────────────────────── */
        .hs-spine-wrap { position: relative; }
        .hs-spine-line {
          position: absolute; left: 50%; top: 0; bottom: 0; width: 1px;
          transform: translateX(-50%);
          background: linear-gradient(to bottom, var(--domain-color, #ef5a6f), rgba(239,90,111,.04));
          z-index: 1; pointer-events: none;
        }
        .hs-spine-pulse {
          position: absolute; left: 50%; top: 0; bottom: 0; width: 3px;
          transform: translateX(-50%); pointer-events: none; z-index: 1;
        }
        .hs-spine-pulse::after {
          content: ''; position: absolute; left: -1px; width: 3px; height: 90px;
          background: linear-gradient(to bottom, transparent, rgba(255,210,70,.8), transparent);
          animation: hs-spulse 5.5s ease-in-out infinite; top: 0;
        }
        @keyframes hs-spulse {
          0% { top: -90px; opacity: 0; } 45% { opacity: 1; } 100% { top: 100%; opacity: 0; }
        }
        @media (max-width: 680px) {
          .hs-spine-line, .hs-spine-pulse { display: none !important; }
        }

        /* ── Section ────────────────────────────────────────────── */
        .hs-sec { position: relative; margin-bottom: 0; }
        .hs-sec-0 { margin-top: 0; }
        .hs-sec-1 { margin-top: -48px; }
        .hs-sec-2 { margin-top: -28px; }
        .hs-sec-3 { margin-top: -20px; }
        @media (max-width: 680px) {
          .hs-sec-1, .hs-sec-2, .hs-sec-3 { margin-top: 0 !important; }
        }
        .hs-sec-num {
          position: absolute; left: 50%; transform: translateX(-50%);
          font-family: var(--font-fraunces, serif); font-weight: 900;
          font-size: 130px; line-height: 1;
          color: var(--lc, var(--domain-color, #ef5a6f));
          opacity: .044; pointer-events: none; z-index: 0;
          letter-spacing: -.06em; text-align: center;
          width: 200px; margin-left: -100px; user-select: none;
        }
        @media (max-width: 680px) { .hs-sec-num { display: none; } }

        .hs-sec-mark {
          position: absolute; left: 50%; top: 32px;
          transform: translateX(-50%);
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--hs-bg, #03020a);
          border: 2px solid var(--lc, var(--domain-color, #ef5a6f));
          z-index: 4; box-shadow: 0 0 14px rgba(255,255,255,.08);
        }

        /* ── Section header ─────────────────────────────────────── */
        .hs-sec-header {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          padding: 10px 0 18px; cursor: pointer; position: relative; z-index: 3;
          user-select: none; background: none; border: none; width: 100%;
          color: inherit; font-size: inherit;
        }
        .hs-sec-name {
          font-family: var(--font-fraunces, serif); font-style: italic; font-weight: 900;
          font-size: clamp(15px, 2vw, 20px);
          color: var(--lc, var(--domain-color, #ef5a6f));
          letter-spacing: .02em; transition: opacity .15s;
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
          font-size: 10px; color: var(--lc, var(--domain-color, #ef5a6f));
          opacity: .55; transition: transform .35s cubic-bezier(.16,1,.3,1);
          display: inline-block; margin-left: 4px;
        }
        .hs-sec-header.collapsed .hs-sec-chevron { transform: rotate(-90deg); }
        .hs-sec-header:hover .hs-sec-name { opacity: .75; }

        /* ── Collapsible body ────────────────────────────────────── */
        .hs-sec-body {
          overflow: hidden;
          transition: max-height .45s cubic-bezier(.16,1,.3,1), opacity .35s ease;
          max-height: 5000px; opacity: 1;
        }
        .hs-sec-body.collapsed { max-height: 0; opacity: 0; }
        .hs-sec-gap { height: 60px; }

        /* ── Bridge card ─────────────────────────────────────────── */
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
          background: var(--lc, var(--domain-color, #ef5a6f));
          transform: scaleY(0); transform-origin: top;
          transition: transform .4s cubic-bezier(.16,1,.3,1);
        }
        .hs-bridge:hover { background: var(--hs-card2, rgba(16,12,36,.95)); }
        .hs-bridge:hover::before { transform: scaleY(1); }
        .hs-bridge-meta {
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
          color: var(--hs-ink3, #565278); margin-bottom: 10px;
        }
        .hs-bridge-title {
          font-family: var(--font-fraunces, serif); font-style: italic; font-weight: 900;
          font-size: clamp(26px, 3.6vw, 44px);
          color: var(--lc, var(--hs-ink, #f0eeff));
          line-height: 1.04; margin-bottom: 14px;
          letter-spacing: -.025em; transition: opacity .15s; text-wrap: balance;
        }
        .hs-bridge:hover .hs-bridge-title { opacity: .8; }
        .hs-bridge-exc {
          font-family: var(--font-newsreader, serif); font-style: italic;
          font-size: clamp(14px, 1.6vw, 17px);
          line-height: 1.76; color: var(--hs-ink2, #b4acd0); font-weight: 300;
        }
        .hs-bridge-foot {
          font-family: var(--font-jetbrains, monospace);
          font-size: 10px; color: var(--hs-ink3, #565278);
          letter-spacing: .1em; margin-top: 16px;
        }
        @media (max-width: 680px) {
          .hs-bridge { padding: 24px 20px !important; }
        }

        /* ── Two-col supporting cards ────────────────────────────── */
        .hs-two-col {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1px; position: relative; z-index: 2; margin-top: 1px;
        }
        @media (max-width: 680px) {
          .hs-two-col { grid-template-columns: 1fr !important; }
        }
        .hs-col { display: flex; flex-direction: column; gap: 1px; }
        .hs-scard {
          display: block; width: 100%; padding: 22px 28px;
          background: var(--hs-card2, rgba(9,7,20,.85));
          cursor: pointer; text-align: left; color: inherit;
          border: 1px solid transparent;
          transition: background .17s, border-color .2s;
          position: relative;
        }
        .hs-scard:hover { background: var(--hs-card, rgba(16,13,34,.96)); }
        .hs-col .hs-scard:hover { border-right-color: var(--lc, var(--domain-color, #ef5a6f)); }
        .hs-col:last-child .hs-scard:hover,
        .hs-scard-right:hover { border-left-color: var(--lc, var(--domain-color, #ef5a6f)); border-right-color: transparent; }
        .hs-scard-hint {
          position: absolute; right: 10px; top: 10px;
          font-family: var(--font-jetbrains, monospace);
          font-size: 8px; letter-spacing: .2em; text-transform: uppercase;
          color: var(--lc, var(--domain-color, #ef5a6f));
          opacity: 0; transition: opacity .2s; pointer-events: none;
        }
        .hs-scard:hover .hs-scard-hint { opacity: .6; }
        .hs-scard-title {
          font-family: var(--font-fraunces, serif); font-style: italic; font-weight: 900;
          font-size: clamp(18px, 2.2vw, 24px);
          color: var(--lc, var(--hs-ink, #f0eeff));
          line-height: 1.15; transition: opacity .15s; text-wrap: balance;
        }
        .hs-scard:hover .hs-scard-title { opacity: .75; }
        .hs-scard-exc {
          font-family: var(--font-newsreader, serif); font-style: italic;
          font-size: clamp(13px, 1.4vw, 15px);
          line-height: 1.65; color: var(--hs-ink2, #b4acd0);
          margin-top: 8px; font-weight: 300;
        }
        .hs-scard-meta {
          font-family: var(--font-jetbrains, monospace);
          font-size: 10px; color: var(--hs-ink3, #565278);
          letter-spacing: .1em; margin-top: 10px;
        }
        @media (max-width: 680px) {
          .hs-scard { padding: 18px 16px !important; }
        }

        /* ── Back link ───────────────────────────────────────────── */
        .hs-back-link {
          font-family: var(--font-jetbrains, monospace);
          font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
          color: var(--hs-ink3, #565278); text-decoration: none;
          transition: color .15s;
        }
        .hs-back-link:hover { color: var(--domain-color, #ef5a6f); }

        /* ── Backdrop ────────────────────────────────────────────── */
        .hs-backdrop {
          position: fixed; inset: 0;
          background: rgba(3,2,10,.82); backdrop-filter: blur(6px);
          z-index: 30;
        }
        [data-theme="sepia"] .hs-backdrop {
          background: rgba(244,240,232,.85);
        }

        /* ── Detail panel ────────────────────────────────────────── */
        .hs-dp {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
          background: var(--hs-nav, rgba(7,5,18,.99));
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
          padding: 4px 10px; border: 1px solid; opacity: .85;
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
          color: var(--dp-lc, var(--domain-color, #ef5a6f));
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
          color: var(--dp-lc, var(--domain-color, #ef5a6f));
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
        .hs-dp-link:hover { color: var(--dp-lc, var(--domain-color, #ef5a6f)); }

        /* ── Up next band ─────────────────────────────────────────── */
        .hs-dp-next-band {
          padding: 10px 28px;
          background: rgba(255,255,255,.03);
          border-top: 1px solid var(--hs-border2, rgba(255,255,255,.05));
          display: flex; align-items: center; gap: 16px; flex-shrink: 0;
        }
        [data-theme="sepia"] .hs-dp-next-band { background: rgba(0,0,0,.03); }
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
          color: var(--dp-lc, var(--domain-color, #ef5a6f));
          flex-shrink: 0; cursor: pointer; padding: 6px 14px;
          border: 1px solid currentColor; opacity: .6;
          transition: opacity .15s; background: none;
        }
        .hs-dp-next-arrow:hover { opacity: 1; }

        /* ── Prev/next nav ────────────────────────────────────────── */
        .hs-dp-nav {
          display: flex; padding: 10px 28px 14px;
          border-top: 1px solid var(--hs-border2, rgba(255,255,255,.05));
          flex-shrink: 0; gap: 10px;
        }
        .hs-dp-btn {
          font-family: var(--font-jetbrains, monospace);
          font-size: 10px; letter-spacing: .1em; cursor: pointer;
          padding: 8px 16px; border: 1px solid var(--hs-border, rgba(255,255,255,.08));
          color: var(--hs-ink2, #b4acd0); transition: all .18s;
          display: flex; align-items: center; gap: 10px;
          background: none;
        }
        .hs-dp-btn:disabled { opacity: .25; cursor: not-allowed; }
        .hs-dp-btn:not(:disabled):hover {
          border-color: color-mix(in srgb, var(--domain-color, #ef5a6f) 45%, transparent);
          color: var(--hs-ink, #f0eeff);
        }
        .hs-arr { color: var(--dp-lc, var(--domain-color, #ef5a6f)); opacity: .85; font-size: 13px; }
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

        /* ── Hint ─────────────────────────────────────────────────── */
        .hs-hint {
          position: fixed; bottom: 28px; left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-jetbrains, monospace);
          font-size: 9px; letter-spacing: .22em;
          color: rgba(255,255,255,.16); text-transform: uppercase;
          z-index: 5; pointer-events: none; white-space: nowrap;
        }
        [data-theme="sepia"] .hs-hint { color: rgba(0,0,0,.25); }
      `}</style>
    </div>
  );
}
