import Link from "next/link";
import NavG from "@/components/NavG";
import { COUNCILS } from "@/lib/council-data";
import { Emblem } from "@/components/council/CouncilEmblems";

// ─── Prototype 4 — "Living Emblem" ───────────────────────────────────────────
// The emblem is the hero here: big, nearly region-filling, and ALIVE with
// emblem-SPECIFIC motion driven entirely by pure-CSS keyframes targeting the
// `data-part` sub-elements exposed by each SVG. The title is smaller and pinned
// to the BOTTOM of each region over a gradient scrim so it stays legible.
//   • EYE (Influence)   — pupil/iris dilate & contract, rays rotate. It watches.
//   • CROWN (Sovereignty)— gems shimmer (staggered), star twinkles, regal sway.
//   • HAMMER×PEN (Craft) — hammer & pen rock toward each other; spark ring pulses.
// All custom CSS is scoped with the `p4-` prefix. No "use client" — this page is
// 100% declarative, all motion is CSS keyframes.

const P4_STYLES = `
  .p4-root {
    display: flex;
    width: 100%;
    height: calc(100vh - 80px);
    overflow: hidden;
    background: var(--bg, #0e0d14);
    --p4-emblem-bg: #0e0d14;
    /* opacity envelope for the big hero emblem (dark mode) */
    --p4-op: 0.26;
    --p4-op-hover: 0.40;
    --p4-wash: 0.05;
    --p4-wash-hover: 0.14;
  }
  [data-theme="sepia"] .p4-root {
    background: var(--bg, #f0ead8);
    --p4-emblem-bg: #f0ead8;
    --p4-op: 0.34;
    --p4-op-hover: 0.52;
    --p4-wash: 0.07;
    --p4-wash-hover: 0.18;
  }

  /* ── Region ── */
  .p4-region {
    position: relative;
    flex: 1 1 0;
    display: block;
    overflow: hidden;
    text-decoration: none;
    cursor: pointer;
    transition: flex-grow 0.4s ease;
    -webkit-tap-highlight-color: transparent;
    color: var(--p4-color);
  }
  /* thin separating hairline; the washes do most of the dividing */
  .p4-region + .p4-region::before {
    content: "";
    position: absolute;
    top: 6%;
    bottom: 6%;
    left: 0;
    width: 1px;
    background: linear-gradient(
      to bottom,
      rgba(var(--p4-rgb), 0) 0%,
      rgba(var(--p4-rgb), 0.30) 50%,
      rgba(var(--p4-rgb), 0) 100%
    );
    z-index: 4;
    pointer-events: none;
  }

  /* ── Full-bleed accent radial wash (pulses) ── */
  .p4-wash {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(
      120% 90% at 50% 42%,
      rgba(var(--p4-rgb), var(--p4-wash)) 0%,
      rgba(var(--p4-rgb), 0) 64%
    );
    animation: p4-wash-pulse 9s ease-in-out infinite;
    transition: opacity 0.3s ease;
    will-change: opacity, transform;
  }
  @keyframes p4-wash-pulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.04); }
  }
  .p4-region:hover .p4-wash {
    background: radial-gradient(
      130% 100% at 50% 44%,
      rgba(var(--p4-rgb), var(--p4-wash-hover)) 0%,
      rgba(var(--p4-rgb), 0.04) 52%,
      rgba(var(--p4-rgb), 0) 78%
    );
  }
  .p4-region:hover { flex-grow: 1.12; }

  /* ── Hero emblem layer (behind the bottom title) ── */
  .p4-emblem {
    position: absolute;
    top: 46%;
    left: 50%;
    width: 92%;
    height: 92%;
    max-width: 560px;
    max-height: 560px;
    transform: translate(-50%, -50%);
    z-index: 1;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: var(--p4-op);
    transition: opacity 0.3s ease, transform 0.3s ease;
    will-change: opacity, transform;
  }
  .p4-emblem svg { width: 100%; height: 100%; overflow: visible; }
  .p4-region:hover .p4-emblem {
    opacity: var(--p4-op-hover);
    transform: translate(-50%, -50%) scale(1.03);
  }

  /* sub-element transforms need a fill-box origin to pivot correctly */
  .p4-emblem [data-part] {
    transform-box: fill-box;
    transform-origin: center;
    will-change: transform, opacity;
  }

  /* ════════ EYE — Influence: it watches you ════════ */
  .p4-eye [data-part="rays"] {
    transform-origin: 100px 100px;
    animation: p4-eye-rays 38s linear infinite;
  }
  .p4-eye [data-part="iris"],
  .p4-eye [data-part="iris-lines"] {
    transform-origin: 100px 100px;
    animation: p4-eye-dilate 7s ease-in-out infinite;
  }
  .p4-eye [data-part="pupil"] {
    transform-origin: 100px 100px;
    animation: p4-eye-pupil 7s ease-in-out infinite;
  }
  @keyframes p4-eye-rays {
    to { transform: rotate(360deg); }
  }
  @keyframes p4-eye-dilate {
    0%, 100% { transform: scale(1.0); }
    44%      { transform: scale(1.1); }
    70%      { transform: scale(0.92); }
  }
  @keyframes p4-eye-pupil {
    0%, 100% { transform: scale(0.92); }
    44%      { transform: scale(1.18); }
    70%      { transform: scale(0.82); }
  }
  .p4-region:hover .p4-eye [data-part="iris"],
  .p4-region:hover .p4-eye [data-part="iris-lines"],
  .p4-region:hover .p4-eye [data-part="pupil"] {
    animation-duration: 4.6s;
  }
  .p4-region:hover .p4-eye [data-part="rays"] {
    animation-duration: 24s;
  }

  /* ════════ CROWN — Sovereignty: shimmer, twinkle, regal sway ════════ */
  .p4-crown [data-part="crown-body"],
  .p4-crown [data-part="gems"],
  .p4-crown [data-part="band-gems"],
  .p4-crown [data-part="star"] {
    transform-origin: 100px 138px;
  }
  /* whole-crown sway is applied on a wrapper instead — see .p4-crown svg */
  .p4-crown svg {
    transform-origin: 100px 150px;
    animation: p4-crown-sway 11s ease-in-out infinite;
  }
  @keyframes p4-crown-sway {
    0%, 100% { transform: rotate(-2deg); }
    50%      { transform: rotate(2deg); }
  }
  .p4-crown [data-part="gems"]      { animation: p4-shimmer 3.2s ease-in-out infinite; }
  .p4-crown [data-part="band-gems"] { animation: p4-shimmer 3.2s ease-in-out 1.1s infinite; }
  @keyframes p4-shimmer {
    0%, 100% { opacity: 0.55; filter: brightness(1); }
    50%      { opacity: 1;    filter: brightness(1.6); }
  }
  .p4-crown [data-part="star"] {
    transform-origin: 100px 40px;
    animation: p4-twinkle 4.4s ease-in-out infinite;
  }
  @keyframes p4-twinkle {
    0%, 100% { transform: rotate(0deg)   scale(0.78); opacity: 0.55; }
    50%      { transform: rotate(45deg)  scale(1.15); opacity: 1; }
  }
  .p4-region:hover .p4-crown [data-part="gems"],
  .p4-region:hover .p4-crown [data-part="band-gems"] { animation-duration: 2s; }
  .p4-region:hover .p4-crown svg { animation-duration: 8s; }

  /* ════════ HAMMER × PEN — Craft: about to strike the same point ════════ */
  .p4-hammerpen [data-part="hammer"] {
    transform-origin: 40px 158px;   /* handle butt — rocks from the grip */
    animation: p4-hammer-strike 3s ease-in-out infinite;
  }
  .p4-hammerpen [data-part="pen"] {
    transform-origin: 160px 42px;   /* barrel top — pivots from the cap */
    animation: p4-pen-strike 3s ease-in-out infinite;
  }
  .p4-hammerpen [data-part="spark"] {
    transform-origin: 100px 100px;
    animation: p4-spark 3s ease-in-out infinite;
  }
  @keyframes p4-hammer-strike {
    0%, 100% { transform: rotate(-7deg); }
    50%      { transform: rotate(2deg); }
  }
  @keyframes p4-pen-strike {
    0%, 100% { transform: rotate(7deg); }
    50%      { transform: rotate(-2deg); }
  }
  @keyframes p4-spark {
    0%, 100% { transform: scale(0.7);  opacity: 0.25; }
    48%      { transform: scale(0.74); opacity: 0.3; }
    50%      { transform: scale(1.5);  opacity: 0.95; }
    58%      { transform: scale(1.1);  opacity: 0.5; }
  }
  .p4-region:hover .p4-hammerpen [data-part="hammer"],
  .p4-region:hover .p4-hammerpen [data-part="pen"],
  .p4-region:hover .p4-hammerpen [data-part="spark"] {
    animation-duration: 1.9s;
  }

  /* ── Bottom scrim so the title reads over the bright emblem ── */
  .p4-scrim {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 46%;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(
      to top,
      var(--p4-scrim-c, rgba(14,13,20,0.92)) 0%,
      var(--p4-scrim-c, rgba(14,13,20,0.7)) 32%,
      rgba(14,13,20,0) 100%
    );
    transition: opacity 0.3s ease;
  }
  [data-theme="sepia"] .p4-scrim {
    background: linear-gradient(
      to top,
      rgba(240,234,216,0.94) 0%,
      rgba(240,234,216,0.72) 32%,
      rgba(240,234,216,0) 100%
    );
  }

  /* ── Bottom title block ── */
  .p4-title-block {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 7%;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 7%;
  }
  .p4-kicker {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: var(--p4-color);
    opacity: 0.7;
    margin-bottom: 12px;
    transition: opacity 0.3s ease, letter-spacing 0.3s ease;
  }
  .p4-region:hover .p4-kicker { opacity: 1; letter-spacing: 0.4em; }

  .p4-title {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-size: clamp(24px, 3vw, 40px);
    line-height: 1.04;
    letter-spacing: -0.015em;
    color: var(--text, #eae6f5);
    margin: 0;
    text-shadow: 0 2px 24px rgba(0,0,0,0.4);
    transition: color 0.3s ease, text-shadow 0.3s ease;
  }
  [data-theme="sepia"] .p4-title { color: var(--text, #2c1f0e); text-shadow: none; }
  .p4-region:hover .p4-title {
    color: color-mix(in srgb, var(--p4-color) 32%, var(--text, #eae6f5));
    text-shadow: 0 2px 30px rgba(var(--p4-rgb), 0.35);
  }
  [data-theme="sepia"] .p4-region:hover .p4-title {
    color: color-mix(in srgb, var(--p4-color) 40%, var(--text, #2c1f0e));
  }

  .p4-tagline {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.45;
    color: var(--text-muted, #8a849a);
    margin: 12px 0 0;
    max-width: 30ch;
  }

  /* ── Narrow screens: stack vertically ── */
  @media (max-width: 760px) {
    .p4-root {
      flex-direction: column;
      height: auto;
      min-height: calc(100vh - 80px);
      overflow: visible;
    }
    .p4-region {
      min-height: 48vh;
      flex: none;
    }
    .p4-region:hover { flex-grow: 0; }
    .p4-region + .p4-region::before {
      top: 0; left: 7%; right: 7%; bottom: auto;
      width: auto; height: 1px;
      background: linear-gradient(
        to right,
        rgba(var(--p4-rgb), 0) 0%,
        rgba(var(--p4-rgb), 0.30) 50%,
        rgba(var(--p4-rgb), 0) 100%
      );
    }
    .p4-emblem { width: 78%; height: 78%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .p4-wash,
    .p4-emblem [data-part],
    .p4-crown svg { animation: none !important; }
  }
`;

export default function Prototype4Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: P4_STYLES }} />
      <NavG active="The Council" />

      <main className="p4-root">
        {COUNCILS.map((c) => {
          const emblemClass =
            c.emblem === "eye"
              ? "p4-eye"
              : c.emblem === "crown"
              ? "p4-crown"
              : "p4-hammerpen";
          return (
            <Link
              key={c.key}
              href={`/council/${c.key}`}
              aria-label={c.name}
              className="p4-region"
              style={
                {
                  "--p4-color": c.color,
                  "--p4-rgb": c.colorRgb,
                } as React.CSSProperties
              }
            >
              {/* pulsing accent wash */}
              <span className="p4-wash" aria-hidden="true" />

              {/* the living hero emblem */}
              <span className={`p4-emblem ${emblemClass}`} aria-hidden="true">
                <Emblem kind={c.emblem} />
              </span>

              {/* bottom scrim keeps the title legible over the bright emblem */}
              <span className="p4-scrim" aria-hidden="true" />

              {/* bottom-anchored title */}
              <span className="p4-title-block">
                <span className="p4-kicker">{c.mode}</span>
                <span className="p4-title">{c.name}</span>
                <span className="p4-tagline">{c.tagline}</span>
              </span>
            </Link>
          );
        })}
      </main>
    </>
  );
}
