'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

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
const DEVANAGARI_NUMS = ['१','२','३','४','५','६','७','८','९','१०','११','१२'];
const circled = (n: number): string => n >= 1 && n <= 20 ? String.fromCharCode(0x245F + n) : String(n);

const STATUS_COLOR: Record<string, string> = {
  stable:'#6bab8a', developing:'#c8a460', stub:'#9f7ec0',
};

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

/* ── SparksCanvas ───────────────────────────────────────────────── */
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

  const bookmarkKey = `nylus-bookmark-${path ?? title}`;
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(bookmarkKey);
      if (saved) {
        setBookmarkId(saved);
        const sec = allSections.find(s => s.concepts.some(c => c.id === saved));
        if (sec) setCollapsed(prev => { const n = new Set(prev); n.delete(sec.key); return n; });
      }
    } catch {}
  }, [bookmarkKey]);

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
    if (sec) setCollapsed(prev => { const n = new Set(prev); n.delete(sec.key); return n; });
    setTimeout(() => document.querySelector(`[data-cid="${nextId}"]`)?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 80);
  }, [activeIdx, ORDER, allSections]);

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
            <span className="hs-stat"><b>{allSections.length}</b> levels</span>
            {totalBl > 0 && <span className="hs-stat"><b>{totalBl}</b> backlinks</span>}
          </div>
        </header>

        <div className="hs-spine-wrap">
          <div className="hs-spine-line" />
          <div className="hs-spine-pulse" />

          {allSections.map((sec, si) => {
            const isCollapsed = collapsed.has(sec.key);
            const [lead, ...rest] = sec.concepts;
            const leftCol  = rest.filter((_, i) => i % 2 === 0);
            const rightCol = rest.filter((_, i) => i % 2 === 1);
            return (
              <div key={sec.key} className={`hs-sec hs-sec-${si}`}>
                <div className="hs-sec-num">{DEVANAGARI_NUMS[si] ?? String(si+1)}</div>
                <div className="hs-sec-mark" />
                <button className={`hs-sec-header${isCollapsed ? ' collapsed' : ''}`} onClick={() => toggleSection(sec.key)} aria-expanded={!isCollapsed}>
                  <span className="hs-sec-name">{sec.label}</span>
                  {sec.badge && <span className="hs-sec-badge">{sec.badge}</span>}
                  <span className="hs-sec-count">· {sec.concepts.length}</span>
                  <span className="hs-sec-chevron" aria-hidden="true">▾</span>
                </button>
                <div className={`hs-sec-body${isCollapsed ? ' collapsed' : ''}`}>
                  {lead && (
                    <button className={`hs-bridge${lead.id === bookmarkId ? ' hs-bookmarked' : ''}`} data-cid={lead.id} onClick={() => openConcept(lead.id)}>
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
                            <button key={c.id} className={`hs-scard${ci === 1 ? ' hs-scard-right' : ''}${c.id === bookmarkId ? ' hs-bookmarked' : ''}`} data-cid={c.id} onClick={() => openConcept(c.id)}>
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
                  <div className="hs-sec-gap" />
                </div>
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
                    if (sec) setCollapsed(prev => { const n = new Set(prev); n.delete(sec.key); return n; });
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
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@900&display=swap');
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
        .hs-wrap{position:relative;z-index:3;max-width:1100px;margin:0 auto;padding:96px 32px 180px}
        @media(max-width:680px){.hs-wrap{padding:72px 16px 120px}}
        .hs-header{text-align:center;margin-bottom:72px}
        .hs-chip{font-family:var(--font-jetbrains,monospace);font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--domain-color,#ef5a6f);opacity:.75;margin-bottom:14px}
        .hs-title{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(42px,8.5vw,110px);line-height:.88;letter-spacing:-.04em;color:var(--hs-ink,#f0eeff);margin-bottom:20px;text-wrap:balance}
        .hs-lede{font-family:var(--font-newsreader,serif);font-style:italic;font-size:clamp(15px,1.9vw,18px);line-height:1.82;color:var(--hs-ink2,#b4acd0);max-width:500px;margin:0 auto 26px}
        .hs-stats{display:flex;justify-content:center;gap:32px;flex-wrap:wrap}
        .hs-stat{font-family:var(--font-jetbrains,monospace);font-size:11px;color:var(--hs-ink3,#565278);letter-spacing:.14em}
        .hs-stat b{color:var(--domain-color,#ef5a6f);font-weight:400}
        .hs-spine-wrap{position:relative}
        .hs-spine-line{position:absolute;left:50%;top:0;bottom:0;width:1px;transform:translateX(-50%);background:linear-gradient(to bottom,var(--domain-color,#ef5a6f),color-mix(in srgb,var(--domain-color,#ef5a6f) 5%,transparent));z-index:1;pointer-events:none}
        .hs-spine-pulse{position:absolute;left:50%;top:0;bottom:0;width:3px;transform:translateX(-50%);pointer-events:none;z-index:1}
        .hs-spine-pulse::after{content:'';position:absolute;left:-1px;width:3px;height:90px;background:linear-gradient(to bottom,transparent,rgba(255,210,70,.8),transparent);animation:hs-spulse 5.5s ease-in-out infinite}
        @keyframes hs-spulse{0%{top:-90px;opacity:0}45%{opacity:1}100%{top:100%;opacity:0}}
        @media(max-width:680px){.hs-spine-line,.hs-spine-pulse{display:none}}
        .hs-sec{position:relative;margin-bottom:0}
        .hs-sec-num{position:absolute;left:50%;transform:translateX(-50%);font-family:'Noto Serif Devanagari',var(--font-fraunces,serif);font-weight:900;font-size:130px;line-height:1;color:var(--domain-color,#ef5a6f);opacity:.05;pointer-events:none;z-index:0;letter-spacing:-.02em;text-align:center;width:200px;margin-left:-100px;user-select:none;top:60px}
        @media(max-width:680px){.hs-sec-num{display:none}}
        .hs-sec-mark{position:absolute;left:50%;top:28px;transform:translateX(-50%);width:16px;height:16px;border-radius:50%;background:var(--hs-bg,#03020a);border:2px solid var(--domain-color,#ef5a6f);z-index:4}
        @media(max-width:680px){.hs-sec-mark{display:none}}
        .hs-sec-header{display:flex;align-items:center;justify-content:flex-start;gap:10px;padding:14px 16px 18px 32px;min-height:64px;cursor:pointer;position:relative;z-index:3;user-select:none;background:none;border:none;width:calc(50% - 28px);color:inherit}
        @media(max-width:680px){.hs-sec-header{padding:12px 12px 16px 12px;min-height:56px;width:100%}}
        .hs-sec-name{font-family:var(--font-fraunces,serif);font-style:italic;font-weight:900;font-size:clamp(16px,2.2vw,22px);color:var(--domain-color,#ef5a6f);letter-spacing:.01em;transition:opacity .15s}
        .hs-sec-badge{font-family:var(--font-jetbrains,monospace);font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--domain-color,#ef5a6f);opacity:.75;font-weight:600}
        .hs-sec-count{font-family:var(--font-jetbrains,monospace);font-size:9px;color:var(--hs-ink3,#565278);letter-spacing:.12em}
        .hs-sec-chevron{font-size:10px;color:var(--domain-color,#ef5a6f);opacity:.55;transition:transform .35s cubic-bezier(.16,1,.3,1);display:inline-block;margin-left:4px}
        .hs-sec-header.collapsed .hs-sec-chevron{transform:rotate(-90deg)}
        .hs-sec-header:hover .hs-sec-name{opacity:.75}
        .hs-sec-body{overflow:hidden;transition:max-height .45s cubic-bezier(.16,1,.3,1),opacity .35s ease;max-height:5000px;opacity:1}
        .hs-sec-body.collapsed{max-height:0;opacity:0}
        .hs-sec-gap{height:64px}
        @media(max-width:680px){.hs-sec-gap{height:40px}}
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
        .hs-bookmark-ring{position:absolute;inset:-1px;border:1px solid rgba(239,90,111,.4);pointer-events:none;z-index:2}
        .hs-bookmark-label{position:absolute;top:-9px;left:10px;font-family:var(--font-jetbrains,monospace);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:rgba(239,90,111,.7);background:var(--hs-bg,#03020a);padding:0 4px;pointer-events:none;z-index:3;white-space:nowrap}
        .hs-bookmark-dot{position:absolute;top:10px;right:10px;width:7px;height:7px;border-radius:50%;background:var(--domain-color,#ef5a6f);pointer-events:none;z-index:3}
        .hs-bookmark-dot::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--domain-color,#ef5a6f) 40%,transparent);animation:hs-bpulse 1.8s ease-out infinite}
        @keyframes hs-bpulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2.4);opacity:0}}
      `}</style>
    </div>
  );
}
