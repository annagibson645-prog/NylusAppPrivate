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

// ─── Domain → decorative color + short mono label ────────────────────────────
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

// ─── Subtype taxonomy — the lens this prototype is organized by ──────────────
type SubtypeKey =
  | "resonance"
  | "essay-seed"
  | "question"
  | "speculative"
  | "contradiction"
  | "synthesis"
  | "insight"
  | "other";

const SUBTYPES: Record<
  SubtypeKey,
  { color: string; glyph: string; label: string }
> = {
  resonance: { color: "#e8b86a", glyph: "◈", label: "Resonance" },
  "essay-seed": { color: "#5fc9a8", glyph: "✦", label: "Essay Seed" },
  question: { color: "#f06292", glyph: "?", label: "Question" },
  speculative: { color: "#b794f4", glyph: "◌", label: "Speculative" },
  contradiction: { color: "#f97316", glyph: "⊗", label: "Contradiction" },
  synthesis: { color: "#60a5fa", glyph: "⊹", label: "Synthesis" },
  insight: { color: "#34d399", glyph: "✷", label: "Insight" },
  other: { color: "#8a849a", glyph: "·", label: "Other" },
};

// Display order of the lens sections.
const SECTION_ORDER: SubtypeKey[] = [
  "resonance",
  "essay-seed",
  "question",
  "speculative",
  "contradiction",
  "synthesis",
  "insight",
  "other",
];

const SECTION_CAP = 40;

function cleanTitle(t: string): string {
  return (t || "")
    .replace(/^(Essay Seed:?\s*—?\s*|RESONANCE:\s*|SPARK:\s*)/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Map a raw subtype string (incl. variants like "resonance-harvest",
// "essay-seed-companion", "methodological-question") onto a canonical bucket.
function bucketOf(raw?: string): SubtypeKey {
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

export default function SparksSubtypeLensPage() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    fetch("/data/sparks.json")
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (!alive) return;
        const out: Spark[] = (Array.isArray(rows) ? rows : [])
          .filter((r) => r && r.type === "spark")
          .map((r) => ({
            id: String(r.id),
            title: cleanTitle(r.title || r.text || "Untitled"),
            domain: String(r.domain || "unknown"),
            color: r.color,
            excerpt: (r.excerpt || "").replace(/\s+/g, " ").trim(),
            subtype: r.subtype,
            created: r.created,
          }));
        setSparks(out);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Group the sparks by canonical subtype bucket, preserving section order.
  const sections = useMemo(() => {
    const map: Record<SubtypeKey, Spark[]> = {
      resonance: [],
      "essay-seed": [],
      question: [],
      speculative: [],
      contradiction: [],
      synthesis: [],
      insight: [],
      other: [],
    };
    for (const s of sparks) map[bucketOf(s.subtype)].push(s);
    return SECTION_ORDER.map((key) => ({
      key,
      ...SUBTYPES[key],
      items: map[key],
    })).filter((sec) => sec.items.length > 0);
  }, [sparks]);

  return (
    <>
      <NavG
        active="Sparks"
        count={{
          value: sparks.length || "—",
          label: sparks.length ? "sparks" : "loading",
          color: "#5fc9a8",
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <main className="sp4-root">
        <div className="sp4-grain" aria-hidden="true" />
        <div className="sp4-glow" aria-hidden="true" />

        <div className="sp4-wrap">
          {/* ── Header ─────────────────────────────────────────── */}
          <header className="sp4-header">
            <div className="sp4-eyebrow">⚡ by kind</div>
            <h1 className="sp4-title">Sparks</h1>
            <p className="sp4-lede">
              The same field notes, re-sorted by what <em>kind</em> of spark
              they are — resonances, essay seeds, open questions, contradictions.
              A taxonomy by texture, not by domain. Each kind keeps its own color
              and mark.
            </p>
          </header>

          {/* ── Pill nav (anchor jumps) ────────────────────────── */}
          <nav className="sp4-pills" aria-label="Jump to a kind of spark">
            {sections.map((sec) => (
              <a
                key={sec.key}
                href={`#kind-${sec.key}`}
                className="sp4-pill"
                style={
                  {
                    "--c": sec.color,
                    "--c-rgb": hexToRgb(sec.color),
                  } as React.CSSProperties
                }
              >
                <span className="sp4-pill-glyph" aria-hidden="true">
                  {sec.glyph}
                </span>
                <span className="sp4-pill-label">{sec.label}</span>
                <span className="sp4-pill-count">{sec.items.length}</span>
              </a>
            ))}
          </nav>

          {/* ── Sections ───────────────────────────────────────── */}
          {!loaded && <div className="sp4-loading">loading sparks…</div>}

          {sections.map((sec, si) => {
            const isOpen = !!expanded[sec.key];
            const shown =
              isOpen || sec.items.length <= SECTION_CAP
                ? sec.items
                : sec.items.slice(0, SECTION_CAP);
            const hidden = sec.items.length - shown.length;

            return (
              <section
                key={sec.key}
                id={`kind-${sec.key}`}
                className="sp4-section"
                style={
                  {
                    "--c": sec.color,
                    "--c-rgb": hexToRgb(sec.color),
                    "--delay": `${si * 0.06}s`,
                  } as React.CSSProperties
                }
              >
                <div className="sp4-sec-head">
                  <span className="sp4-sec-glyph" aria-hidden="true">
                    {sec.glyph}
                  </span>
                  <h2 className="sp4-sec-label">{sec.label}</h2>
                  <span className="sp4-sec-count">
                    {String(sec.items.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="sp4-hairline" />

                <ul className="sp4-list">
                  {shown.map((s, i) => (
                    <li
                      className="sp4-row-wrap"
                      key={s.id}
                      style={
                        {
                          "--rd": `${Math.min(i, 8) * 0.03}s`,
                        } as React.CSSProperties
                      }
                    >
                      <Link href={`/spark/${s.id}`} className="sp4-row">
                        <span
                          className="sp4-row-dom"
                          style={
                            {
                              "--dc":
                                DOMAIN_COLOR[s.domain] || "#8a849a",
                            } as React.CSSProperties
                          }
                        >
                          {DOMAIN_SHORT[s.domain] || "—"}
                        </span>
                        <span className="sp4-row-body">
                          <span className="sp4-row-title">{s.title}</span>
                          {s.excerpt && (
                            <span className="sp4-row-excerpt">
                              {s.excerpt}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {hidden > 0 && (
                  <button
                    type="button"
                    className="sp4-more"
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [sec.key]: true }))
                    }
                  >
                    show all {sec.items.length} →
                  </button>
                )}
                {isOpen && sec.items.length > SECTION_CAP && (
                  <button
                    type="button"
                    className="sp4-more sp4-more-less"
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [sec.key]: false }))
                    }
                  >
                    collapse ↑
                  </button>
                )}
              </section>
            );
          })}

          <footer className="sp4-foot">
            <span className="sp4-foot-mark">⚡</span>
            <span>
              {sparks.length || "—"} sparks · sorted by kind, not by domain
            </span>
          </footer>
        </div>
      </main>
    </>
  );
}

// hex (#rrggbb) → "r,g,b"
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const int = parseInt(n, 16);
  return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`;
}

const CSS = `
.sp4-root{
  --bg:#0e0d14; --ink:#eae6f5; --muted:#8a849a; --dim:#5a546b;
  --hair:rgba(255,255,255,0.08); --panel:rgba(255,255,255,0.022);
  --ac:#5fc9a8; --ac-rgb:95,201,168;
  position:relative; min-height:100vh; width:100%;
  background:var(--bg); color:var(--ink);
  font-family:var(--font-newsreader),Georgia,serif;
  overflow-x:hidden;
}
html[data-theme="sepia"] .sp4-root{
  --bg:#f0ead8; --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a;
  --hair:rgba(44,31,14,0.13); --panel:rgba(44,31,14,0.03);
  --ac:#246a55;
}

/* ── Atmosphere ── */
.sp4-glow{
  position:fixed; inset:0; pointer-events:none; z-index:0;
  background:
    radial-gradient(620px 380px at 18% -4%, rgba(var(--ac-rgb),0.10), transparent 70%),
    radial-gradient(520px 420px at 100% 8%, rgba(var(--ac-rgb),0.05), transparent 72%);
}
html[data-theme="sepia"] .sp4-glow{ opacity:0.5; }
.sp4-grain{
  position:fixed; inset:0; pointer-events:none; z-index:0; opacity:0.04;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode:overlay;
}

.sp4-wrap{
  position:relative; z-index:1;
  max-width:1080px; margin:0 auto;
  padding:64px 32px 120px;
}

/* ── Header ── */
.sp4-header{ margin-bottom:40px; max-width:780px; }
.sp4-eyebrow{
  font-family:var(--font-jetbrains),ui-monospace,monospace;
  font-size:11px; letter-spacing:0.34em; text-transform:uppercase;
  color:var(--ac); margin-bottom:24px;
}
.sp4-title{
  font-family:var(--font-fraunces),Georgia,serif;
  font-style:italic; font-weight:400;
  font-size:clamp(56px,9vw,108px); line-height:0.92;
  letter-spacing:-0.03em; margin:0 0 22px;
  color:var(--ink); text-wrap:balance;
}
.sp4-lede{
  font-family:var(--font-newsreader),Georgia,serif;
  font-size:clamp(17px,1.9vw,21px); line-height:1.6;
  color:var(--muted); margin:0; max-width:62ch; text-wrap:pretty;
}
.sp4-lede em{ color:var(--ink); font-style:italic; }

/* ── Pills ── */
.sp4-pills{
  position:sticky; top:80px; z-index:20;
  display:flex; flex-wrap:wrap; gap:8px;
  padding:16px 0; margin:0 0 8px;
  background:linear-gradient(var(--bg) 62%, rgba(0,0,0,0));
  backdrop-filter:blur(2px);
}
.sp4-pill{
  display:inline-flex; align-items:center; gap:8px;
  padding:7px 13px 7px 11px; border-radius:999px;
  text-decoration:none;
  background:rgba(var(--c-rgb),0.07);
  border:1px solid rgba(var(--c-rgb),0.26);
  color:var(--ink);
  transition:background .18s ease, transform .18s ease, border-color .18s ease;
}
.sp4-pill:hover{
  background:rgba(var(--c-rgb),0.15);
  border-color:rgba(var(--c-rgb),0.5);
  transform:translateY(-1px);
}
.sp4-pill:focus-visible{
  outline:2px solid var(--c); outline-offset:2px;
}
.sp4-pill-glyph{
  font-size:14px; line-height:1; color:var(--c);
  font-family:var(--font-fraunces),Georgia,serif;
}
.sp4-pill-label{
  font-family:var(--font-newsreader),Georgia,serif;
  font-size:14px; font-style:italic; color:var(--ink);
}
.sp4-pill-count{
  font-family:var(--font-jetbrains),ui-monospace,monospace;
  font-size:10px; font-variant-numeric:tabular-nums;
  letter-spacing:0.06em; color:var(--muted);
  padding-left:4px; border-left:1px solid rgba(var(--c-rgb),0.3);
}

.sp4-loading{
  font-family:var(--font-jetbrains),ui-monospace,monospace;
  font-size:12px; letter-spacing:0.2em; color:var(--dim);
  padding:48px 0;
}

/* ── Section ── */
.sp4-section{
  margin-top:64px; scroll-margin-top:168px;
  opacity:0; transform:translateY(16px);
  animation:sp4Rise .6s cubic-bezier(.2,.7,.2,1) forwards;
  animation-delay:var(--delay,0s);
}
.sp4-sec-head{
  display:flex; align-items:baseline; gap:18px;
}
.sp4-sec-glyph{
  font-family:var(--font-fraunces),Georgia,serif;
  font-size:clamp(40px,6vw,68px); line-height:1;
  color:var(--c);
  text-shadow:0 0 26px rgba(var(--c-rgb),0.35);
  animation:sp4Pulse 3.4s ease-in-out infinite;
  align-self:center;
}
.sp4-sec-label{
  font-family:var(--font-fraunces),Georgia,serif;
  font-style:italic; font-weight:400;
  font-size:clamp(30px,4.4vw,50px); line-height:1;
  letter-spacing:-0.02em; margin:0; color:var(--ink);
  text-wrap:balance;
}
.sp4-sec-count{
  margin-left:auto;
  font-family:var(--font-jetbrains),ui-monospace,monospace;
  font-size:13px; font-variant-numeric:tabular-nums;
  letter-spacing:0.14em; color:var(--muted);
}
.sp4-hairline{
  height:1px; margin:16px 0 4px;
  background:linear-gradient(90deg,
    rgba(var(--c-rgb),0.55), rgba(var(--c-rgb),0.12) 45%, var(--hair) 100%);
}

/* ── Rows ── */
.sp4-list{
  list-style:none; margin:0; padding:0;
  display:grid; grid-template-columns:1fr 1fr; gap:0 40px;
}
.sp4-row-wrap{
  opacity:0; transform:translateY(10px);
  animation:sp4Rise .5s ease forwards;
  animation-delay:calc(var(--delay,0s) + .18s + var(--rd,0s));
  border-bottom:1px solid var(--hair);
}
.sp4-row{
  display:flex; gap:16px; align-items:flex-start;
  padding:16px 14px 16px 0;
  text-decoration:none; color:inherit;
  position:relative;
  border-left:2px solid transparent;
  padding-left:14px; margin-left:-14px;
  transition:background .16s ease, border-color .16s ease;
}
.sp4-row:hover{
  background:rgba(var(--c-rgb),0.05);
  border-left-color:var(--c);
}
.sp4-row:focus-visible{
  outline:none;
  background:rgba(var(--c-rgb),0.07);
  border-left-color:var(--c);
}
.sp4-row-dom{
  flex-shrink:0; width:74px; padding-top:4px;
  font-family:var(--font-jetbrains),ui-monospace,monospace;
  font-size:9.5px; letter-spacing:0.12em; text-transform:uppercase;
  color:var(--muted);
}
.sp4-row-dom::before{
  content:""; display:inline-block;
  width:6px; height:6px; border-radius:50%;
  background:var(--dc,#8a849a); margin-right:7px;
  vertical-align:middle;
}
.sp4-row-body{ display:flex; flex-direction:column; gap:5px; min-width:0; }
.sp4-row-title{
  font-family:var(--font-fraunces),Georgia,serif;
  font-style:italic; font-weight:400;
  font-size:17px; line-height:1.25; letter-spacing:-0.01em;
  color:var(--ink); text-wrap:pretty;
  transition:color .16s ease;
}
.sp4-row:hover .sp4-row-title{ color:var(--c); }
.sp4-row-excerpt{
  font-family:var(--font-newsreader),Georgia,serif;
  font-size:13.5px; line-height:1.45; color:var(--muted);
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
  overflow:hidden; text-wrap:pretty;
}

/* ── More / footer ── */
.sp4-more{
  margin-top:22px;
  background:rgba(var(--c-rgb),0.08);
  border:1px solid rgba(var(--c-rgb),0.28);
  color:var(--ink); cursor:pointer;
  font-family:var(--font-jetbrains),ui-monospace,monospace;
  font-size:11px; letter-spacing:0.12em;
  padding:9px 16px; border-radius:6px;
  transition:background .16s ease, border-color .16s ease;
}
.sp4-more:hover{ background:rgba(var(--c-rgb),0.16); border-color:rgba(var(--c-rgb),0.5); }
.sp4-more:focus-visible{ outline:2px solid var(--c); outline-offset:2px; }
.sp4-more-less{ margin-left:10px; }

.sp4-foot{
  margin-top:88px; padding-top:24px;
  border-top:1px solid var(--hair);
  display:flex; align-items:center; gap:12px;
  font-family:var(--font-jetbrains),ui-monospace,monospace;
  font-size:11px; letter-spacing:0.12em; color:var(--dim);
  font-variant-numeric:tabular-nums;
}
.sp4-foot-mark{ color:var(--ac); font-size:14px; }

/* ── Motion ── */
@keyframes sp4Rise{ to{ opacity:1; transform:none; } }
@keyframes sp4Pulse{
  0%,100%{ opacity:0.82; transform:scale(1); }
  50%{ opacity:1; transform:scale(1.06); }
}

@media (max-width:760px){
  .sp4-wrap{ padding:44px 20px 96px; }
  .sp4-list{ grid-template-columns:1fr; gap:0; }
  .sp4-pills{ top:80px; }
  .sp4-sec-count{ display:none; }
}

@media (prefers-reduced-motion:reduce){
  .sp4-section,.sp4-row-wrap{ animation:none !important; opacity:1 !important; transform:none !important; }
  .sp4-sec-glyph{ animation:none !important; }
  .sp4-pill:hover,.sp4-row:hover{ transform:none; }
}
`;
