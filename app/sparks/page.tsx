"use client";

// app/sparks/page.tsx — the Sparks list.
// "Illuminated Index × Subtype Lens": the two-pane Council-style index (sticky
// rail + numbered entries) fused with the subtype lens — the rail filters by
// BOTH current (domain) and kind (subtype), every entry wears its kind's colour
// and glyph, and the right pane groups by whichever taxonomy you're not filtering.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import NavG from "@/components/NavG";

type Spark = {
  id: string;
  title: string;
  domain: string;
  excerpt?: string;
  subtype?: string;
  created?: string;
};

// ─── Domain taxonomy ─────────────────────────────────────────────────────────
const DOMAIN_COLOR: Record<string, string> = {
  "cross-domain": "#38bdf8", psychology: "#3b82f6", "eastern-spirituality": "#dc2626",
  "behavioral-mechanics": "#f97316", "creative-practice": "#14b8a6", history: "#f59e0b",
  "african-spirituality": "#10b981", business: "#e879a0",
};
const DOMAIN_LABEL: Record<string, string> = {
  "cross-domain": "Cross-Domain", psychology: "Psychology", "eastern-spirituality": "Eastern Spirituality",
  "behavioral-mechanics": "Behavioral Mechanics", "creative-practice": "Creative Practice", history: "History",
  "african-spirituality": "African Spirituality", business: "Business",
};
const DOMAIN_SHORT: Record<string, string> = {
  "cross-domain": "cross", psychology: "psych", "eastern-spirituality": "eastern",
  "behavioral-mechanics": "behavioral", "creative-practice": "creative", history: "history",
  "african-spirituality": "african", business: "business",
};
const DOMAIN_ORDER = [
  "cross-domain", "eastern-spirituality", "psychology", "behavioral-mechanics",
  "creative-practice", "history", "african-spirituality", "business",
];

// ─── Subtype (kind) taxonomy ─────────────────────────────────────────────────
type Kind = "resonance" | "essay-seed" | "question" | "speculative" | "contradiction" | "synthesis" | "insight" | "other";
const KINDS: Record<Kind, { color: string; glyph: string; label: string }> = {
  resonance: { color: "#e8b86a", glyph: "◈", label: "Resonance" },
  "essay-seed": { color: "#5fc9a8", glyph: "✦", label: "Essay Seed" },
  question: { color: "#f06292", glyph: "?", label: "Question" },
  speculative: { color: "#b794f4", glyph: "◌", label: "Speculative" },
  contradiction: { color: "#f97316", glyph: "⊗", label: "Contradiction" },
  synthesis: { color: "#60a5fa", glyph: "⊹", label: "Synthesis" },
  insight: { color: "#34d399", glyph: "✷", label: "Insight" },
  other: { color: "#9a93a8", glyph: "·", label: "Other" },
};
const KIND_ORDER: Kind[] = ["resonance", "essay-seed", "question", "speculative", "contradiction", "synthesis", "insight", "other"];
function bucketOf(raw?: string): Kind {
  const s = (raw || "").toLowerCase().trim();
  if (!s) return "other";
  if (s.startsWith("resonance")) return "resonance";
  if (s.startsWith("essay-seed")) return "essay-seed";
  if (s.includes("question")) return "question";
  if (s.startsWith("speculative")) return "speculative";
  if (s.startsWith("contradiction")) return "contradiction";
  if (s.startsWith("synthesis")) return "synthesis";
  if (s.startsWith("insight")) return "insight";
  return "other";
}

function cleanTitle(t: string): string {
  return (t || "").replace(/^(Essay Seed:?\s*—?\s*|RESONANCE:\s*|SPARK:\s*)/i, "").replace(/\s+/g, " ").trim();
}
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const i = parseInt(n, 16);
  return `${(i >> 16) & 255},${(i >> 8) & 255},${i & 255}`;
}
function fmtDate(d?: string): string {
  if (!d) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)} ${m[1]}`;
}

const PAGE_SIZE = 120;

type Facet = { mode: "all" | "domain" | "kind"; key: string };

export default function SparksPage() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<Facet>({ mode: "all", key: "all" });
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/data/sparks.json")
      .then((r) => r.json())
      .then((raw: any[]) => {
        if (!alive) return;
        setSparks((raw || []).filter((s) => s.type === "spark").map((s) => ({
          id: String(s.id),
          title: cleanTitle(s.title || s.text || "Untitled"),
          domain: s.domain || "unknown",
          excerpt: (s.excerpt || "").replace(/\s+/g, " ").trim(),
          subtype: s.subtype,
          created: s.created,
        })));
        setLoaded(true);
      })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const domainCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of sparks) c[s.domain] = (c[s.domain] || 0) + 1;
    return c;
  }, [sparks]);
  const kindCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of sparks) { const k = bucketOf(s.subtype); c[k] = (c[k] || 0) + 1; }
    return c;
  }, [sparks]);

  const railDomains = useMemo(() => DOMAIN_ORDER.filter((d) => (domainCounts[d] || 0) > 0), [domainCounts]);
  const railKinds = useMemo(() => KIND_ORDER.filter((k) => (kindCounts[k] || 0) > 0), [kindCounts]);

  const domainRank = (d: string) => { const i = DOMAIN_ORDER.indexOf(d); return i === -1 ? 99 : i; };
  const kindRank = (k: Kind) => KIND_ORDER.indexOf(k);
  const byDate = (a: Spark, b: Spark) => (b.created || "").localeCompare(a.created || "") || a.title.localeCompare(b.title);

  // group the visible list by the taxonomy we are NOT filtering on
  const groupBy: "domain" | "kind" = active.mode === "domain" ? "kind" : "domain";

  const filtered = useMemo(() => {
    let base = sparks;
    if (active.mode === "domain") base = sparks.filter((s) => s.domain === active.key);
    else if (active.mode === "kind") base = sparks.filter((s) => bucketOf(s.subtype) === active.key);
    const arr = [...base];
    if (groupBy === "domain") arr.sort((a, b) => domainRank(a.domain) - domainRank(b.domain) || byDate(a, b));
    else arr.sort((a, b) => kindRank(bucketOf(a.subtype)) - kindRank(bucketOf(b.subtype)) || byDate(a, b));
    return arr;
  }, [sparks, active, groupBy]);

  const shown = filtered.slice(0, limit);

  function pick(f: Facet) {
    if (f.mode === active.mode && f.key === active.key) return;
    setFading(true);
    window.setTimeout(() => { setActive(f); setLimit(PAGE_SIZE); setFading(false); }, 170);
  }

  const facetLabel = active.mode === "all" ? "all sparks"
    : active.mode === "domain" ? DOMAIN_LABEL[active.key] || active.key
    : KINDS[active.key as Kind]?.label || active.key;

  let lastGroup = "";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavG active="Sparks" count={{ value: sparks.length || "—", label: sparks.length ? "sparks" : "loading", color: "#5fc9a8" }} />

      <main className="spx-root">
        <div className="spx-glow" aria-hidden />
        <div className="spx-grain" aria-hidden />

        <div className="spx-inner">
          {/* ── LEFT RAIL ── */}
          <aside className="spx-rail">
            <div className="spx-eyebrow">⚡ eight currents · seven kinds</div>
            <h1 className="spx-title">Sparks</h1>
            <p className="spx-lede">Raw observations before they harden into concepts. Filter by the current they run in, or by the kind of spark they are.</p>

            <div className="spx-railrule" aria-hidden />

            <p className="spx-grouplbl">By current</p>
            <nav className="spx-nav" aria-label="Filter sparks by domain">
              <FacetBtn on={active.mode === "all"} color="var(--ac)" rgb="var(--ac-rgb)" label="All sparks" count={sparks.length || "—"} diamond onClick={() => pick({ mode: "all", key: "all" })} />
              {railDomains.map((d) => {
                const col = DOMAIN_COLOR[d];
                return <FacetBtn key={d} on={active.mode === "domain" && active.key === d} color={col} rgb={hexToRgb(col)} label={DOMAIN_LABEL[d]} count={domainCounts[d]} diamond onClick={() => pick({ mode: "domain", key: d })} />;
              })}
            </nav>

            <p className="spx-grouplbl">By kind</p>
            <nav className="spx-nav" aria-label="Filter sparks by kind">
              {railKinds.map((k) => {
                const m = KINDS[k];
                return <FacetBtn key={k} on={active.mode === "kind" && active.key === k} color={m.color} rgb={hexToRgb(m.color)} label={m.label} count={kindCounts[k]} glyph={m.glyph} onClick={() => pick({ mode: "kind", key: k })} />;
              })}
            </nav>
          </aside>

          {/* ── RIGHT PANE ── */}
          <section className="spx-pane" aria-live="polite">
            <p className="spx-resultline">{loaded ? <><b>{filtered.length}</b> {filtered.length === 1 ? "spark" : "sparks"} · {facetLabel}</> : "loading the index…"}</p>

            <ol className={`spx-list${fading ? " spx-fading" : ""}`}>
              {loaded && filtered.length === 0 && <li className="spx-empty">No sparks here yet.</li>}

              {shown.map((s, i) => {
                const k = bucketOf(s.subtype);
                const km = KINDS[k];
                const num = String(i + 1).padStart(2, "0");
                const gkey = groupBy === "domain" ? s.domain : k;
                const showHead = gkey !== lastGroup;
                if (showHead) lastGroup = gkey;
                const headColor = groupBy === "domain" ? DOMAIN_COLOR[s.domain] || "#8a849a" : km.color;
                const headLabel = groupBy === "domain" ? DOMAIN_LABEL[s.domain] || s.domain : km.label;
                const headCount = groupBy === "domain" ? domainCounts[s.domain] : kindCounts[k];
                return (
                  <li key={s.id}>
                    {showHead && (
                      <div className="spx-subhead" style={{ "--sc": headColor } as React.CSSProperties}>
                        <span className="spx-subhead-lbl">{headLabel}</span>
                        <span className="spx-subhead-n">{headCount}</span>
                      </div>
                    )}
                    <Link href={`/spark/${s.id}`} className={`spx-entry${i < 5 && !fading ? ` spx-stagger spx-s${i}` : ""}`} style={{ "--ec": km.color, "--ec-rgb": hexToRgb(km.color) } as React.CSSProperties}>
                      <span className="spx-num" aria-hidden>{num}</span>
                      <div className="spx-body">
                        <div className="spx-meta">
                          <span className="spx-glyph" aria-hidden>{km.glyph}</span>
                          <span className="spx-kind">{km.label}</span>
                          <span className="spx-dot" aria-hidden>·</span>
                          <span className="spx-domdot" style={{ "--dc": DOMAIN_COLOR[s.domain] || "#8a849a" } as React.CSSProperties} aria-hidden />
                          <span>{DOMAIN_SHORT[s.domain] || s.domain}</span>
                          {s.created && <><span className="spx-dot" aria-hidden>·</span><span className="spx-date">{fmtDate(s.created)}</span></>}
                        </div>
                        <h2 className="spx-etitle">{s.title}</h2>
                        {s.excerpt && <p className="spx-excerpt">{s.excerpt}</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>

            {loaded && filtered.length > limit && (
              <button type="button" className="spx-more" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                show {Math.min(PAGE_SIZE, filtered.length - limit)} more · {filtered.length - limit} remaining
              </button>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function FacetBtn({ on, color, rgb, label, count, diamond, glyph, onClick }: {
  on: boolean; color: string; rgb: string; label: string; count: number | string;
  diamond?: boolean; glyph?: string; onClick: () => void;
}) {
  return (
    <button type="button" className={`spx-navrow${on ? " spx-on" : ""}`} aria-pressed={on} onClick={onClick}
      style={{ "--rc": color, "--rwash": `rgba(${rgb},0.10)` } as React.CSSProperties}>
      {glyph ? <span className="spx-kglyph" aria-hidden>{glyph}</span> : <span className="spx-diamond" aria-hidden />}
      <span className="spx-navlbl">{label}</span>
      <span className="spx-navcount">{count}</span>
    </button>
  );
}

const CSS = `
  .spx-root{
    --ac:#5fc9a8; --ac-rgb:95,201,168;
    --ink:#eae6f5; --muted:#8a849a; --dim:#5a546b;
    --hair:rgba(255,255,255,0.08); --panel:rgba(255,255,255,0.022);
    min-height:calc(100vh - 80px); background:#0e0d14; color:var(--ink);
    position:relative; overflow-x:hidden; font-family:var(--font-newsreader),Georgia,serif;
  }
  html[data-theme="sepia"] .spx-root{
    --ac:#246a55; --ac-rgb:36,106,85;
    --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a;
    --hair:rgba(44,31,14,0.13); --panel:rgba(44,31,14,0.03);
    background:#f0ead8;
  }
  .spx-glow{ position:fixed; top:40px; left:50%; width:1100px; height:720px; transform:translateX(-50%);
    background:radial-gradient(ellipse at center, rgba(var(--ac-rgb),0.10), rgba(var(--ac-rgb),0.03) 42%, transparent 72%);
    pointer-events:none; z-index:0; }
  html[data-theme="sepia"] .spx-glow{ opacity:0.6; }
  .spx-grain{ position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.04; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  html[data-theme="sepia"] .spx-grain{ opacity:0.06; mix-blend-mode:multiply; }

  .spx-inner{ position:relative; z-index:1; max-width:1240px; margin:0 auto; padding:0 32px 96px;
    display:grid; grid-template-columns:36% 64%; align-items:start; }

  /* rail */
  .spx-rail{ position:sticky; top:96px; padding:48px 40px 48px 0; border-right:1px solid var(--hair);
    opacity:0; transform:translateY(14px); animation:spxRise .8s cubic-bezier(0.16,1,0.3,1) .05s forwards; }
  .spx-eyebrow{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.24em;
    text-transform:uppercase; color:var(--ac); opacity:0.85; margin:0 0 18px; }
  .spx-title{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400;
    font-size:clamp(40px,5vw,60px); line-height:1; letter-spacing:-0.02em; color:var(--ink); margin:0; text-wrap:balance; }
  .spx-lede{ font-family:var(--font-newsreader),serif; font-size:16px; line-height:1.6; color:var(--muted);
    margin:18px 0 0; max-width:34ch; text-wrap:pretty; }
  .spx-railrule{ height:1px; background:var(--hair); margin:28px 0 18px; }
  .spx-grouplbl{ font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:0.22em;
    text-transform:uppercase; color:var(--dim); margin:18px 0 8px; }
  .spx-grouplbl:first-of-type{ margin-top:0; }

  .spx-nav{ display:flex; flex-direction:column; gap:2px; }
  .spx-navrow{ position:relative; display:flex; align-items:center; gap:12px; padding:9px 14px 9px 12px;
    border-radius:5px; background:transparent; border:none; cursor:pointer; text-align:left; width:100%;
    color:var(--muted); transition:background .25s, color .25s; -webkit-tap-highlight-color:transparent; }
  .spx-navrow::before{ content:''; position:absolute; left:0; top:7px; bottom:7px; width:2px; border-radius:2px;
    background:var(--rc,var(--ac)); opacity:0; transition:opacity .25s; }
  .spx-navrow:hover{ background:var(--panel); color:var(--ink); }
  .spx-navrow:focus-visible{ outline:2px solid rgba(var(--ac-rgb),0.6); outline-offset:2px; }
  .spx-navrow.spx-on{ background:var(--rwash); color:var(--ink); }
  .spx-navrow.spx-on::before{ opacity:1; }
  .spx-diamond{ width:9px; height:9px; flex-shrink:0; transform:rotate(45deg); background:var(--rc,var(--ac));
    transition:box-shadow .25s; }
  .spx-navrow.spx-on .spx-diamond, .spx-navrow:hover .spx-diamond{ box-shadow:0 0 8px var(--rc,var(--ac)); }
  .spx-kglyph{ width:14px; flex-shrink:0; text-align:center; color:var(--rc,var(--ac));
    font-family:var(--font-fraunces),serif; font-size:14px; line-height:1; }
  .spx-navlbl{ flex:1; font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400;
    font-size:17px; letter-spacing:-0.01em; line-height:1.15; }
  .spx-navcount{ font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--dim);
    font-variant-numeric:tabular-nums; transition:color .25s; }
  .spx-navrow.spx-on .spx-navcount, .spx-navrow:hover .spx-navcount{ color:var(--muted); }

  /* pane */
  .spx-pane{ padding:48px 0 48px 40px; min-width:0; }
  .spx-resultline{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.16em;
    text-transform:uppercase; color:var(--dim); margin:0; font-variant-numeric:tabular-nums; }
  .spx-resultline b{ color:var(--ac); font-weight:400; }
  .spx-list{ list-style:none; margin:24px 0 0; padding:0; transition:opacity .28s; }
  .spx-list.spx-fading{ opacity:0; }

  .spx-subhead{ display:flex; align-items:baseline; gap:12px; margin:36px 0 4px; padding-top:20px; border-top:1px solid var(--hair); }
  .spx-subhead-lbl{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.22em;
    text-transform:uppercase; color:var(--sc,var(--ac)); }
  .spx-subhead-n{ font-family:var(--font-jetbrains),monospace; font-size:10px; color:var(--dim); font-variant-numeric:tabular-nums; }
  .spx-list li:first-child .spx-subhead{ margin-top:0; padding-top:0; border-top:none; }

  .spx-entry{ position:relative; display:grid; grid-template-columns:64px 1fr; gap:20px; padding:22px 16px 22px 14px;
    border-top:1px solid var(--hair); text-decoration:none; color:inherit; transition:background .3s; }
  .spx-list li:first-child .spx-entry{ border-top:none; }
  .spx-entry::before{ content:''; position:absolute; left:0; top:14px; bottom:14px; width:2px; border-radius:2px;
    background:var(--ec,var(--ac)); transform:scaleY(0); transform-origin:top; opacity:0;
    transition:transform .32s cubic-bezier(0.16,1,0.3,1), opacity .3s; }
  .spx-entry:hover, .spx-entry:focus-visible{ background:var(--panel); outline:none; }
  .spx-entry:hover::before, .spx-entry:focus-visible::before{ transform:scaleY(1); opacity:1; }
  .spx-entry:focus-visible{ box-shadow:inset 0 0 0 1px rgba(var(--ec-rgb),0.5); border-radius:4px; }
  .spx-num{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400; font-size:38px;
    line-height:1; color:var(--ec,var(--ac)); font-variant-numeric:tabular-nums; opacity:0.92; }
  .spx-entry:hover .spx-num{ opacity:1; }
  .spx-body{ min-width:0; }
  .spx-meta{ display:flex; align-items:center; gap:8px; margin:6px 0 8px; font-family:var(--font-jetbrains),monospace;
    font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:var(--muted); flex-wrap:wrap; }
  .spx-glyph{ color:var(--ec,var(--ac)); font-size:12px; font-family:var(--font-fraunces),serif; }
  .spx-kind{ color:var(--ec,var(--ac)); }
  .spx-dot{ color:var(--dim); }
  .spx-domdot{ width:6px; height:6px; border-radius:50%; background:var(--dc,#8a849a); display:inline-block; }
  .spx-date{ color:var(--dim); font-variant-numeric:tabular-nums; letter-spacing:0.06em; }
  .spx-etitle{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400; font-size:21px;
    line-height:1.22; letter-spacing:-0.01em; color:var(--ink); margin:0; text-wrap:balance; transition:color .25s; }
  .spx-entry:hover .spx-etitle{ color:var(--ec,var(--ac)); }
  .spx-excerpt{ font-family:var(--font-newsreader),serif; font-size:14.5px; line-height:1.55; color:var(--muted);
    margin:7px 0 0; text-wrap:pretty; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

  .spx-entry.spx-stagger{ opacity:0; transform:translateY(10px); animation:spxRise .7s cubic-bezier(0.16,1,0.3,1) forwards; }
  .spx-entry.spx-s0{ animation-delay:.18s; } .spx-entry.spx-s1{ animation-delay:.26s; }
  .spx-entry.spx-s2{ animation-delay:.34s; } .spx-entry.spx-s3{ animation-delay:.42s; } .spx-entry.spx-s4{ animation-delay:.50s; }

  .spx-more{ display:block; margin:36px auto 0; padding:13px 28px; background:transparent;
    border:1px solid var(--hair); border-radius:6px; font-family:var(--font-jetbrains),monospace; font-size:11px;
    letter-spacing:0.2em; text-transform:uppercase; color:var(--muted); cursor:pointer;
    transition:border-color .25s, color .25s, background .25s; }
  .spx-more:hover{ border-color:rgba(var(--ac-rgb),0.5); color:var(--ac); background:rgba(var(--ac-rgb),0.04); }
  .spx-more:focus-visible{ outline:2px solid rgba(var(--ac-rgb),0.6); outline-offset:2px; }
  .spx-empty{ font-family:var(--font-newsreader),serif; font-style:italic; font-size:16px; color:var(--muted); padding:40px 0; text-align:center; }

  @keyframes spxRise{ to{ opacity:1; transform:translateY(0); } }

  @media (max-width:900px){
    .spx-inner{ grid-template-columns:1fr; padding:0 20px 80px; }
    .spx-rail{ position:static; padding:32px 0 8px; border-right:none; }
    .spx-railrule{ margin:20px 0 14px; }
    .spx-pane{ padding:8px 0 40px; border-top:1px solid var(--hair); }
    .spx-entry{ grid-template-columns:48px 1fr; gap:14px; }
    .spx-num{ font-size:30px; }
  }
  @media (prefers-reduced-motion:reduce){
    .spx-rail, .spx-entry.spx-stagger{ animation:none; opacity:1; transform:none; }
    .spx-list, .spx-entry, .spx-entry::before, .spx-num, .spx-etitle, .spx-diamond{ transition:none; }
  }
`;
