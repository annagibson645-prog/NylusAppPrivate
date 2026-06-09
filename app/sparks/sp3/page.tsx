"use client";

// app/sparks/sp3/page.tsx — SPARKS LIST redesign prototype: "Illuminated Index".
// A two-pane domain reader matching the site's Council "Illuminated Index" idiom:
// a sticky left DOMAIN RAIL of the eight currents beside a scrolling list of that
// domain's sparks. Client component (fetches /data/sparks.json). All custom
// classes prefixed `sp3-`. Void is default; parchment via html[data-theme="sepia"].

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NavG from "@/components/NavG";

type Spark = {
  id: string;
  title: string;
  domain: string;
  color?: string;
  excerpt?: string;
  subtype?: string;
  created?: string;
};

// ─── Domain taxonomy ─────────────────────────────────────────────────────────
const DOMAIN_COLOR: Record<string, string> = {
  "cross-domain": "#38bdf8",
  psychology: "#3b82f6",
  "eastern-spirituality": "#dc2626",
  "behavioral-mechanics": "#f97316",
  "creative-practice": "#14b8a6",
  history: "#f59e0b",
  "african-spirituality": "#10b981",
  business: "#e879a0",
};
const DOMAIN_LABEL: Record<string, string> = {
  "cross-domain": "Cross-Domain",
  psychology: "Psychology",
  "eastern-spirituality": "Eastern Spirituality",
  "behavioral-mechanics": "Behavioral Mechanics",
  "creative-practice": "Creative Practice",
  history: "History",
  "african-spirituality": "African Spirituality",
  business: "Business",
};
const DOMAIN_SHORT: Record<string, string> = {
  "cross-domain": "cross",
  psychology: "psych",
  "eastern-spirituality": "eastern",
  "behavioral-mechanics": "behavioral",
  "creative-practice": "creative",
  history: "history",
  "african-spirituality": "african",
  business: "business",
};
// rail display order
const DOMAIN_ORDER = [
  "cross-domain",
  "eastern-spirituality",
  "psychology",
  "behavioral-mechanics",
  "creative-practice",
  "history",
  "african-spirituality",
  "business",
];

// subtype → glyph
const SUBTYPE_GLYPH: Record<string, string> = {
  resonance: "◈",
  "resonance-harvest": "◈",
  "essay-seed": "✦",
  "essay-seed-companion": "✦",
  question: "?",
  "methodological-question": "?",
  "hub-candidate": "⬡",
  speculative: "◇",
  collision: "✸",
  synthesis: "❖",
  spark: "⚡",
  contradiction: "⚔",
  raw: "•",
  "pattern-candidate": "⊹",
  insight: "✺",
};
function glyphFor(s?: string): string {
  return (s && SUBTYPE_GLYPH[s]) || "⚡";
}

function cleanTitle(t: string): string {
  return (t || "")
    .replace(/^(Essay Seed:?\s*—?\s*|RESONANCE:\s*|SPARK:\s*)/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

const PAGE_SIZE = 150;

const SP3_STYLES = `
  .sp3-root {
    --ac: #5fc9a8;
    --ac-rgb: 95,201,168;
    --ink: #eae6f5;
    --muted: #8a849a;
    --dim: #5a546b;
    --hair: rgba(255,255,255,0.08);
    --panel: rgba(255,255,255,0.022);
    min-height: calc(100vh - 80px);
    background: #0e0d14;
    color: var(--ink);
    position: relative;
    overflow-x: hidden;
  }
  html[data-theme="sepia"] .sp3-root {
    --ac: #246a55;
    --ac-rgb: 47,122,99;
    --ink: #2c1f0e;
    --muted: #6f6048;
    --dim: #a8997a;
    --hair: rgba(44,31,14,0.13);
    --panel: rgba(44,31,14,0.03);
    background: #f0ead8;
    color: var(--ink);
  }

  /* faint accent radial glow + grain */
  .sp3-glow {
    position: fixed;
    top: 40px; left: 50%;
    width: 1100px; height: 720px;
    transform: translateX(-50%);
    background: radial-gradient(ellipse at center,
      rgba(var(--ac-rgb),0.10) 0%,
      rgba(var(--ac-rgb),0.035) 40%,
      rgba(var(--ac-rgb),0) 72%);
    pointer-events: none; z-index: 0;
  }
  html[data-theme="sepia"] .sp3-glow {
    background: radial-gradient(ellipse at center,
      rgba(var(--ac-rgb),0.08) 0%,
      rgba(var(--ac-rgb),0.03) 42%,
      rgba(var(--ac-rgb),0) 74%);
  }
  .sp3-grain {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    opacity: 0.5; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  }
  html[data-theme="sepia"] .sp3-grain { opacity: 0.35; mix-blend-mode: multiply; }

  .sp3-inner {
    position: relative; z-index: 1;
    max-width: 1240px; margin: 0 auto;
    padding: 0 32px 96px;
    display: grid;
    grid-template-columns: 36% 64%;
    gap: 0;
    align-items: start;
  }

  /* ── LEFT RAIL ── */
  .sp3-rail {
    position: sticky; top: 96px;
    padding: 48px 40px 48px 0;
    border-right: 1px solid var(--hair);
    opacity: 0; transform: translateY(14px);
    animation: sp3-rise 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s forwards;
  }
  .sp3-eyebrow {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--ac); opacity: 0.82; margin: 0 0 18px;
  }
  .sp3-title {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic; font-weight: 400;
    font-size: clamp(40px, 5vw, 60px); line-height: 1.0;
    letter-spacing: -0.02em; color: var(--ink); margin: 0;
    text-wrap: balance;
  }
  .sp3-lede {
    font-family: var(--font-newsreader), Georgia, serif;
    font-weight: 400; font-size: 16px; line-height: 1.6;
    color: var(--muted); margin: 18px 0 0; max-width: 34ch;
    text-wrap: pretty;
  }
  .sp3-railrule { height: 1px; background: var(--hair); margin: 28px 0 20px; }

  .sp3-nav { display: flex; flex-direction: column; gap: 2px; }
  .sp3-navrow {
    position: relative; display: flex; align-items: center; gap: 12px;
    padding: 11px 14px 11px 12px; border-radius: 5px;
    background: transparent; border: none; cursor: pointer;
    text-align: left; width: 100%; color: var(--muted);
    transition: background 0.25s ease, color 0.25s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .sp3-navrow::before {
    content: ''; position: absolute; left: 0; top: 8px; bottom: 8px;
    width: 2px; border-radius: 2px; background: var(--rc, var(--ac));
    opacity: 0; transition: opacity 0.25s ease;
  }
  .sp3-navrow:hover { background: var(--panel); color: var(--ink); }
  .sp3-navrow:focus-visible {
    outline: 2px solid rgba(var(--ac-rgb),0.6); outline-offset: 2px;
  }
  .sp3-navrow.sp3-on {
    background: var(--rwash, rgba(var(--ac-rgb),0.07));
    color: var(--ink);
  }
  .sp3-navrow.sp3-on::before { opacity: 1; }
  .sp3-diamond {
    width: 9px; height: 9px; flex-shrink: 0;
    transform: rotate(45deg);
    background: var(--rc, var(--ac));
    box-shadow: 0 0 7px rgba(var(--ac-rgb),0.0);
    transition: box-shadow 0.25s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  .sp3-navrow.sp3-on .sp3-diamond,
  .sp3-navrow:hover .sp3-diamond {
    box-shadow: 0 0 8px var(--rc, var(--ac));
  }
  .sp3-navlbl {
    flex: 1;
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic; font-weight: 400; font-size: 18px;
    letter-spacing: -0.01em; line-height: 1.15;
  }
  .sp3-navcount {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 0.04em;
    color: var(--dim); font-variant-numeric: tabular-nums;
    transition: color 0.25s ease;
  }
  .sp3-navrow.sp3-on .sp3-navcount,
  .sp3-navrow:hover .sp3-navcount { color: var(--muted); }

  /* ── RIGHT PANE ── */
  .sp3-pane {
    padding: 48px 0 48px 40px;
    min-width: 0;
  }
  .sp3-resultline {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--dim); margin: 0 0 4px; font-variant-numeric: tabular-nums;
  }
  .sp3-resultline b { color: var(--ac); font-weight: 400; }

  .sp3-list {
    list-style: none; margin: 24px 0 0; padding: 0;
    transition: opacity 0.28s ease;
  }
  .sp3-list.sp3-fading { opacity: 0; }

  .sp3-subhead {
    display: flex; align-items: baseline; gap: 12px;
    margin: 36px 0 4px; padding-top: 20px;
    border-top: 1px solid var(--hair);
  }
  .sp3-subhead:first-child { margin-top: 0; padding-top: 0; border-top: none; }
  .sp3-subhead-lbl {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--sc, var(--ac));
  }
  .sp3-subhead-n {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.04em; color: var(--dim);
    font-variant-numeric: tabular-nums;
  }

  .sp3-entry {
    position: relative;
    display: grid; grid-template-columns: 64px 1fr; gap: 20px;
    padding: 22px 16px 22px 14px;
    border-top: 1px solid var(--hair);
    text-decoration: none; color: inherit;
    transition: background 0.3s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .sp3-entry:first-of-type { border-top: none; }
  .sp3-entry::before {
    content: ''; position: absolute; left: 0; top: 14px; bottom: 14px;
    width: 2px; border-radius: 2px;
    background: var(--ec, var(--ac));
    transform: scaleY(0); transform-origin: top;
    opacity: 0; transition: transform 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease;
  }
  .sp3-entry:hover, .sp3-entry:focus-visible { background: var(--panel); outline: none; }
  .sp3-entry:hover::before, .sp3-entry:focus-visible::before {
    transform: scaleY(1); opacity: 1;
  }
  .sp3-entry:focus-visible {
    box-shadow: inset 0 0 0 1px rgba(var(--ac-rgb),0.4);
    border-radius: 4px;
  }

  .sp3-num {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic; font-weight: 400; font-size: 38px; line-height: 1;
    color: var(--ec, var(--ac));
    font-variant-numeric: tabular-nums;
    opacity: 0.92;
    transition: opacity 0.3s ease;
  }
  .sp3-entry:hover .sp3-num { opacity: 1; }

  .sp3-body { min-width: 0; }
  .sp3-meta {
    display: flex; align-items: center; gap: 8px;
    margin: 6px 0 8px;
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted);
  }
  .sp3-glyph { color: var(--ec, var(--ac)); font-size: 12px; }
  .sp3-dot { color: var(--dim); }
  .sp3-date {
    color: var(--dim); font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
  }
  .sp3-etitle {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic; font-weight: 400;
    font-size: 21px; line-height: 1.22; letter-spacing: -0.01em;
    color: var(--ink); margin: 0; text-wrap: balance;
    transition: color 0.25s ease;
  }
  .sp3-entry:hover .sp3-etitle { color: var(--ec, var(--ac)); }
  html[data-theme="sepia"] .sp3-entry:hover .sp3-etitle { color: var(--ec, var(--ac)); }
  .sp3-excerpt {
    font-family: var(--font-newsreader), Georgia, serif;
    font-weight: 400; font-size: 14.5px; line-height: 1.55;
    color: var(--muted); margin: 7px 0 0;
    text-wrap: pretty;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* stagger first few entries on load */
  .sp3-entry.sp3-stagger {
    opacity: 0; transform: translateY(10px);
    animation: sp3-rise 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  .sp3-entry.sp3-s0 { animation-delay: 0.18s; }
  .sp3-entry.sp3-s1 { animation-delay: 0.26s; }
  .sp3-entry.sp3-s2 { animation-delay: 0.34s; }
  .sp3-entry.sp3-s3 { animation-delay: 0.42s; }
  .sp3-entry.sp3-s4 { animation-delay: 0.50s; }

  .sp3-more {
    display: block; margin: 36px auto 0;
    padding: 13px 28px;
    background: transparent;
    border: 1px solid var(--hair); border-radius: 6px;
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--muted); cursor: pointer;
    transition: border-color 0.25s ease, color 0.25s ease, background 0.25s ease;
  }
  .sp3-more:hover {
    border-color: rgba(var(--ac-rgb),0.5); color: var(--ac);
    background: rgba(var(--ac-rgb),0.04);
  }
  .sp3-more:focus-visible {
    outline: 2px solid rgba(var(--ac-rgb),0.6); outline-offset: 2px;
  }
  .sp3-empty {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic; font-size: 16px; color: var(--muted);
    padding: 40px 0; text-align: center;
  }

  @keyframes sp3-rise { to { opacity: 1; transform: translateY(0); } }

  /* ── chip rail (mobile) ── */
  .sp3-chips { display: none; }

  @media (max-width: 900px) {
    .sp3-inner { grid-template-columns: 1fr; padding: 0 20px 80px; }
    .sp3-rail {
      position: static; padding: 36px 0 8px; border-right: none;
    }
    .sp3-railrule { display: none; }
    .sp3-nav { display: none; }
    .sp3-chips {
      display: flex; gap: 8px; overflow-x: auto;
      margin: 24px 0 4px; padding: 4px 0 12px;
      scrollbar-width: none; -webkit-overflow-scrolling: touch;
    }
    .sp3-chips::-webkit-scrollbar { display: none; }
    .sp3-chip {
      flex-shrink: 0; display: flex; align-items: center; gap: 7px;
      padding: 8px 14px; border-radius: 999px;
      border: 1px solid var(--hair); background: transparent;
      cursor: pointer; color: var(--muted);
      font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
      font-size: 11px; letter-spacing: 0.08em;
      transition: border-color 0.25s ease, color 0.25s ease, background 0.25s ease;
    }
    .sp3-chip:focus-visible { outline: 2px solid rgba(var(--ac-rgb),0.6); outline-offset: 2px; }
    .sp3-chip.sp3-on { color: var(--ink); border-color: var(--rc, var(--ac)); background: var(--rwash, rgba(var(--ac-rgb),0.08)); }
    .sp3-chip-d { width: 7px; height: 7px; transform: rotate(45deg); background: var(--rc, var(--ac)); flex-shrink: 0; }
    .sp3-chip-n { font-variant-numeric: tabular-nums; color: var(--dim); }
    .sp3-pane { padding: 16px 0 40px; border-top: 1px solid var(--hair); }
    .sp3-entry { grid-template-columns: 48px 1fr; gap: 14px; }
    .sp3-num { font-size: 30px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sp3-rail, .sp3-entry.sp3-stagger { animation: none; opacity: 1; transform: none; }
    .sp3-list, .sp3-entry, .sp3-entry::before, .sp3-num, .sp3-etitle, .sp3-diamond { transition: none; }
  }
`;

function fmtDate(d?: string): string {
  if (!d) return "";
  // expect YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)} ${m[1]}`;
}

export default function SparksSp3Page() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<string>("all"); // "all" or a domain key
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/data/sparks.json")
      .then((r) => r.json())
      .then((raw: any[]) => {
        if (!alive) return;
        const cleaned: Spark[] = (raw || [])
          .filter((s) => s.type === "spark")
          .map((s) => ({
            id: s.id,
            title: cleanTitle(s.title || s.text || "Untitled"),
            domain: s.domain || "unknown",
            color: s.color,
            excerpt: (s.excerpt || "").trim(),
            subtype: s.subtype,
            created: s.created,
          }));
        setSparks(cleaned);
        setLoaded(true);
      })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  // counts per domain (only domains we know + that have entries)
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of sparks) c[s.domain] = (c[s.domain] || 0) + 1;
    return c;
  }, [sparks]);

  const railDomains = useMemo(
    () => DOMAIN_ORDER.filter((d) => (counts[d] || 0) > 0),
    [counts]
  );

  // sort helper: domain order, then newest first, then title
  const domainRank = (d: string) => {
    const i = DOMAIN_ORDER.indexOf(d);
    return i === -1 ? 99 : i;
  };
  const byDateDesc = (a: Spark, b: Spark) =>
    (b.created || "").localeCompare(a.created || "") ||
    a.title.localeCompare(b.title);

  // the visible (filtered + sorted) full set
  const filtered = useMemo(() => {
    const base =
      active === "all"
        ? [...sparks].sort(
            (a, b) =>
              domainRank(a.domain) - domainRank(b.domain) || byDateDesc(a, b)
          )
        : sparks.filter((s) => s.domain === active).sort(byDateDesc);
    return base;
  }, [sparks, active]);

  const shown = filtered.slice(0, limit);

  function pick(domain: string) {
    if (domain === active) return;
    setFading(true);
    window.setTimeout(() => {
      setActive(domain);
      setLimit(PAGE_SIZE);
      setFading(false);
    }, 180);
  }

  const accentFor = (d: string) =>
    active === "all" ? DOMAIN_COLOR[d] || "var(--ac)" : "var(--ac)";

  const totalLabel =
    active === "all" ? "all currents" : DOMAIN_LABEL[active] || active;

  // For "all": detect domain group boundaries to render subheaders.
  let lastDomain = "";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SP3_STYLES }} />
      <NavG
        active="Sparks"
        count={{
          value: sparks.length || "—",
          label: sparks.length ? "sparks" : "loading",
          color: "#5fc9a8",
        }}
      />

      <main className="sp3-root">
        <div className="sp3-glow" aria-hidden="true" />
        <div className="sp3-grain" aria-hidden="true" />

        <div className="sp3-inner">
          {/* ── LEFT RAIL ── */}
          <aside className="sp3-rail">
            <div className="sp3-eyebrow">⚡ eight currents</div>
            <h1 className="sp3-title">Sparks</h1>
            <p className="sp3-lede">
              Raw observations and resonances before they harden into concepts —
              read each current on its own, or let them run together.
            </p>

            <div className="sp3-railrule" aria-hidden="true" />

            <nav className="sp3-nav" aria-label="Filter sparks by domain">
              <button
                type="button"
                className={`sp3-navrow${active === "all" ? " sp3-on" : ""}`}
                aria-pressed={active === "all"}
                onClick={() => pick("all")}
                style={
                  {
                    "--rc": "var(--ac)",
                    "--rwash": "rgba(var(--ac-rgb),0.08)",
                  } as React.CSSProperties
                }
              >
                <span className="sp3-diamond" aria-hidden="true" />
                <span className="sp3-navlbl">All currents</span>
                <span className="sp3-navcount">{sparks.length || "—"}</span>
              </button>

              {railDomains.map((d) => {
                const col = DOMAIN_COLOR[d] || "#8a849a";
                const rgb = hexToRgb(col);
                return (
                  <button
                    key={d}
                    type="button"
                    className={`sp3-navrow${active === d ? " sp3-on" : ""}`}
                    aria-pressed={active === d}
                    onClick={() => pick(d)}
                    style={
                      {
                        "--rc": col,
                        "--rwash": `rgba(${rgb},0.10)`,
                      } as React.CSSProperties
                    }
                  >
                    <span className="sp3-diamond" aria-hidden="true" />
                    <span className="sp3-navlbl">{DOMAIN_LABEL[d] || d}</span>
                    <span className="sp3-navcount">{counts[d]}</span>
                  </button>
                );
              })}
            </nav>

            {/* mobile chip rail */}
            <div className="sp3-chips" role="tablist" aria-label="Filter sparks by domain">
              <button
                type="button"
                className={`sp3-chip${active === "all" ? " sp3-on" : ""}`}
                onClick={() => pick("all")}
                style={{ "--rc": "var(--ac)" } as React.CSSProperties}
              >
                <span className="sp3-chip-d" aria-hidden="true" />
                All
                <span className="sp3-chip-n">{sparks.length || "—"}</span>
              </button>
              {railDomains.map((d) => {
                const col = DOMAIN_COLOR[d] || "#8a849a";
                const rgb = hexToRgb(col);
                return (
                  <button
                    key={d}
                    type="button"
                    className={`sp3-chip${active === d ? " sp3-on" : ""}`}
                    onClick={() => pick(d)}
                    style={
                      { "--rc": col, "--rwash": `rgba(${rgb},0.14)` } as React.CSSProperties
                    }
                  >
                    <span className="sp3-chip-d" aria-hidden="true" />
                    {DOMAIN_SHORT[d] || d}
                    <span className="sp3-chip-n">{counts[d]}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── RIGHT PANE ── */}
          <section className="sp3-pane" aria-live="polite">
            <p className="sp3-resultline">
              {loaded ? (
                <>
                  <b>{filtered.length}</b>{" "}
                  {filtered.length === 1 ? "spark" : "sparks"} · {totalLabel}
                </>
              ) : (
                "loading the index…"
              )}
            </p>

            <ol className={`sp3-list${fading ? " sp3-fading" : ""}`}>
              {loaded && filtered.length === 0 && (
                <li className="sp3-empty">No sparks in this current yet.</li>
              )}

              {shown.map((s, i) => {
                const col = DOMAIN_COLOR[s.domain] || "#8a849a";
                const ec = active === "all" ? col : "var(--ac)";
                const num = String(i + 1).padStart(2, "0");
                const showHead =
                  active === "all" && s.domain !== lastDomain;
                if (showHead) lastDomain = s.domain;
                return (
                  <li key={s.id}>
                    {showHead && (
                      <div
                        className="sp3-subhead"
                        style={{ "--sc": col } as React.CSSProperties}
                      >
                        <span className="sp3-subhead-lbl">
                          {DOMAIN_LABEL[s.domain] || s.domain}
                        </span>
                        <span className="sp3-subhead-n">
                          {counts[s.domain]}
                        </span>
                      </div>
                    )}
                    <Link
                      href={`/spark/${s.id}`}
                      className={`sp3-entry${
                        i < 5 && !fading ? ` sp3-stagger sp3-s${i}` : ""
                      }`}
                      style={{ "--ec": ec } as React.CSSProperties}
                    >
                      <span className="sp3-num" aria-hidden="true">
                        {num}
                      </span>
                      <div className="sp3-body">
                        <div className="sp3-meta">
                          <span className="sp3-glyph" aria-hidden="true">
                            {glyphFor(s.subtype)}
                          </span>
                          <span>{DOMAIN_SHORT[s.domain] || s.domain}</span>
                          {s.created && (
                            <>
                              <span className="sp3-dot" aria-hidden="true">·</span>
                              <span className="sp3-date">{fmtDate(s.created)}</span>
                            </>
                          )}
                        </div>
                        <h2 className="sp3-etitle">{s.title}</h2>
                        {s.excerpt && (
                          <p className="sp3-excerpt">{s.excerpt}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>

            {loaded && filtered.length > limit && (
              <button
                type="button"
                className="sp3-more"
                onClick={() => setLimit((n) => n + PAGE_SIZE)}
              >
                show {Math.min(PAGE_SIZE, filtered.length - limit)} more ·{" "}
                {filtered.length - limit} remaining
              </button>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

// hex (#rrggbb) → "r,g,b"
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
