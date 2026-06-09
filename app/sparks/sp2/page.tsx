"use client";

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

const SUBTYPE_GLYPH: Record<string, string> = {
  resonance: "◈",
  "essay-seed": "✦",
  question: "?",
  speculative: "◌",
  contradiction: "⊗",
  synthesis: "⊹",
  insight: "✷",
};
const glyphFor = (s?: string) => (s && SUBTYPE_GLYPH[s]) || "·";

// Subtype filter toggles (mono)
const SUBTYPE_FILTERS = [
  { key: "all", label: "all" },
  { key: "resonance", label: "resonance" },
  { key: "essay-seed", label: "essay-seed" },
  { key: "question", label: "question" },
  { key: "speculative", label: "speculative" },
] as const;

const DOMAIN_ORDER = [
  "cross-domain",
  "eastern-spirituality",
  "psychology",
  "creative-practice",
  "history",
  "behavioral-mechanics",
  "african-spirituality",
  "business",
];

function cleanTitle(t: string): string {
  return (t || "")
    .replace(/^(Essay Seed:?\s*—?\s*|RESONANCE:\s*|SPARK:\s*)/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

function monthLabel(iso?: string): string | null {
  if (!iso || iso.length < 7) return null;
  const y = iso.slice(0, 4);
  const m = parseInt(iso.slice(5, 7), 10);
  if (!m || m < 1 || m > 12) return null;
  return `${MONTHS[m - 1]} ${y}`;
}

function dayLabel(iso?: string): string {
  if (!iso || iso.length < 10) return "—— ——";
  const m = parseInt(iso.slice(5, 7), 10);
  const d = iso.slice(8, 10);
  const mon = (MONTHS[m - 1] || "").slice(0, 3);
  const cap = mon.charAt(0) + mon.slice(1).toLowerCase();
  return `${cap} ${d}`;
}

const INITIAL_BATCH = 120;
const STEP = 120;

export default function SparkStreamPage() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [domain, setDomain] = useState<string>("all");
  const [sub, setSub] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [shown, setShown] = useState<number>(INITIAL_BATCH);

  useEffect(() => {
    let alive = true;
    fetch("/data/sparks.json")
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (!alive) return;
        const cleaned: Spark[] = rows
          .filter((s) => (s as any).type === "spark")
          .map((s) => ({
            id: s.id,
            title: cleanTitle(s.title || s.text || "Untitled"),
            domain: s.domain || "cross-domain",
            color: s.color,
            excerpt: s.excerpt,
            subtype: s.subtype,
            created: s.created,
          }));
        setSparks(cleaned);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Available domains (in canonical order, only those present)
  const domains = useMemo(() => {
    const present = new Set(sparks.map((s) => s.domain));
    return DOMAIN_ORDER.filter((d) => present.has(d));
  }, [sparks]);

  const filtered = useMemo(() => {
    let list = sparks.slice();
    if (domain !== "all") list = list.filter((s) => s.domain === domain);
    if (sub !== "all") list = list.filter((s) => (s.subtype || "") === sub);
    list.sort((a, b) => {
      const av = a.created || "";
      const bv = b.created || "";
      if (av === bv) return 0;
      return sort === "newest" ? (av < bv ? 1 : -1) : av < bv ? -1 : 1;
    });
    return list;
  }, [sparks, domain, sub, sort]);

  useEffect(() => {
    setShown(INITIAL_BATCH);
  }, [domain, sub, sort]);

  const visible = filtered.slice(0, shown);

  // Build stream rows with month dividers interleaved
  type Row =
    | { kind: "month"; key: string; label: string }
    | { kind: "spark"; key: string; spark: Spark; i: number };
  const rows: Row[] = [];
  let lastMonth: string | null = null;
  visible.forEach((s, i) => {
    const ml = monthLabel(s.created);
    if (ml && ml !== lastMonth) {
      rows.push({ kind: "month", key: `m-${ml}`, label: ml });
      lastMonth = ml;
    }
    rows.push({ kind: "spark", key: s.id, spark: s, i });
  });

  return (
    <div className="sp2-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <NavG
        active="Sparks"
        count={{
          value: sparks.length || "—",
          label: sparks.length ? "sparks" : "loading",
          color: "#5fc9a8",
        }}
      />

      <div className="sp2-atmos" aria-hidden />
      <div className="sp2-grain" aria-hidden />

      <main className="sp2-main">
        {/* Header */}
        <header className="sp2-head">
          <div className="sp2-eyebrow">⚡ a running notebook</div>
          <h1 className="sp2-title">Sparks</h1>
          <p className="sp2-lede">
            A continuous stream of observations, resonances and half-formed
            seeds — caught the moment they landed, dated and pinned to the line.
          </p>
        </header>

        {/* Controls */}
        <section className="sp2-controls" aria-label="Filters">
          <div className="sp2-chips" role="group" aria-label="Domain filter">
            <button
              className={`sp2-chip${domain === "all" ? " sp2-chip-on" : ""}`}
              onClick={() => setDomain("all")}
              style={
                domain === "all"
                  ? ({ ["--chip" as any]: "var(--ac)" } as React.CSSProperties)
                  : undefined
              }
            >
              all domains
            </button>
            {domains.map((d) => {
              const c = DOMAIN_COLOR[d] || "var(--ac)";
              const on = domain === d;
              return (
                <button
                  key={d}
                  className={`sp2-chip${on ? " sp2-chip-on" : ""}`}
                  onClick={() => setDomain(on ? "all" : d)}
                  style={{ ["--chip" as any]: c } as React.CSSProperties}
                >
                  <span className="sp2-chip-dot" style={{ background: c }} />
                  {DOMAIN_SHORT[d] || d}
                </button>
              );
            })}
          </div>

          <div className="sp2-toolbar">
            <div className="sp2-subs" role="group" aria-label="Type filter">
              {SUBTYPE_FILTERS.map((t) => (
                <button
                  key={t.key}
                  className={`sp2-sub${sub === t.key ? " sp2-sub-on" : ""}`}
                  onClick={() => setSub(t.key)}
                  aria-pressed={sub === t.key}
                >
                  {t.key !== "all" && (
                    <span className="sp2-sub-glyph">{glyphFor(t.key)}</span>
                  )}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="sp2-sort" role="group" aria-label="Sort order">
              <button
                className={`sp2-sortbtn${sort === "newest" ? " sp2-sort-on" : ""}`}
                onClick={() => setSort("newest")}
                aria-pressed={sort === "newest"}
              >
                newest
              </button>
              <span className="sp2-sort-sep">/</span>
              <button
                className={`sp2-sortbtn${sort === "oldest" ? " sp2-sort-on" : ""}`}
                onClick={() => setSort("oldest")}
                aria-pressed={sort === "oldest"}
              >
                oldest
              </button>
            </div>
          </div>

          <div className="sp2-count">
            {filtered.length}
            {filtered.length === 1 ? " entry" : " entries"}
            {domain !== "all" || sub !== "all" ? " · filtered" : ""}
          </div>
        </section>

        {/* The Stream */}
        <section className="sp2-stream" aria-label="Spark stream">
          <div className="sp2-rule" aria-hidden />

          {sparks.length === 0 && (
            <div className="sp2-empty">gathering the notebook…</div>
          )}

          {rows.map((row) =>
            row.kind === "month" ? (
              <div className="sp2-month" key={row.key}>
                <span className="sp2-month-node" aria-hidden />
                <span className="sp2-month-lbl">{row.label}</span>
              </div>
            ) : (
              <SparkEntry key={row.key} spark={row.spark} i={row.i} />
            )
          )}
        </section>

        {shown < filtered.length && (
          <div className="sp2-more-wrap">
            <button
              className="sp2-more"
              onClick={() => setShown((n) => n + STEP)}
            >
              show more
              <span className="sp2-more-n">
                {filtered.length - shown} remaining
              </span>
            </button>
          </div>
        )}

        {sparks.length > 0 && shown >= filtered.length && filtered.length > 0 && (
          <div className="sp2-end">
            <span className="sp2-end-node" aria-hidden />
            <span className="sp2-end-lbl">end of the stream</span>
          </div>
        )}
      </main>
    </div>
  );
}

function SparkEntry({ spark, i }: { spark: Spark; i: number }) {
  const c = DOMAIN_COLOR[spark.domain] || spark.color || "var(--ac)";
  const short = DOMAIN_SHORT[spark.domain] || spark.domain;
  const glyph = glyphFor(spark.subtype);
  const delay = Math.min(i, 18) * 38;

  return (
    <Link
      href={`/spark/${spark.id}`}
      className="sp2-entry"
      style={
        {
          ["--node" as any]: c,
          animationDelay: `${delay}ms`,
        } as React.CSSProperties
      }
    >
      <span className="sp2-node" style={{ ["--node" as any]: c } as React.CSSProperties} />
      <div className="sp2-entry-body">
        <div className="sp2-meta">
          <span className="sp2-date">{dayLabel(spark.created)}</span>
          <span className="sp2-meta-sep">·</span>
          <span className="sp2-glyph" style={{ color: c }}>
            {glyph}
          </span>
          <span className="sp2-domain" style={{ color: c }}>
            {short}
          </span>
          {spark.subtype && (
            <span className="sp2-subtype">{spark.subtype}</span>
          )}
        </div>
        <h2 className="sp2-entry-title">{spark.title}</h2>
        {spark.excerpt && <p className="sp2-excerpt">{spark.excerpt}</p>}
      </div>
    </Link>
  );
}

const CSS = `
.sp2-root{
  --bg:#0e0d14; --ink:#eae6f5; --muted:#8a849a; --dim:#5a546b;
  --hair:rgba(255,255,255,0.08); --panel:rgba(255,255,255,0.022);
  --ac:#5fc9a8; --ac-rgb:95,201,168;
  min-height:100vh; background:var(--bg); color:var(--ink);
  font-family:var(--font-newsreader),Georgia,serif;
  position:relative; overflow-x:hidden;
}
html[data-theme="sepia"] .sp2-root{
  --bg:#f0ead8; --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a;
  --hair:rgba(44,31,14,0.13); --panel:rgba(44,31,14,0.03);
  --ac:#246a55; --ac-rgb:47,122,99;
}

/* Atmosphere */
.sp2-atmos{
  position:fixed; inset:0; z-index:0; pointer-events:none;
  background:
    radial-gradient(70% 50% at 50% -8%, rgba(var(--ac-rgb),0.14), transparent 70%),
    radial-gradient(40% 40% at 88% 18%, rgba(var(--ac-rgb),0.06), transparent 70%);
}
.sp2-grain{
  position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.04;
  mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
html[data-theme="sepia"] .sp2-grain{ mix-blend-mode:multiply; opacity:0.05; }

.sp2-main{
  position:relative; z-index:1;
  max-width:760px; margin:0 auto; padding:0 24px 160px;
}

/* Header */
.sp2-head{ padding:72px 0 40px; }
.sp2-eyebrow{
  font-family:var(--font-jetbrains),monospace;
  font-size:11px; letter-spacing:0.22em; text-transform:lowercase;
  color:var(--ac); margin-bottom:18px;
}
.sp2-title{
  font-family:var(--font-fraunces),Georgia,serif; font-style:italic;
  font-weight:500; font-size:clamp(48px,9vw,84px); line-height:0.95;
  margin:0 0 18px; letter-spacing:-0.02em;
  text-wrap:balance;
}
.sp2-lede{
  font-family:var(--font-newsreader),Georgia,serif;
  font-size:18px; line-height:1.55; color:var(--muted);
  max-width:48ch; margin:0; text-wrap:pretty;
}

/* Controls */
.sp2-controls{ margin-bottom:48px; }
.sp2-chips{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; }
.sp2-chip{
  display:inline-flex; align-items:center; gap:7px;
  font-family:var(--font-jetbrains),monospace;
  font-size:11px; letter-spacing:0.04em;
  color:var(--muted); background:var(--panel);
  border:1px solid var(--hair); border-radius:999px;
  padding:7px 14px; cursor:pointer;
  transition:color .2s,border-color .2s,background .2s,transform .2s cubic-bezier(0.16,1,0.3,1);
}
.sp2-chip:hover{ color:var(--ink); border-color:rgba(var(--ac-rgb),0.4); transform:translateY(-1px); }
.sp2-chip-on{
  color:var(--ink);
  border-color:var(--chip,var(--ac));
  background:color-mix(in srgb, var(--chip,var(--ac)) 14%, transparent);
}
.sp2-chip-dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }

.sp2-toolbar{
  display:flex; flex-wrap:wrap; align-items:center;
  justify-content:space-between; gap:16px;
  padding-top:16px; border-top:1px solid var(--hair);
}
.sp2-subs{ display:flex; flex-wrap:wrap; gap:4px; }
.sp2-sub{
  display:inline-flex; align-items:center; gap:5px;
  font-family:var(--font-jetbrains),monospace;
  font-size:10.5px; letter-spacing:0.05em;
  color:var(--dim); background:transparent;
  border:1px solid transparent; border-radius:6px;
  padding:5px 9px; cursor:pointer;
  transition:color .2s,background .2s,border-color .2s;
}
.sp2-sub:hover{ color:var(--muted); background:var(--panel); }
.sp2-sub-on{
  color:var(--ac);
  border-color:rgba(var(--ac-rgb),0.35);
  background:rgba(var(--ac-rgb),0.08);
}
.sp2-sub-glyph{ font-size:11px; opacity:0.9; }

.sp2-sort{ display:inline-flex; align-items:center; gap:6px; }
.sp2-sortbtn{
  font-family:var(--font-jetbrains),monospace;
  font-size:10.5px; letter-spacing:0.08em; text-transform:lowercase;
  color:var(--dim); background:none; border:none; cursor:pointer;
  padding:4px 2px; transition:color .2s;
}
.sp2-sortbtn:hover{ color:var(--muted); }
.sp2-sort-on{ color:var(--ink); text-decoration:underline; text-underline-offset:4px; text-decoration-color:var(--ac); }
.sp2-sort-sep{ color:var(--dim); font-family:var(--font-jetbrains),monospace; font-size:10px; }

.sp2-count{
  margin-top:16px;
  font-family:var(--font-jetbrains),monospace;
  font-size:10px; letter-spacing:0.14em; text-transform:uppercase;
  color:var(--dim); font-variant-numeric:tabular-nums;
}

/* Stream */
.sp2-stream{ position:relative; padding-left:34px; }
.sp2-rule{
  position:absolute; left:5px; top:6px; bottom:6px; width:1px;
  background:linear-gradient(to bottom,
    transparent,
    rgba(var(--ac-rgb),0.5) 6%,
    rgba(var(--ac-rgb),0.32) 50%,
    rgba(var(--ac-rgb),0.5) 94%,
    transparent);
}
.sp2-empty{
  font-family:var(--font-jetbrains),monospace; font-size:12px;
  color:var(--dim); letter-spacing:0.08em; padding:24px 0;
}

/* Month dividers */
.sp2-month{
  position:relative; display:flex; align-items:center; gap:12px;
  margin:40px 0 20px;
}
.sp2-month:first-child{ margin-top:8px; }
.sp2-month-node{
  position:absolute; left:-34px; top:50%; transform:translateY(-50%);
  width:11px; height:11px; border-radius:2px; rotate:45deg;
  background:var(--bg); border:1px solid rgba(var(--ac-rgb),0.7);
  margin-left:-0.5px;
}
.sp2-month-lbl{
  font-family:var(--font-jetbrains),monospace;
  font-size:10px; letter-spacing:0.28em; text-transform:uppercase;
  color:var(--muted);
}

/* Entry */
.sp2-entry{
  position:relative; display:block; text-decoration:none; color:inherit;
  padding:16px 0 18px 24px; margin-left:-2px;
  border-bottom:1px solid var(--hair);
  opacity:0; transform:translateX(14px);
  animation:sp2In 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
  transition:transform .35s cubic-bezier(0.16,1,0.3,1);
}
.sp2-entry:last-child{ border-bottom:none; }
.sp2-entry:hover{ transform:translateX(6px); }

.sp2-node{
  position:absolute; left:-31px; top:24px;
  width:9px; height:9px; border-radius:50%;
  background:var(--node);
  box-shadow:0 0 0 3px var(--bg), 0 0 8px rgba(var(--ac-rgb),0.25);
  animation:sp2Pulse 3.4s ease-in-out infinite;
  transition:box-shadow .3s, transform .3s;
}
.sp2-entry:hover .sp2-node{
  transform:scale(1.25);
  box-shadow:0 0 0 3px var(--bg), 0 0 14px var(--node);
}

.sp2-entry-body{ min-width:0; }
.sp2-meta{
  display:flex; align-items:center; flex-wrap:wrap; gap:8px;
  margin-bottom:7px;
  font-family:var(--font-jetbrains),monospace; font-size:10.5px;
}
.sp2-date{
  color:var(--dim); letter-spacing:0.06em; font-variant-numeric:tabular-nums;
}
.sp2-meta-sep{ color:var(--dim); opacity:0.6; }
.sp2-glyph{ font-size:12px; line-height:1; }
.sp2-domain{ letter-spacing:0.1em; text-transform:uppercase; font-size:9.5px; }
.sp2-subtype{
  color:var(--dim); letter-spacing:0.06em; font-size:9px;
  text-transform:uppercase; opacity:0.7;
}

.sp2-entry-title{
  font-family:var(--font-fraunces),Georgia,serif; font-style:italic;
  font-weight:400; font-size:21px; line-height:1.25;
  margin:0 0 7px; letter-spacing:-0.01em; color:var(--ink);
  text-wrap:balance; transition:color .25s;
}
.sp2-entry:hover .sp2-entry-title,
.sp2-entry:focus-visible .sp2-entry-title{ color:var(--ac); }

.sp2-excerpt{
  font-family:var(--font-newsreader),Georgia,serif;
  font-size:14.5px; line-height:1.55; color:var(--muted);
  margin:0; text-wrap:pretty;
  display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;
  overflow:hidden;
}

/* Show more */
.sp2-more-wrap{ display:flex; justify-content:center; margin-top:44px; }
.sp2-more{
  display:inline-flex; align-items:baseline; gap:12px;
  font-family:var(--font-jetbrains),monospace;
  font-size:12px; letter-spacing:0.1em; text-transform:lowercase;
  color:var(--ink); background:var(--panel);
  border:1px solid var(--hair); border-radius:999px;
  padding:12px 26px; cursor:pointer;
  transition:border-color .25s,background .25s,transform .25s cubic-bezier(0.16,1,0.3,1);
}
.sp2-more:hover{
  border-color:rgba(var(--ac-rgb),0.5);
  background:rgba(var(--ac-rgb),0.08);
  transform:translateY(-2px);
}
.sp2-more-n{
  font-size:9px; letter-spacing:0.12em; color:var(--dim);
  font-variant-numeric:tabular-nums;
}

/* End */
.sp2-end{
  position:relative; display:flex; align-items:center; gap:12px;
  margin:48px 0 0 34px;
}
.sp2-end-node{
  position:absolute; left:-34px; top:50%; transform:translateY(-50%);
  width:9px; height:9px; border-radius:50%;
  background:rgba(var(--ac-rgb),0.6);
  box-shadow:0 0 0 3px var(--bg);
  margin-left:-0.5px;
}
.sp2-end-lbl{
  font-family:var(--font-jetbrains),monospace;
  font-size:10px; letter-spacing:0.2em; text-transform:uppercase;
  color:var(--dim);
}

/* Focus */
.sp2-chip:focus-visible,
.sp2-sub:focus-visible,
.sp2-sortbtn:focus-visible,
.sp2-more:focus-visible,
.sp2-entry:focus-visible{
  outline:2px solid var(--ac); outline-offset:3px; border-radius:8px;
}

@keyframes sp2In{
  to{ opacity:1; transform:translateX(0); }
}
@keyframes sp2Pulse{
  0%,100%{ box-shadow:0 0 0 3px var(--bg), 0 0 5px rgba(var(--ac-rgb),0.18); }
  50%{ box-shadow:0 0 0 3px var(--bg), 0 0 11px rgba(var(--ac-rgb),0.42); }
}

@media (prefers-reduced-motion:reduce){
  .sp2-entry{ opacity:1; transform:none; animation:none; }
  .sp2-node{ animation:none; }
  .sp2-entry:hover{ transform:none; }
  .sp2-chip:hover,.sp2-more:hover{ transform:none; }
}

@media (max-width:560px){
  .sp2-main{ padding:0 18px 120px; }
  .sp2-toolbar{ flex-direction:column; align-items:flex-start; }
}
`;
