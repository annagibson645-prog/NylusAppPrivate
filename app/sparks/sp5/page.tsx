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

function domColor(s: Spark): string {
  return DOMAIN_COLOR[s.domain] || s.color || "#8a849a";
}

// Deterministic ambient dust positions — fixed array, SSR-safe (NO Math.random).
const AMBIENT = [
  { top: "12%", left: "8%", size: 3, delay: 0, dur: 9, op: 0.5 },
  { top: "26%", left: "82%", size: 2, delay: 1.2, dur: 11, op: 0.4 },
  { top: "48%", left: "16%", size: 4, delay: 2.4, dur: 13, op: 0.35 },
  { top: "64%", left: "72%", size: 2, delay: 0.6, dur: 10, op: 0.5 },
  { top: "78%", left: "34%", size: 3, delay: 3.1, dur: 12, op: 0.4 },
  { top: "34%", left: "48%", size: 2, delay: 1.8, dur: 14, op: 0.3 },
  { top: "88%", left: "60%", size: 3, delay: 2.0, dur: 9.5, op: 0.45 },
  { top: "18%", left: "62%", size: 2, delay: 0.9, dur: 12.5, op: 0.4 },
];

const INITIAL_BATCH = 100;
const STEP = 120;

export default function SparksSp5Page() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState<string>("all");
  const [shown, setShown] = useState(INITIAL_BATCH);

  useEffect(() => {
    let alive = true;
    fetch("/data/sparks.json")
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!alive) return;
        const cleaned: Spark[] = (Array.isArray(data) ? data : [])
          .filter((s) => s.type === "spark")
          .map((s) => ({
            id: s.id,
            title: cleanTitle(s.title || s.text || "Untitled"),
            domain: s.domain || "unknown",
            color: s.color,
            excerpt: (s.excerpt || "").trim(),
            subtype: s.subtype || s.status,
            created: s.created,
          }));
        setSparks(cleaned);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Domain counts for the filter chips.
  const domainCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sparks) m.set(s.domain, (m.get(s.domain) || 0) + 1);
    return DOMAIN_ORDER.filter((d) => m.has(d)).map((d) => ({
      key: d,
      count: m.get(d) || 0,
    }));
  }, [sparks]);

  const filtered = useMemo(() => {
    if (activeDomain === "all") return sparks;
    return sparks.filter((s) => s.domain === activeDomain);
  }, [sparks, activeDomain]);

  // Reset the reveal window when the filter changes.
  useEffect(() => {
    setShown(INITIAL_BATCH);
  }, [activeDomain]);

  const visible = filtered.slice(0, shown);
  const remaining = filtered.length - visible.length;

  return (
    <div className="sp5-root">
      <NavG
        active="Sparks"
        count={{
          value: sparks.length || "—",
          label: sparks.length ? "sparks" : "loading",
          color: "#5fc9a8",
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Ambient field — fixed behind everything */}
      <div className="sp5-ambient" aria-hidden="true">
        <div className="sp5-glow" />
        {AMBIENT.map((a, i) => (
          <span
            key={i}
            className="sp5-dust"
            style={{
              top: a.top,
              left: a.left,
              width: a.size,
              height: a.size,
              opacity: a.op,
              animationDelay: `${a.delay}s`,
              animationDuration: `${a.dur}s`,
            }}
          />
        ))}
      </div>

      <main className="sp5-main">
        <header className="sp5-header">
          <p className="sp5-eyebrow">⚡ a field of sparks</p>
          <h1 className="sp5-title">Sparks</h1>
          <p className="sp5-lede">
            Embers from the reading — fragments that flared, observations not yet
            cooled into concepts. Wander the field; each glowing card is a thought
            still catching.
          </p>
        </header>

        {/* Domain filter chips */}
        <div className="sp5-filters" role="group" aria-label="Filter sparks by domain">
          <button
            type="button"
            className={`sp5-chip${activeDomain === "all" ? " sp5-chip-on" : ""}`}
            onClick={() => setActiveDomain("all")}
            aria-pressed={activeDomain === "all"}
            style={{ ["--cc" as any]: "var(--ac)" }}
          >
            <span className="sp5-diamond" />
            <span className="sp5-chip-lbl">all</span>
            <span className="sp5-chip-n">{sparks.length || "—"}</span>
          </button>
          {domainCounts.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`sp5-chip${activeDomain === d.key ? " sp5-chip-on" : ""}`}
              onClick={() => setActiveDomain(d.key)}
              aria-pressed={activeDomain === d.key}
              style={{ ["--cc" as any]: DOMAIN_COLOR[d.key] }}
            >
              <span className="sp5-diamond" />
              <span className="sp5-chip-lbl">{DOMAIN_SHORT[d.key] || d.key}</span>
              <span className="sp5-chip-n">{d.count}</span>
            </button>
          ))}
        </div>

        {/* The field */}
        {loading ? (
          <p className="sp5-status">kindling the field…</p>
        ) : filtered.length === 0 ? (
          <p className="sp5-status">no embers in this domain yet.</p>
        ) : (
          <>
            <div className="sp5-field">
              {visible.map((s, i) => {
                const c = domColor(s);
                const delay = Math.min(i, 28) * 22;
                return (
                  <Link
                    key={s.id}
                    href={`/spark/${s.id}`}
                    className="sp5-card"
                    style={{
                      ["--cc" as any]: c,
                      animationDelay: `${delay}ms`,
                    }}
                  >
                    <span className="sp5-ember" aria-hidden="true" />
                    <h2 className="sp5-card-title">{s.title}</h2>
                    {s.excerpt && <p className="sp5-card-excerpt">{s.excerpt}</p>}
                    <div className="sp5-card-foot">
                      <span className="sp5-foot-dom">
                        {DOMAIN_SHORT[s.domain] || s.domain}
                      </span>
                      {s.subtype && (
                        <>
                          <span className="sp5-foot-dot">·</span>
                          <span className="sp5-foot-sub">{s.subtype}</span>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {remaining > 0 && (
              <div className="sp5-more-wrap">
                <button
                  type="button"
                  className="sp5-more"
                  onClick={() => setShown((n) => n + STEP)}
                >
                  reveal more
                  <span className="sp5-more-n">{remaining} dim</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const CSS = `
.sp5-root {
  --ac: #5fc9a8;
  --ac-rgb: 95,201,168;
  --bg: #0e0d14;
  --ink: #eae6f5;
  --muted: #8a849a;
  --dim: #5a546b;
  --hair: rgba(255,255,255,0.08);
  --panel: rgba(255,255,255,0.025);
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  position: relative;
}
html[data-theme="sepia"] .sp5-root {
  --ac: #246a55;
  --ac-rgb: 47,122,99;
  --bg: #f0ead8;
  --ink: #2c1f0e;
  --muted: #6f6048;
  --dim: #a8997a;
  --hair: rgba(44,31,14,0.13);
  --panel: rgba(44,31,14,0.035);
}

/* ── Ambient field ── */
.sp5-ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.sp5-glow {
  position: absolute;
  top: 8%;
  left: 50%;
  width: 70vw;
  max-width: 900px;
  height: 60vh;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center,
    rgba(var(--ac-rgb), 0.10),
    rgba(var(--ac-rgb), 0.03) 40%,
    transparent 70%);
  filter: blur(40px);
}
.sp5-dust {
  position: absolute;
  border-radius: 50%;
  background: rgba(var(--ac-rgb), 0.9);
  box-shadow: 0 0 6px 1px rgba(var(--ac-rgb), 0.6);
  animation-name: sp5-drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes sp5-drift {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.25; }
  50%      { transform: translateY(-26px) scale(1.5); opacity: 0.9; }
}

/* ── Layout ── */
.sp5-main {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 24px 120px;
}

/* ── Header ── */
.sp5-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 48px;
}
.sp5-eyebrow {
  font-family: var(--font-jetbrains), monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ac);
  margin: 0 0 16px;
}
.sp5-title {
  font-family: var(--font-fraunces), Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(48px, 8vw, 80px);
  line-height: 1;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
  color: var(--ink);
  text-wrap: balance;
}
.sp5-lede {
  font-family: var(--font-newsreader), Georgia, serif;
  font-size: 17px;
  line-height: 1.6;
  color: var(--muted);
  margin: 0;
  text-wrap: pretty;
}

/* ── Filter chips ── */
.sp5-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 0 auto 48px;
  max-width: 880px;
}
.sp5-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--panel);
  border: 1px solid var(--hair);
  border-radius: 999px;
  cursor: pointer;
  font-family: var(--font-jetbrains), monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
  transition: border-color .25s, color .25s, background .25s, transform .25s cubic-bezier(0.16,1,0.3,1);
}
.sp5-chip:hover {
  color: var(--ink);
  border-color: color-mix(in srgb, var(--cc) 55%, transparent);
  transform: translateY(-1px);
}
.sp5-chip:focus-visible {
  outline: 2px solid var(--cc);
  outline-offset: 2px;
}
.sp5-chip-on {
  color: var(--ink);
  border-color: var(--cc);
  background: color-mix(in srgb, var(--cc) 12%, var(--panel));
}
.sp5-diamond {
  width: 7px;
  height: 7px;
  background: var(--cc);
  transform: rotate(45deg);
  box-shadow: 0 0 6px 0 var(--cc);
  flex-shrink: 0;
}
.sp5-chip-lbl { text-transform: lowercase; }
.sp5-chip-n {
  color: var(--dim);
  font-size: 10px;
}
.sp5-chip-on .sp5-chip-n { color: var(--muted); }

/* ── Field ── */
.sp5-field {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}
.sp5-card {
  --cc: var(--ac);
  position: relative;
  flex: 1 1 240px;
  min-width: 220px;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 22px 18px;
  background: var(--panel);
  border: 1px solid var(--hair);
  border-radius: 14px;
  text-decoration: none;
  overflow: hidden;
  opacity: 0;
  animation: sp5-rise .7s cubic-bezier(0.16,1,0.3,1) both;
  transition:
    transform .4s cubic-bezier(0.16,1,0.3,1),
    border-color .4s ease,
    box-shadow .4s ease,
    background .4s ease;
}
@keyframes sp5-rise {
  from { opacity: 0; transform: translateY(14px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.sp5-card:hover,
.sp5-card:focus-visible {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--cc) 60%, transparent);
  background: color-mix(in srgb, var(--cc) 7%, var(--panel));
  box-shadow:
    0 12px 40px -12px color-mix(in srgb, var(--cc) 55%, transparent),
    0 0 0 1px color-mix(in srgb, var(--cc) 30%, transparent);
  outline: none;
}
.sp5-card:focus-visible {
  outline: 2px solid var(--cc);
  outline-offset: 3px;
}
/* the ember dot in the corner */
.sp5-ember {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cc);
  box-shadow: 0 0 8px 1px color-mix(in srgb, var(--cc) 70%, transparent);
  transition: box-shadow .4s ease, transform .4s ease;
}
.sp5-card:hover .sp5-ember,
.sp5-card:focus-visible .sp5-ember {
  transform: scale(1.25);
  box-shadow:
    0 0 14px 3px color-mix(in srgb, var(--cc) 85%, transparent),
    0 0 28px 8px color-mix(in srgb, var(--cc) 40%, transparent);
}
.sp5-card-title {
  font-family: var(--font-fraunces), Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: 19px;
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin: 0;
  padding-right: 14px;
  color: var(--ink);
  text-wrap: balance;
  transition: color .3s ease;
}
.sp5-card:hover .sp5-card-title,
.sp5-card:focus-visible .sp5-card-title {
  color: color-mix(in srgb, var(--cc) 30%, var(--ink));
}
.sp5-card-excerpt {
  font-family: var(--font-newsreader), Georgia, serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--muted);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-wrap: pretty;
}
.sp5-card-foot {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: auto;
  padding-top: 6px;
  font-family: var(--font-jetbrains), monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.sp5-foot-dom { color: var(--cc); }
.sp5-foot-dot { color: var(--dim); }
.sp5-foot-sub { color: var(--dim); }

/* ── Status + reveal ── */
.sp5-status {
  text-align: center;
  font-family: var(--font-jetbrains), monospace;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--dim);
  padding: 60px 0;
}
.sp5-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}
.sp5-more {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: var(--panel);
  border: 1px solid var(--hair);
  border-radius: 999px;
  cursor: pointer;
  font-family: var(--font-jetbrains), monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink);
  transition: border-color .25s, background .25s, transform .25s cubic-bezier(0.16,1,0.3,1);
}
.sp5-more:hover {
  border-color: var(--ac);
  background: color-mix(in srgb, var(--ac) 10%, var(--panel));
  transform: translateY(-2px);
}
.sp5-more:focus-visible {
  outline: 2px solid var(--ac);
  outline-offset: 3px;
}
.sp5-more-n {
  color: var(--dim);
  font-size: 10px;
  letter-spacing: 0.08em;
}

/* ── Responsive ── */
@media (max-width: 560px) {
  .sp5-main { padding: 40px 16px 80px; }
  .sp5-card {
    flex: 1 1 100%;
    max-width: none;
    min-width: 0;
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .sp5-dust { animation: none; }
  .sp5-card {
    opacity: 1;
    animation: none;
  }
  .sp5-card:hover,
  .sp5-card:focus-visible { transform: none; }
  .sp5-chip:hover,
  .sp5-more:hover { transform: none; }
}
`;
