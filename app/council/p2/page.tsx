"use client";

import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import NavG from "@/components/NavG";
import { COUNCILS } from "@/lib/council-data";
import { Emblem } from "@/components/council/CouncilEmblems";

// ── Prototype 2 · "Parallax Void" ────────────────────────────────────────────
// A single continuous deep-void field. Three soft accent glows sit side by side
// like three pools of light. A deterministic starfield twinkles and drifts. The
// three large, faint emblems parallax against the cursor, each at a different
// depth, plus a slow idle float so motion never stops.

const ROMAN = ["I", "II", "III"];

// Deterministic pseudo-random star layout from index math — identical on server
// and client, so no hydration mismatch (no Math.random in render).
const STAR_COUNT = 78;
const STARS = Array.from({ length: STAR_COUNT }).map((_, i) => {
  // Cheap, stable hash-ish spread using irrational multipliers + fract().
  const fx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
  const fy = (Math.sin(i * 78.233) * 12345.6789) % 1;
  const fs = (Math.sin(i * 4.1357) * 9876.54321) % 1;
  const fd = (Math.sin(i * 1.6180) * 271.828) % 1;
  const x = ((fx + 1) % 1) * 100;            // 0–100 %
  const y = ((fy + 1) % 1) * 100;            // 0–100 %
  const size = 0.7 + ((fs + 1) % 1) * 1.9;   // 0.7–2.6 px
  const delay = ((fd + 1) % 1) * 6;          // 0–6 s
  const dur = 3.2 + ((fs + 1) % 1) * 4.5;    // twinkle duration
  const drift = 14 + ((fx + 1) % 1) * 22;    // upward drift duration (s)
  // Depth factor: stars also parallax very subtly (smaller than emblems).
  const depth = 0.3 + ((fy + 1) % 1) * 0.7;
  return { x, y, size, delay, dur, drift, depth };
});

// Per-region parallax depth — center sits "closest", flanks deeper, so the trio
// feels layered as the cursor moves.
const DEPTH = [10, 16, 12]; // px of travel per region (Influence, Sov, Craft)

export default function CouncilParallaxVoid() {
  const rootRef = useRef<HTMLDivElement>(null);
  // cursor offset from center, normalized -1..1
  const [cur, setCur] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    setCur({ x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) });
  }, []);

  const onLeave = useCallback(() => setCur({ x: 0, y: 0 }), []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavG active="The Council" />

      <div
        ref={rootRef}
        className="p2-field"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {/* Starfield — behind everything */}
        <div className="p2-stars" aria-hidden>
          {STARS.map((s, i) => (
            <span
              key={i}
              className="p2-star"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                // parallax: stars shift opposite cursor, scaled by depth
                transform: `translate(${-cur.x * s.depth * 6}px, ${-cur.y * s.depth * 6}px)`,
                // animation: twinkle + slow upward drift
                animation: `p2-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite, p2-drift ${s.drift}s linear ${s.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Three regions */}
        {COUNCILS.map((c, i) => {
          const depth = DEPTH[i];
          // parallax translate for this emblem (cursor-driven)
          const px = cur.x * depth;
          const py = cur.y * depth;
          return (
            <Link
              key={c.key}
              href={`/council/${c.key}`}
              aria-label={c.name}
              className="p2-region"
              style={
                {
                  "--accent": c.color,
                  "--accent-rgb": c.colorRgb,
                } as React.CSSProperties
              }
            >
              {/* radial pool of light */}
              <div className="p2-glow" aria-hidden />

              {/* large, faint, parallaxing emblem */}
              <div
                className={`p2-emblem-wrap p2-float-${i}`}
                aria-hidden
                style={{ ["--px" as string]: `${px}px`, ["--py" as string]: `${py}px` }}
              >
                <Emblem kind={c.emblem} className="p2-emblem" />
              </div>

              {/* foreground text */}
              <div className="p2-content">
                <span className="p2-index">{ROMAN[i]}</span>
                <h2 className="p2-title">{c.name}</h2>
                <p className="p2-tagline">{c.tagline}</p>
                <span className="p2-enter">
                  <span className="p2-enter-line" />
                  enter
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

const CSS = `
  /* ── Field ───────────────────────────────────────────────────────────────── */
  .p2-field {
    position: relative;
    display: flex;
    width: 100%;
    height: calc(100vh - 80px);
    min-height: calc(100vh - 80px);
    overflow: hidden;
    background:
      radial-gradient(1200px 700px at 50% 120%, rgba(20,18,30,0.9), transparent 70%),
      #0e0d14;
    --emblem-bg: #0e0d14;
  }
  [data-theme="sepia"] .p2-field {
    background:
      radial-gradient(1200px 700px at 50% 120%, rgba(228,218,190,0.7), transparent 70%),
      #f0ead8;
    --emblem-bg: #f0ead8;
  }

  /* ── Starfield ───────────────────────────────────────────────────────────── */
  .p2-stars {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 1;
  }
  .p2-star {
    position: absolute;
    border-radius: 50%;
    background: #d9d4ea;
    box-shadow: 0 0 4px rgba(217,212,234,0.6);
    opacity: 0.5;
    will-change: opacity, transform;
  }
  [data-theme="sepia"] .p2-star {
    background: #8a7a52;
    box-shadow: 0 0 3px rgba(138,122,82,0.45);
    opacity: 0.35;
  }
  @keyframes p2-twinkle {
    0%, 100% { opacity: 0.12; }
    50%      { opacity: 0.85; }
  }
  @keyframes p2-drift {
    from { margin-top: 0; }
    to   { margin-top: -40px; }
  }

  /* ── Region ──────────────────────────────────────────────────────────────── */
  .p2-region {
    position: relative;
    flex: 1 1 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    overflow: hidden;
    z-index: 2;
    transition: flex 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  /* subtle seam between pools, no hard divider */
  .p2-region + .p2-region::after {
    content: "";
    position: absolute; left: 0; top: 12%; bottom: 12%;
    width: 1px;
    background: linear-gradient(transparent, rgba(255,255,255,0.05), transparent);
    pointer-events: none;
  }
  [data-theme="sepia"] .p2-region + .p2-region::after {
    background: linear-gradient(transparent, rgba(44,31,14,0.08), transparent);
  }

  /* ── Glow pool ───────────────────────────────────────────────────────────── */
  .p2-glow {
    position: absolute;
    left: 50%; top: 50%;
    width: 115%; height: 78%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      closest-side,
      rgba(var(--accent-rgb), 0.16),
      rgba(var(--accent-rgb), 0.05) 55%,
      transparent 78%
    );
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    z-index: 1;
  }
  [data-theme="sepia"] .p2-glow {
    background: radial-gradient(
      closest-side,
      rgba(var(--accent-rgb), 0.22),
      rgba(var(--accent-rgb), 0.07) 55%,
      transparent 78%
    );
    mix-blend-mode: multiply;
  }
  .p2-region:hover .p2-glow {
    background: radial-gradient(
      closest-side,
      rgba(var(--accent-rgb), 0.30),
      rgba(var(--accent-rgb), 0.10) 55%,
      transparent 80%
    );
    transform: translate(-50%, -50%) scale(1.04);
  }

  /* ── Emblem ──────────────────────────────────────────────────────────────── */
  .p2-emblem-wrap {
    position: absolute;
    left: 50%; top: 50%;
    width: 70%;
    aspect-ratio: 1 / 1;
    max-width: 520px;
    color: var(--accent);
    opacity: 0.12;
    pointer-events: none;
    z-index: 1;
    /* parallax (--px/--py) composes with the per-region idle float keyframe */
    transition: opacity 0.3s ease, filter 0.3s ease;
    will-change: transform, opacity;
  }
  .p2-emblem {
    width: 100%; height: 100%;
    display: block;
    filter: drop-shadow(0 0 18px rgba(var(--accent-rgb), 0.25));
  }
  .p2-region:hover .p2-emblem-wrap {
    opacity: 0.30;
  }
  .p2-region:hover .p2-emblem {
    filter: drop-shadow(0 0 30px rgba(var(--accent-rgb), 0.55));
  }
  [data-theme="sepia"] .p2-emblem-wrap { opacity: 0.18; }
  [data-theme="sepia"] .p2-region:hover .p2-emblem-wrap { opacity: 0.38; }

  /* idle float — translate(-50%,-50%) baseline + parallax offset + bob.
     Each region a different phase/amplitude so the trio feels layered. */
  @keyframes p2-float-a {
    0%,100% { transform: translate(calc(-50% + var(--px,0px)), calc(-50% + var(--py,0px) - 10px)); }
    50%     { transform: translate(calc(-50% + var(--px,0px)), calc(-50% + var(--py,0px) + 12px)); }
  }
  @keyframes p2-float-b {
    0%,100% { transform: translate(calc(-50% + var(--px,0px)), calc(-50% + var(--py,0px) + 8px)) rotate(-0.5deg); }
    50%     { transform: translate(calc(-50% + var(--px,0px)), calc(-50% + var(--py,0px) - 14px)) rotate(0.5deg); }
  }
  @keyframes p2-float-c {
    0%,100% { transform: translate(calc(-50% + var(--px,0px) - 8px), calc(-50% + var(--py,0px))); }
    50%     { transform: translate(calc(-50% + var(--px,0px) + 8px), calc(-50% + var(--py,0px) - 10px)); }
  }
  .p2-float-0 { animation: p2-float-a 11s ease-in-out infinite; }
  .p2-float-1 { animation: p2-float-b 13s ease-in-out infinite; }
  .p2-float-2 { animation: p2-float-c 12s ease-in-out infinite; }

  /* ── Content ─────────────────────────────────────────────────────────────── */
  .p2-content {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 24px;
    pointer-events: none; /* the whole Link is the target */
  }
  .p2-index {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.34em;
    color: var(--accent);
    opacity: 0.75;
    margin-bottom: 18px;
    transition: opacity 0.3s ease;
  }
  .p2-region:hover .p2-index { opacity: 1; }

  .p2-title {
    font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(26px, 3.4vw, 42px);
    line-height: 1.08;
    margin: 0;
    color: var(--text, #eae6f5);
    letter-spacing: -0.01em;
    transition: color 0.3s ease, text-shadow 0.3s ease;
    text-shadow: 0 2px 24px rgba(0,0,0,0.5);
  }
  [data-theme="sepia"] .p2-title { text-shadow: 0 2px 18px rgba(240,234,216,0.7); }
  .p2-region:hover .p2-title {
    color: var(--accent);
    text-shadow: 0 0 28px rgba(var(--accent-rgb), 0.45);
  }

  .p2-tagline {
    font-family: var(--font-newsreader), 'Newsreader', Georgia, serif;
    font-style: italic;
    font-size: clamp(14px, 1.2vw, 17px);
    line-height: 1.5;
    margin: 14px 0 0;
    max-width: 19ch;
    color: var(--text-muted, #8a849a);
    transition: color 0.3s ease;
  }
  .p2-region:hover .p2-tagline { color: var(--text, #eae6f5); }
  [data-theme="sepia"] .p2-region:hover .p2-tagline { color: #2c1f0e; }

  /* enter hint */
  .p2-enter {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-top: 26px;
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--accent);
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .p2-enter-line {
    display: inline-block;
    width: 26px; height: 1px;
    background: var(--accent);
    box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.7);
  }
  .p2-region:hover .p2-enter {
    opacity: 0.95;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .p2-star,
    .p2-float-0, .p2-float-1, .p2-float-2 { animation: none !important; }
  }

  /* ── Narrow: stack vertically ────────────────────────────────────────────── */
  @media (max-width: 760px) {
    .p2-field {
      flex-direction: column;
      height: auto;
      min-height: calc(100vh - 80px);
    }
    .p2-region {
      flex: none;
      min-height: 44vh;
      width: 100%;
    }
    .p2-region + .p2-region::after {
      left: 12%; right: 12%; top: 0; bottom: auto;
      width: auto; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    }
    [data-theme="sepia"] .p2-region + .p2-region::after {
      background: linear-gradient(90deg, transparent, rgba(44,31,14,0.1), transparent);
    }
    .p2-emblem-wrap { width: 64%; max-width: 360px; }
    .p2-glow { width: 92%; height: 86%; }
  }
`;
