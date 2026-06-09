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

// subtype → small glyph used in the card footer
const SUBTYPE_GLYPH: Record<string, string> = {
  resonance: "≈",
  "resonance-harvest": "≈",
  "essay-seed": "✎",
  "essay-seed-companion": "✎",
  question: "?",
  "methodological-question": "?",
  "hub-candidate": "◈",
  "pattern-candidate": "◈",
  speculative: "○",
  collision: "✦",
  contradiction: "⚔",
  synthesis: "⟁",
  insight: "✸",
  raw: "·",
  spark: "⚡",
};

const PREFIX_RE = /^(Essay Seed:|RESONANCE:|SPARK:)\s*/i;
function cleanTitle(t: string): string {
  let s = t;
  // strip repeatedly in case of stacked prefixes
  while (PREFIX_RE.test(s)) s = s.replace(PREFIX_RE, "");
  return s.trim();
}

const INITIAL_BATCH = 140;
const BATCH_STEP = 200;

export default function SparksSp1Page() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<string>("all");
  const [limit, setLimit] = useState(INITIAL_BATCH);

  useEffect(() => {
    let alive = true;
    fetch("/data/sparks.json")
      .then((r) => r.json())
      .then((d: Spark[]) => {
        if (!alive) return;
        setSparks(d.filter((s) => (s as any).type === "spark"));
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // counts per domain (full set, not filtered)
  const domainCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of sparks) m[s.domain] = (m[s.domain] || 0) + 1;
    return m;
  }, [sparks]);

  const domains = useMemo(
    () =>
      Object.keys(domainCounts).sort(
        (a, b) => domainCounts[b] - domainCounts[a]
      ),
    [domainCounts]
  );

  const filtered = useMemo(() => {
    if (active === "all") return sparks;
    return sparks.filter((s) => s.domain === active);
  }, [sparks, active]);

  const visible = filtered.slice(0, limit);
  const remaining = filtered.length - visible.length;

  // reset paging when filter changes
  useEffect(() => {
    setLimit(INITIAL_BATCH);
  }, [active]);

  return (
    <div className="sp1-root">
      <NavG
        active="Sparks"
        count={{
          value: sparks.length || "—",
          label: sparks.length ? "sparks" : "loading",
          color: "#5fc9a8",
        }}
      />

      <div className="sp1-atmos" aria-hidden />
      <div className="sp1-grain" aria-hidden />

      <main className="sp1-main">
        {/* ── Header ───────────────────────────────────────── */}
        <header className="sp1-header">
          <div className="sp1-eyebrow">⚡ sparks · the commonplace book</div>
          <h1 className="sp1-title">Sparks</h1>
          <p className="sp1-lede">
            A wall of fragments — observations, resonances, seeds caught mid-
            thought and pinned where they might still catch fire.
          </p>
        </header>

        {/* ── Filter chips ─────────────────────────────────── */}
        <nav className="sp1-chips" aria-label="Filter by domain">
          <button
            type="button"
            className={"sp1-chip" + (active === "all" ? " sp1-chip-on" : "")}
            onClick={() => setActive("all")}
            style={
              active === "all"
                ? ({ "--chip": "var(--ac)" } as React.CSSProperties)
                : undefined
            }
          >
            <span className="sp1-diamond" style={{ background: "var(--ac)" }} />
            <span className="sp1-chip-lbl">all</span>
            <span className="sp1-chip-n">{sparks.length || ""}</span>
          </button>

          {domains.map((d) => {
            const c = DOMAIN_COLOR[d] || "var(--ac)";
            const on = active === d;
            return (
              <button
                key={d}
                type="button"
                className={"sp1-chip" + (on ? " sp1-chip-on" : "")}
                onClick={() => setActive(d)}
                style={on ? ({ "--chip": c } as React.CSSProperties) : undefined}
              >
                <span className="sp1-diamond" style={{ background: c }} />
                <span className="sp1-chip-lbl">{DOMAIN_SHORT[d] || d}</span>
                <span className="sp1-chip-n">{domainCounts[d]}</span>
              </button>
            );
          })}
        </nav>

        {/* ── The Wall ─────────────────────────────────────── */}
        {!loaded ? (
          <div className="sp1-wall" aria-busy="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <div className="sp1-skel" key={i} style={{ height: 110 + ((i * 37) % 90) }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="sp1-empty">No sparks in this domain yet.</div>
        ) : (
          <>
            <div className="sp1-wall" key={active}>
              {visible.map((s, i) => {
                const c = DOMAIN_COLOR[s.domain] || "var(--ac)";
                const seed =
                  s.subtype === "essay-seed" ||
                  s.subtype === "essay-seed-companion";
                const glyph = SUBTYPE_GLYPH[s.subtype || "spark"] || "⚡";
                return (
                  <Link
                    key={s.id}
                    href={`/spark/${s.id}`}
                    className={"sp1-card" + (seed ? " sp1-card-seed" : "")}
                    style={
                      {
                        "--dc": c,
                        animationDelay: `${Math.min(i, 40) * 22}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <span className="sp1-bar" />
                    <h2 className="sp1-card-title">{cleanTitle(s.title)}</h2>
                    {s.excerpt ? (
                      <p className="sp1-card-ex">{s.excerpt}</p>
                    ) : null}
                    <div className="sp1-card-foot">
                      <span className="sp1-foot-domain">
                        {DOMAIN_SHORT[s.domain] || s.domain}
                      </span>
                      <span className="sp1-foot-glyph" title={s.subtype || "spark"}>
                        {glyph}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {remaining > 0 ? (
              <div className="sp1-more-row">
                <button
                  type="button"
                  className="sp1-more"
                  onClick={() => setLimit((l) => l + BATCH_STEP)}
                >
                  show more
                  <span className="sp1-more-n">{remaining} left</span>
                </button>
                <button
                  type="button"
                  className="sp1-more sp1-more-ghost"
                  onClick={() => setLimit(filtered.length)}
                >
                  show all
                </button>
              </div>
            ) : (
              <div className="sp1-end">— end of the wall · {filtered.length} fragments —</div>
            )}
          </>
        )}
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
:root {
  --bg:#0e0d14; --ink:#eae6f5; --muted:#8a849a; --dim:#5a546b;
  --hair:rgba(255,255,255,0.08); --panel:rgba(255,255,255,0.022);
  --ac:#5fc9a8; --ac-rgb:95,201,168;
}
html[data-theme="sepia"] {
  --bg:#f0ead8; --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a;
  --hair:rgba(44,31,14,0.13); --panel:rgba(44,31,14,0.03);
  --ac:#246a55; --ac-rgb:47,122,99;
}

.sp1-root {
  position:relative; min-height:100vh; width:100%;
  background:var(--bg); color:var(--ink);
  font-family:var(--font-newsreader), Georgia, serif;
  overflow-x:hidden;
}

/* atmosphere */
.sp1-atmos {
  position:fixed; inset:0; pointer-events:none; z-index:0;
  background:
    radial-gradient(1100px 620px at 78% -8%, rgba(var(--ac-rgb),0.10), transparent 60%),
    radial-gradient(820px 520px at 6% 18%, rgba(var(--ac-rgb),0.05), transparent 60%);
}
.sp1-grain {
  position:fixed; inset:0; pointer-events:none; z-index:1; opacity:0.04;
  mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.sp1-main {
  position:relative; z-index:2;
  max-width:1320px; margin:0 auto;
  padding:48px 32px 96px;
}

/* header */
.sp1-header { margin-bottom:40px; max-width:680px; }
.sp1-eyebrow {
  font-family:var(--font-jetbrains), monospace;
  font-size:11px; letter-spacing:0.14em; text-transform:lowercase;
  color:var(--ac); margin-bottom:16px;
}
.sp1-title {
  font-family:var(--font-fraunces), Georgia, serif;
  font-style:italic; font-weight:500;
  font-size:clamp(48px, 7vw, 88px); line-height:0.95;
  margin:0 0 16px; color:var(--ink);
  text-wrap:balance; letter-spacing:-0.01em;
}
.sp1-lede {
  font-size:18px; line-height:1.5; color:var(--muted);
  margin:0; text-wrap:pretty;
}

/* chips */
.sp1-chips {
  display:flex; flex-wrap:wrap; gap:8px;
  margin-bottom:40px;
  padding-bottom:24px; border-bottom:1px solid var(--hair);
}
.sp1-chip {
  display:inline-flex; align-items:center; gap:8px;
  padding:7px 13px 7px 11px;
  background:var(--panel); border:1px solid var(--hair); border-radius:999px;
  cursor:pointer; color:var(--muted);
  font-family:var(--font-jetbrains), monospace; font-size:11px;
  letter-spacing:0.02em; line-height:1;
  transition:border-color .22s cubic-bezier(0.16,1,0.3,1),
             background .22s, color .22s, transform .22s;
}
.sp1-chip:hover { color:var(--ink); border-color:rgba(var(--ac-rgb),0.4); transform:translateY(-1px); }
.sp1-chip:focus-visible { outline:2px solid var(--ac); outline-offset:2px; }
.sp1-chip-on {
  color:var(--ink);
  border-color:var(--chip);
  background:color-mix(in srgb, var(--chip) 14%, var(--panel));
  box-shadow:0 0 0 1px color-mix(in srgb, var(--chip) 40%, transparent) inset;
}
.sp1-diamond {
  width:7px; height:7px; transform:rotate(45deg); border-radius:1px;
  flex-shrink:0;
}
.sp1-chip-lbl { font-weight:500; }
.sp1-chip-n { color:var(--dim); font-size:10px; }
.sp1-chip-on .sp1-chip-n { color:var(--muted); }

/* the wall — masonry columns */
.sp1-wall {
  column-count:4; column-gap:18px;
}
@media (max-width:1180px){ .sp1-wall{ column-count:3; } }
@media (max-width:780px){ .sp1-wall{ column-count:2; column-gap:14px; } }
@media (max-width:520px){ .sp1-wall{ column-count:1; } }

/* card */
.sp1-card {
  position:relative; display:block;
  break-inside:avoid; -webkit-column-break-inside:avoid;
  margin:0 0 18px; padding:18px 18px 16px 22px;
  background:var(--panel);
  border:1px solid var(--hair); border-radius:10px;
  text-decoration:none; color:inherit;
  overflow:hidden;
  transition:transform .4s cubic-bezier(0.16,1,0.3,1),
             border-color .35s cubic-bezier(0.16,1,0.3,1),
             box-shadow .35s, background .35s;
  animation:sp1-rise .7s cubic-bezier(0.16,1,0.3,1) both;
}
.sp1-card-seed {
  background:linear-gradient(180deg, rgba(var(--ac-rgb),0.06), var(--panel) 70%);
}
.sp1-bar {
  position:absolute; left:0; top:0; bottom:0; width:3px;
  background:var(--dc); opacity:0.7;
  transition:opacity .35s, box-shadow .35s;
}
.sp1-card:hover {
  transform:translateY(-3px);
  border-color:var(--dc);
  background:color-mix(in srgb, var(--dc) 6%, var(--panel));
  box-shadow:0 14px 36px -18px rgba(0,0,0,0.55),
             0 0 0 1px color-mix(in srgb, var(--dc) 30%, transparent);
}
.sp1-card:focus-visible {
  outline:2px solid var(--ac); outline-offset:2px;
  border-color:var(--dc);
}
.sp1-card:hover .sp1-bar { opacity:1; box-shadow:0 0 12px var(--dc); }

.sp1-card-title {
  font-family:var(--font-fraunces), Georgia, serif;
  font-style:italic; font-weight:500;
  font-size:18px; line-height:1.18;
  margin:0 0 9px; color:var(--ink);
  text-wrap:balance; letter-spacing:-0.005em;
  transition:color .3s;
}
.sp1-card:hover .sp1-card-title { color:#fff; }
html[data-theme="sepia"] .sp1-card:hover .sp1-card-title { color:#000; }

.sp1-card-ex {
  font-size:14px; line-height:1.45; color:var(--muted);
  margin:0 0 12px; text-wrap:pretty;
  display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;
  overflow:hidden;
}
.sp1-card-foot {
  display:flex; align-items:center; justify-content:space-between;
  gap:8px; padding-top:8px; border-top:1px solid var(--hair);
}
.sp1-foot-domain {
  font-family:var(--font-jetbrains), monospace;
  font-size:10px; letter-spacing:0.06em; color:var(--dim);
}
.sp1-foot-glyph {
  font-size:13px; color:var(--dc); opacity:0.85; line-height:1;
}

/* skeleton + empty */
.sp1-skel {
  break-inside:avoid; margin:0 0 18px; border-radius:10px;
  background:linear-gradient(100deg, var(--panel), rgba(var(--ac-rgb),0.04), var(--panel));
  background-size:200% 100%;
  border:1px solid var(--hair);
  animation:sp1-shimmer 1.6s linear infinite;
}
.sp1-empty, .sp1-end {
  text-align:center; color:var(--muted);
  font-family:var(--font-jetbrains), monospace; font-size:12px;
  letter-spacing:0.05em; padding:48px 0;
}

/* show more */
.sp1-more-row {
  display:flex; justify-content:center; gap:12px; flex-wrap:wrap;
  margin-top:24px;
}
.sp1-more {
  display:inline-flex; align-items:center; gap:10px;
  padding:11px 22px; cursor:pointer;
  background:color-mix(in srgb, var(--ac) 12%, var(--panel));
  border:1px solid color-mix(in srgb, var(--ac) 45%, var(--hair));
  border-radius:999px; color:var(--ink);
  font-family:var(--font-jetbrains), monospace;
  font-size:12px; letter-spacing:0.06em;
  transition:transform .22s cubic-bezier(0.16,1,0.3,1), border-color .22s, background .22s;
}
.sp1-more:hover { transform:translateY(-2px); border-color:var(--ac); background:color-mix(in srgb, var(--ac) 20%, var(--panel)); }
.sp1-more:focus-visible { outline:2px solid var(--ac); outline-offset:2px; }
.sp1-more-ghost { background:transparent; border-color:var(--hair); color:var(--muted); }
.sp1-more-ghost:hover { color:var(--ink); border-color:var(--muted); background:var(--panel); }
.sp1-more-n { color:var(--ac); font-size:11px; }
.sp1-more-ghost .sp1-more-n { color:inherit; }

@keyframes sp1-rise {
  from { opacity:0; transform:translateY(18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes sp1-shimmer {
  from { background-position:200% 0; }
  to   { background-position:-200% 0; }
}

@media (prefers-reduced-motion:reduce) {
  .sp1-card { animation:none; transition:border-color .2s, background .2s; }
  .sp1-card:hover { transform:none; }
  .sp1-skel { animation:none; }
  .sp1-chip:hover, .sp1-more:hover { transform:none; }
}
`,
        }}
      />
    </div>
  );
}
