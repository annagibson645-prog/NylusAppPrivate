import Link from "next/link";
import NavG from "@/components/NavG";
import { COUNCILS } from "@/lib/council-data";
import { Emblem } from "@/components/council/CouncilEmblems";
import CouncilStars from "@/components/council/CouncilStars";

// ─── Prototype 5 — "Orbital Sigils" ──────────────────────────────────────────
// Each council is a sigil: its emblem seated at the heart of concentric rotating
// rings, like an alchemical seal or an astrolabe. Three rings per sigil, each
// turning at a different speed and direction; the emblem slowly counter-rotates.
// The title sits BELOW the sigil so nothing is eclipsed. Hover spins the rings
// faster and brightens the accent glow. Pure CSS — no client JS needed.
// All custom CSS is scoped with the `p5-` prefix.

const P5_STYLES = `
  .p5-root {
    display: flex;
    width: 100%;
    min-height: calc(100vh - 80px);
    background: #0e0d14;
    --p5-emblem-bg: #0e0d14;
    color: var(--text, #eae6f5);
    overflow: hidden;
  }
  [data-theme="sepia"] .p5-root {
    background: #f0ead8;
    --p5-emblem-bg: #f0ead8;
    color: var(--text, #2c1f0e);
  }

  /* ── Region ─────────────────────────────────────────────────────────────── */
  .p5-region {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 4vh 3%;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    overflow: hidden;
    border-right: 1px solid var(--p5-divider, rgba(255,255,255,0.055));
    transition: background 0.5s ease;
    -webkit-tap-highlight-color: transparent;
  }
  [data-theme="sepia"] .p5-region {
    border-right: 1px solid rgba(44,31,14,0.08);
  }
  .p5-region:last-child { border-right: none; }
  .p5-region.p5-center {
    flex: 1.18 1 0;
    background: rgba(255,255,255,0.014);
  }
  [data-theme="sepia"] .p5-region.p5-center {
    background: rgba(44,31,14,0.025);
  }
  .p5-region:hover {
    background: rgba(var(--p5-rgb), 0.05);
  }

  /* ── Background glow — slow rotating radial/conic wash ──────────────────── */
  .p5-glow {
    position: absolute;
    top: 42%;
    left: 50%;
    width: 130%;
    aspect-ratio: 1 / 1;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(circle at center,
        rgba(var(--p5-rgb), 0.16) 0%,
        rgba(var(--p5-rgb), 0.05) 34%,
        rgba(var(--p5-rgb), 0) 62%);
    opacity: 0.55;
    transition: opacity 0.5s ease;
    will-change: transform;
    animation: p5-glow-spin 120s linear infinite;
  }
  .p5-glow::after {
    content: "";
    position: absolute;
    inset: 12%;
    border-radius: 50%;
    background:
      conic-gradient(from 0deg,
        rgba(var(--p5-rgb), 0) 0deg,
        rgba(var(--p5-rgb), 0.10) 70deg,
        rgba(var(--p5-rgb), 0) 150deg,
        rgba(var(--p5-rgb), 0) 210deg,
        rgba(var(--p5-rgb), 0.08) 290deg,
        rgba(var(--p5-rgb), 0) 360deg);
    animation: p5-spin-ccw 90s linear infinite;
  }
  .p5-region:hover .p5-glow { opacity: 1; }
  @keyframes p5-glow-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }

  /* ── Sigil — the stacked rotating layers ───────────────────────────────── */
  .p5-sigil {
    position: relative;
    z-index: 2;
    width: clamp(190px, 23vw, 320px);
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--p5-color);
    flex-shrink: 0;
  }
  .p5-center .p5-sigil {
    width: clamp(210px, 26vw, 360px);
  }

  /* shared ring base */
  .p5-ring {
    position: absolute;
    border-radius: 50%;
    will-change: transform;
    pointer-events: none;
  }

  /* outer thin solid ring */
  .p5-ring-outer {
    inset: 0;
    border: 1px solid rgba(var(--p5-rgb), 0.30);
    box-shadow:
      0 0 18px rgba(var(--p5-rgb), 0.10),
      inset 0 0 16px rgba(var(--p5-rgb), 0.05);
    animation: p5-spin-cw 110s linear infinite;
    transition: border-color 0.5s ease, box-shadow 0.5s ease;
  }
  .p5-region:hover .p5-ring-outer {
    animation-duration: 26s;
    border-color: rgba(var(--p5-rgb), 0.55);
    box-shadow:
      0 0 30px rgba(var(--p5-rgb), 0.22),
      inset 0 0 22px rgba(var(--p5-rgb), 0.09);
  }

  /* tick-mark ring — dashes around a circle, drawn as a thick dashed border ring */
  .p5-ring-ticks {
    inset: 9%;
    animation: p5-spin-ccw 70s linear infinite;
  }
  .p5-ring-ticks svg { width: 100%; height: 100%; display: block; overflow: visible; }
  .p5-ring-ticks circle {
    fill: none;
    stroke: rgba(var(--p5-rgb), 0.40);
    stroke-width: 1.4;
    transition: stroke 0.5s ease;
  }
  .p5-region:hover .p5-ring-ticks {
    animation-duration: 16s;
  }
  .p5-region:hover .p5-ring-ticks circle {
    stroke: rgba(var(--p5-rgb), 0.70);
  }

  /* dotted/dashed inner ring */
  .p5-ring-dashed {
    inset: 20%;
    border: 1px dashed rgba(var(--p5-rgb), 0.34);
    animation: p5-spin-cw 40s linear infinite;
    transition: border-color 0.5s ease;
  }
  .p5-region:hover .p5-ring-dashed {
    animation-duration: 10s;
    border-color: rgba(var(--p5-rgb), 0.62);
  }

  /* a constellation of small orbiting dots between rings (center gets this extra layer) */
  .p5-ring-dots { inset: -3%; animation: p5-spin-ccw 95s linear infinite; }
  .p5-ring-dots svg { width: 100%; height: 100%; display: block; overflow: visible; }
  .p5-ring-dots circle {
    fill: rgba(var(--p5-rgb), 0.55);
    stroke: none;
    transition: fill 0.5s ease;
  }
  .p5-region:hover .p5-ring-dots { animation-duration: 22s; }
  .p5-region:hover .p5-ring-dots circle { fill: rgba(var(--p5-rgb), 0.85); }

  /* the emblem at the heart — focal, accent-colored, gently counter-rotating */
  .p5-emblem {
    position: absolute;
    width: 46%;
    height: 46%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    opacity: 0.62;
    /* The emblem at the heart stays STILL — only the rings around it move. */
    transition: opacity 0.5s ease, filter 0.5s ease;
    filter: drop-shadow(0 0 10px rgba(var(--p5-rgb), 0.20));
  }
  .p5-center .p5-emblem { width: 44%; height: 44%; }
  .p5-emblem svg { width: 100%; height: 100%; }
  [data-theme="sepia"] .p5-emblem { opacity: 0.72; }
  .p5-region:hover .p5-emblem {
    opacity: 0.95;
    filter: drop-shadow(0 0 18px rgba(var(--p5-rgb), 0.45));
  }

  @keyframes p5-emblem-breathe {
    0%   { transform: rotate(0deg)   scale(1); }
    50%  { transform: rotate(-6deg)  scale(1.045); }
    100% { transform: rotate(0deg)   scale(1); }
  }

  @keyframes p5-spin-cw  { to { transform: rotate(360deg); } }
  @keyframes p5-spin-ccw { to { transform: rotate(-360deg); } }

  /* ── Text block, below the sigil ───────────────────────────────────────── */
  .p5-kicker {
    margin-top: 36px;
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: var(--p5-color);
    opacity: 0.78;
    z-index: 2;
    transition: opacity 0.5s ease, letter-spacing 0.5s ease;
  }
  .p5-region:hover .p5-kicker { opacity: 1; letter-spacing: 0.42em; }

  .p5-name {
    margin: 12px 0 0;
    font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(26px, 2.6vw, 42px);
    line-height: 1.04;
    letter-spacing: -0.015em;
    text-align: center;
    color: var(--text, #eae6f5);
    z-index: 2;
    transition: color 0.5s ease, text-shadow 0.5s ease;
  }
  [data-theme="sepia"] .p5-name { color: var(--text, #2c1f0e); }
  .p5-center .p5-name { font-size: clamp(30px, 3vw, 50px); }
  .p5-region:hover .p5-name {
    text-shadow: 0 0 26px rgba(var(--p5-rgb), 0.35);
  }

  .p5-tagline {
    margin: 14px 0 0;
    max-width: 30ch;
    font-family: var(--font-newsreader), 'Newsreader', Georgia, serif;
    font-style: italic;
    font-size: clamp(14px, 1.05vw, 17px);
    line-height: 1.5;
    text-align: center;
    color: var(--text-muted, #8a849a);
    z-index: 2;
    transition: color 0.5s ease;
  }
  .p5-region:hover .p5-tagline {
    color: var(--text, #cdc8dd);
  }
  [data-theme="sepia"] .p5-region:hover .p5-tagline {
    color: #5a4a30;
  }

  /* thin accent rule beneath name, expands on hover */
  .p5-rule {
    margin-top: 18px;
    width: 26px;
    height: 1px;
    background: var(--p5-color);
    opacity: 0.5;
    z-index: 2;
    transition: width 0.5s ease, opacity 0.5s ease;
  }
  .p5-region:hover .p5-rule { width: 64px; opacity: 0.9; }

  /* ── Responsive: stack on narrow screens ───────────────────────────────── */
  @media (max-width: 820px) {
    .p5-root {
      flex-direction: column;
      min-height: calc(100vh - 80px);
    }
    .p5-region {
      flex: none;
      min-height: 52vh;
      border-right: none;
      border-bottom: 1px solid rgba(255,255,255,0.055);
      padding: 6vh 8%;
    }
    [data-theme="sepia"] .p5-region {
      border-right: none;
      border-bottom: 1px solid rgba(44,31,14,0.08);
    }
    .p5-region:last-child { border-bottom: none; }
    .p5-region.p5-center { flex: none; }
    .p5-sigil { width: clamp(180px, 56vw, 250px); }
    .p5-center .p5-sigil { width: clamp(190px, 60vw, 270px); }
    .p5-kicker { margin-top: 30px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .p5-glow, .p5-glow::after,
    .p5-ring-outer, .p5-ring-ticks, .p5-ring-dashed, .p5-ring-dots,
    .p5-emblem {
      animation: none !important;
    }
  }
`;

// Deterministic tick ring — N small radial dashes around a circle (SSR-safe).
function TickRing({ count = 60 }: { count?: number }) {
  const cx = 100;
  const cy = 100;
  const rOuter = 96;
  const rInner = 88;
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const long = i % 5 === 0;
        const r2 = long ? rInner - 6 : rInner;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * rOuter}
            y1={cy + Math.sin(a) * rOuter}
            x2={cx + Math.cos(a) * r2}
            y2={cy + Math.sin(a) * r2}
            stroke="currentColor"
            strokeWidth={long ? 1.8 : 1.1}
            opacity={long ? 0.6 : 0.34}
          />
        );
      })}
    </svg>
  );
}

// Deterministic orbiting dots — N points on a circle (SSR-safe).
function DotRing({ count = 12 }: { count?: number }) {
  const cx = 100;
  const cy = 100;
  const r = 92;
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2;
        const big = i % 4 === 0;
        return (
          <circle
            key={i}
            cx={cx + Math.cos(a) * r}
            cy={cy + Math.sin(a) * r}
            r={big ? 2.6 : 1.6}
          />
        );
      })}
    </svg>
  );
}

export default function CouncilP5() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: P5_STYLES }} />
      <NavG active="The Council" />
      <CouncilStars density={0.4} />

      <div className="p5-root">
        {COUNCILS.map((c) => {
          const isCenter = c.key === "sovereignty";
          const regionStyle = {
            ["--p5-color" as string]: c.color,
            ["--p5-rgb" as string]: c.colorRgb,
            ["--emblem-bg" as string]: "var(--p5-emblem-bg)",
          } as React.CSSProperties;

          return (
            <Link
              key={c.key}
              href={`/council/${c.key}`}
              aria-label={c.name}
              className={`p5-region${isCenter ? " p5-center" : ""}`}
              style={regionStyle}
            >
              {/* rotating accent wash behind the sigil */}
              <span className="p5-glow" aria-hidden="true" />

              {/* the sigil — emblem at heart of concentric rotating rings */}
              <div className="p5-sigil">
                {/* center sigil gets an extra outer constellation ring */}
                {isCenter && (
                  <div className="p5-ring p5-ring-dots" aria-hidden="true">
                    <DotRing count={16} />
                  </div>
                )}
                <div className="p5-ring p5-ring-outer" aria-hidden="true" />
                <div className="p5-ring p5-ring-ticks" aria-hidden="true">
                  <TickRing count={isCenter ? 72 : 60} />
                </div>
                <div className="p5-ring p5-ring-dashed" aria-hidden="true" />
                <div className="p5-emblem">
                  <Emblem kind={c.emblem} />
                </div>
              </div>

              {/* text block, safely below the sigil */}
              <span className="p5-kicker">{c.mode}</span>
              <h2 className="p5-name">{c.name}</h2>
              <span className="p5-rule" aria-hidden="true" />
              <p className="p5-tagline">{c.tagline}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
