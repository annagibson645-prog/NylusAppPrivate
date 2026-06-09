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

// ─── Domain colors + labels ──────────────────────────────────────────────
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

function cleanTitle(t: string): string {
  return (t || "")
    .replace(/^(Essay Seed:?\s*—?\s*|RESONANCE:\s*|SPARK:\s*)/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// crude excerpt extraction from a raw markdown "content" blob if present
function deriveExcerpt(raw: any): string {
  const src =
    raw.excerpt ||
    raw.text ||
    raw.content ||
    "";
  if (!src) return "";
  // strip frontmatter / markdown noise, grab first real prose sentence-ish
  const cleaned = String(src)
    .replace(/^---[\s\S]*?---/, "")
    .replace(/^#.*$/gm, "")
    .replace(/\[[A-Z][^\]]*\]/g, "")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 240);
}

function subtypeGlyph(s?: string, title?: string): string {
  const t = (s || title || "").toLowerCase();
  if (t.includes("essay")) return "✶";
  if (t.includes("resonance")) return "≈";
  return "⚡";
}

function shortDate(d?: string): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function SparksSp6Page() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/data/sparks.json")
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (!alive) return;
        const out: Spark[] = (rows || [])
          .filter((s) => s.type === "spark")
          .map((s) => ({
            id: s.id,
            title: cleanTitle(s.title || s.text || "Untitled"),
            domain: s.domain,
            color: DOMAIN_COLOR[s.domain],
            excerpt: deriveExcerpt(s),
            subtype: s.subtype,
            created: s.created,
          }));
        setSparks(out);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  // hero = first essay-seed-ish, else most recent
  const hero = useMemo<Spark | null>(() => {
    if (!sparks.length) return null;
    const sorted = [...sparks].sort((a, b) =>
      (b.created || "").localeCompare(a.created || "")
    );
    const essay = sorted.find(
      (s) => subtypeGlyph(s.subtype, s.title) === "✶" && s.excerpt
    );
    return essay || sorted.find((s) => s.excerpt) || sorted[0];
  }, [sparks]);

  // domain rows ordered by spark count desc
  const rows = useMemo(() => {
    const byDomain: Record<string, Spark[]> = {};
    for (const s of sparks) {
      if (!DOMAIN_LABEL[s.domain]) continue;
      (byDomain[s.domain] ||= []).push(s);
    }
    return Object.entries(byDomain)
      .map(([domain, list]) => ({
        domain,
        label: DOMAIN_LABEL[domain],
        color: DOMAIN_COLOR[domain],
        count: list.length,
        cards: list
          .sort((a, b) => (b.created || "").localeCompare(a.created || ""))
          .slice(0, 20),
      }))
      .sort((a, b) => b.count - a.count);
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

      <div className="sp6-root">
        <div className="sp6-grain" aria-hidden />
        <div className="sp6-glow" aria-hidden />

        <main className="sp6-main">
          {/* ─── HERO ─────────────────────────────────────────── */}
          <header className={`sp6-hero ${loaded ? "sp6-in" : ""}`}>
            <div className="sp6-hero-eyebrow">
              <span className="sp6-pagetitle">Sparks</span>
              <span className="sp6-eyebrow-sep">·</span>
              <span className="sp6-spark-of">⚡ spark of the moment</span>
            </div>

            {hero ? (
              <Link href={`/spark/${hero.id}`} className="sp6-hero-card">
                <h1 className="sp6-hero-title">{hero.title}</h1>
                {hero.excerpt ? (
                  <p className="sp6-hero-excerpt">{hero.excerpt}</p>
                ) : null}
                <div className="sp6-hero-meta">
                  <span
                    className="sp6-chip"
                    style={{
                      // @ts-expect-error css var
                      "--c": hero.color || "#5fc9a8",
                    }}
                  >
                    <span className="sp6-diamond" />
                    {DOMAIN_LABEL[hero.domain] || hero.domain}
                  </span>
                  <span className="sp6-hero-date">
                    {shortDate(hero.created)}
                  </span>
                  <span className="sp6-hero-go">read the spark →</span>
                </div>
              </Link>
            ) : (
              <div className="sp6-hero-card sp6-hero-empty">
                <h1 className="sp6-hero-title">Sparks</h1>
                <p className="sp6-hero-excerpt">
                  {loaded
                    ? "No sparks found."
                    : "Gathering the currents…"}
                </p>
              </div>
            )}

            <p className="sp6-hero-sub">
              Eight currents of half-formed thought — swipe each river sideways.
            </p>
          </header>

          {/* ─── DOMAIN ROWS ──────────────────────────────────── */}
          <div className="sp6-rivers">
            {rows.map((row, i) => (
              <section
                key={row.domain}
                className={`sp6-river ${loaded ? "sp6-in" : ""}`}
                style={{
                  // @ts-expect-error css var
                  "--c": row.color,
                  "--d": `${0.12 + i * 0.07}s`,
                }}
              >
                <div className="sp6-river-head">
                  <span className="sp6-rh-diamond" />
                  <h2 className="sp6-rh-label">{row.label}</h2>
                  <span className="sp6-rh-count">
                    {String(row.count).padStart(2, "0")}{" "}
                    {row.count === 1 ? "spark" : "sparks"}
                  </span>
                  <Link
                    href={`/sparks?domain=${row.domain}`}
                    className="sp6-rh-viewall"
                  >
                    view all →
                  </Link>
                </div>

                <div className="sp6-track-wrap">
                  <div className="sp6-track" role="list">
                    {row.cards.map((c) => (
                      <Link
                        key={c.id}
                        href={`/spark/${c.id}`}
                        className="sp6-card"
                        role="listitem"
                      >
                        <span className="sp6-card-bar" aria-hidden />
                        <h3 className="sp6-card-title">{c.title}</h3>
                        {c.excerpt ? (
                          <p className="sp6-card-excerpt">{c.excerpt}</p>
                        ) : (
                          <p className="sp6-card-excerpt sp6-card-noex">
                            — a spark, unwritten —
                          </p>
                        )}
                        <div className="sp6-card-foot">
                          <span className="sp6-card-glyph">
                            {subtypeGlyph(c.subtype, c.title)}
                          </span>
                          <span className="sp6-card-date">
                            {shortDate(c.created)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            ))}

            {loaded && !rows.length ? (
              <p className="sp6-empty">No sparks to flow yet.</p>
            ) : null}
          </div>
        </main>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
:root { }
.sp6-root {
  --ac: #5fc9a8;
  --ac-rgb: 95,201,168;
  --bg: #0e0d14;
  --ink: #eae6f5;
  --muted: #8a849a;
  --dim: #5a546b;
  --hair: rgba(255,255,255,0.08);
  --panel: rgba(255,255,255,0.025);
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  overflow-x: hidden;
}
html[data-theme="sepia"] .sp6-root {
  --ac: #246a55;
  --ac-rgb: 47,122,99;
  --bg: #f0ead8;
  --ink: #2c1f0e;
  --muted: #6f6048;
  --dim: #a8997a;
  --hair: rgba(44,31,14,0.13);
  --panel: rgba(44,31,14,0.035);
}

.sp6-grain {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  opacity: 0.4; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
}
.sp6-glow {
  position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
  width: 80vw; height: 60vh; pointer-events: none; z-index: 0;
  background: radial-gradient(ellipse at center, rgba(var(--ac-rgb),0.10), transparent 70%);
  filter: blur(40px);
}

.sp6-main {
  position: relative; z-index: 1;
  max-width: 1320px; margin: 0 auto;
  padding: 48px 0 96px;
}

/* ─── HERO ─── */
.sp6-hero {
  padding: 0 40px 56px;
  opacity: 0; transform: translateY(16px);
}
.sp6-hero.sp6-in {
  animation: sp6Rise 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
}
.sp6-hero-eyebrow {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  margin-bottom: 24px;
}
.sp6-pagetitle {
  font-family: var(--font-fraunces), Georgia, serif;
  font-style: italic; font-weight: 500;
  font-size: 22px; color: var(--ink); letter-spacing: -0.01em;
}
.sp6-eyebrow-sep { color: var(--dim); }
.sp6-spark-of {
  font-family: var(--font-jetbrains), monospace;
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ac);
}

.sp6-hero-card {
  display: block; text-decoration: none; color: inherit;
  border-radius: 4px;
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
  max-width: 920px;
}
.sp6-hero-card:hover { transform: translateY(-2px); }
.sp6-hero-card:focus-visible {
  outline: 2px solid var(--ac); outline-offset: 8px;
}
.sp6-hero-title {
  font-family: var(--font-fraunces), Georgia, serif;
  font-style: italic; font-weight: 500;
  font-size: clamp(38px, 6.5vw, 76px);
  line-height: 1.02; letter-spacing: -0.025em;
  color: var(--ink); margin: 0 0 22px;
  text-wrap: balance;
}
.sp6-hero-card:hover .sp6-hero-title { color: var(--ac); }
.sp6-hero-excerpt {
  font-family: var(--font-newsreader), Georgia, serif;
  font-size: clamp(17px, 1.9vw, 22px); line-height: 1.55;
  color: var(--muted); margin: 0 0 26px; max-width: 720px;
  text-wrap: pretty;
}
.sp6-hero-meta {
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
}
.sp6-chip {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-jetbrains), monospace;
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--c, var(--ac));
  border: 1px solid color-mix(in srgb, var(--c, var(--ac)) 35%, transparent);
  background: color-mix(in srgb, var(--c, var(--ac)) 8%, transparent);
  padding: 6px 12px; border-radius: 999px;
}
.sp6-diamond {
  width: 7px; height: 7px; transform: rotate(45deg);
  background: var(--c, var(--ac)); display: inline-block;
  box-shadow: 0 0 7px var(--c, var(--ac));
}
.sp6-hero-date {
  font-family: var(--font-jetbrains), monospace;
  font-size: 11px; letter-spacing: 0.08em; color: var(--dim);
}
.sp6-hero-go {
  font-family: var(--font-jetbrains), monospace;
  font-size: 11px; letter-spacing: 0.12em; color: var(--ac);
  opacity: 0; transform: translateX(-6px);
  transition: opacity 0.3s, transform 0.3s;
}
.sp6-hero-card:hover .sp6-hero-go,
.sp6-hero-card:focus-visible .sp6-hero-go {
  opacity: 1; transform: translateX(0);
}
.sp6-hero-empty { cursor: default; }
.sp6-hero-sub {
  font-family: var(--font-newsreader), Georgia, serif;
  font-style: italic;
  font-size: 15px; color: var(--dim); margin: 38px 0 0;
}

/* ─── RIVERS ─── */
.sp6-rivers { display: flex; flex-direction: column; gap: 52px; }
.sp6-river {
  opacity: 0; transform: translateY(20px);
}
.sp6-river.sp6-in {
  animation: sp6Rise 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
  animation-delay: var(--d, 0s);
}

.sp6-river-head {
  display: flex; align-items: baseline; gap: 14px;
  padding: 0 40px; margin-bottom: 20px;
}
.sp6-rh-diamond {
  width: 9px; height: 9px; transform: rotate(45deg) translateY(-1px);
  background: var(--c); display: inline-block; flex-shrink: 0;
  box-shadow: 0 0 9px var(--c);
}
.sp6-rh-label {
  font-family: var(--font-fraunces), Georgia, serif;
  font-style: italic; font-weight: 500;
  font-size: clamp(22px, 3vw, 30px); letter-spacing: -0.015em;
  color: var(--ink); margin: 0;
}
.sp6-rh-count {
  font-family: var(--font-jetbrains), monospace;
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--dim);
}
.sp6-rh-viewall {
  margin-left: auto;
  font-family: var(--font-jetbrains), monospace;
  font-size: 11px; letter-spacing: 0.1em; color: var(--muted);
  text-decoration: none; transition: color 0.2s;
  align-self: center; white-space: nowrap;
}
.sp6-rh-viewall:hover,
.sp6-rh-viewall:focus-visible { color: var(--c); }
.sp6-rh-viewall:focus-visible { outline: 2px solid var(--c); outline-offset: 3px; border-radius: 2px; }

/* edge fades on the track */
.sp6-track-wrap {
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 40px, #000 calc(100% - 64px), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, #000 40px, #000 calc(100% - 64px), transparent 100%);
}
.sp6-track {
  display: flex; gap: 18px;
  overflow-x: auto; overflow-y: hidden;
  scroll-snap-type: x proximity;
  padding: 6px 40px 14px;
  scrollbar-width: none;
}
.sp6-track::-webkit-scrollbar { display: none; }

.sp6-card {
  position: relative;
  flex: 0 0 300px; width: 300px;
  scroll-snap-align: start;
  display: flex; flex-direction: column;
  text-decoration: none; color: inherit;
  background: var(--panel);
  border: 1px solid var(--hair);
  border-radius: 4px;
  padding: 22px 20px 16px;
  min-height: 210px;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1),
              border-color 0.3s, box-shadow 0.4s, background 0.3s;
}
.sp6-card-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--c);
  opacity: 0.65; transition: opacity 0.3s, height 0.3s;
}
.sp6-card:hover,
.sp6-card:focus-visible {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--c) 55%, transparent);
  box-shadow: 0 14px 38px rgba(0,0,0,0.28),
              0 0 0 1px color-mix(in srgb, var(--c) 30%, transparent);
  background: color-mix(in srgb, var(--c) 5%, var(--panel));
}
.sp6-card:focus-visible { outline: none; }
.sp6-card:hover .sp6-card-bar,
.sp6-card:focus-visible .sp6-card-bar { opacity: 1; height: 4px; }

.sp6-card-title {
  font-family: var(--font-fraunces), Georgia, serif;
  font-style: italic; font-weight: 500;
  font-size: 21px; line-height: 1.18; letter-spacing: -0.015em;
  color: var(--ink); margin: 0 0 12px;
  text-wrap: balance;
  transition: color 0.3s;
}
.sp6-card:hover .sp6-card-title,
.sp6-card:focus-visible .sp6-card-title { color: var(--c); }
.sp6-card-excerpt {
  font-family: var(--font-newsreader), Georgia, serif;
  font-size: 14px; line-height: 1.5; color: var(--muted);
  margin: 0; text-wrap: pretty;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden;
}
.sp6-card-noex { font-style: italic; color: var(--dim); }
.sp6-card-foot {
  display: flex; align-items: center; gap: 9px;
  margin-top: auto; padding-top: 16px;
}
.sp6-card-glyph {
  font-family: var(--font-jetbrains), monospace;
  font-size: 13px; color: var(--c);
}
.sp6-card-date {
  font-family: var(--font-jetbrains), monospace;
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--dim);
}

.sp6-empty {
  text-align: center; padding: 40px;
  font-family: var(--font-newsreader), Georgia, serif;
  font-style: italic; color: var(--dim);
}

@keyframes sp6Rise {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 720px) {
  .sp6-main { padding: 32px 0 72px; }
  .sp6-hero { padding: 0 24px 44px; }
  .sp6-river-head { padding: 0 24px; }
  .sp6-track { padding: 6px 24px 14px; }
  .sp6-track-wrap {
    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 40px), transparent 100%);
    mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 40px), transparent 100%);
  }
  .sp6-card { flex: 0 0 268px; width: 268px; }
}

@media (prefers-reduced-motion: reduce) {
  .sp6-hero, .sp6-river {
    opacity: 1 !important; transform: none !important; animation: none !important;
  }
  .sp6-card, .sp6-hero-card, .sp6-card-bar, .sp6-hero-go,
  .sp6-card-title, .sp6-hero-title, .sp6-rh-viewall {
    transition: none !important;
  }
  .sp6-card:hover, .sp6-card:focus-visible { transform: none; }
  .sp6-track { scroll-behavior: auto; }
}
`,
        }}
      />
    </>
  );
}
