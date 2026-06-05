import Link from "next/link";
import NavG from "@/components/NavG";
import { COUNCILS } from "@/lib/council-data";
import { Emblem } from "@/components/council/CouncilEmblems";

// ─── Prototype 1 — "Triptych Veil" ───────────────────────────────────────────
// Three equal full-height panels. Each emblem drifts behind its title in a slow,
// pure-CSS loop. Center (Sovereignty) panel is gently emphasized.
// All custom CSS is scoped with the `p1-` prefix to avoid collisions with the
// other four prototypes that share global CSS.

const P1_STYLES = `
  .p1-root {
    display: flex;
    width: 100%;
    height: calc(100vh - 80px);
    overflow: hidden;
    background: var(--bg, #0e0d14);
    --p1-emblem-bg: #0e0d14;
  }
  [data-theme="sepia"] .p1-root {
    background: var(--bg, #f0ead8);
    --p1-emblem-bg: #f0ead8;
  }

  /* ── Panel ── */
  .p1-panel {
    position: relative;
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-decoration: none;
    cursor: pointer;
    border-right: 1px solid var(--p1-divider, rgba(255,255,255,0.05));
    transition: background 0.35s ease, box-shadow 0.35s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .p1-panel:last-child { border-right: none; }

  /* faint vertical accent tint, top + bottom */
  .p1-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(var(--p1-rgb), 0.05) 0%,
      rgba(var(--p1-rgb), 0) 26%,
      rgba(var(--p1-rgb), 0) 74%,
      rgba(var(--p1-rgb), 0.06) 100%
    );
    transition: opacity 0.35s ease;
    z-index: 0;
  }

  /* luminous divider glow, painted on the right edge of each panel */
  .p1-panel::after {
    content: "";
    position: absolute;
    top: 8%;
    bottom: 8%;
    right: -0.5px;
    width: 1px;
    background: linear-gradient(
      to bottom,
      rgba(var(--p1-rgb), 0) 0%,
      rgba(var(--p1-rgb), 0.45) 50%,
      rgba(var(--p1-rgb), 0) 100%
    );
    box-shadow: 0 0 8px rgba(var(--p1-rgb), 0.25);
    opacity: 0.5;
    transition: opacity 0.35s ease, box-shadow 0.35s ease;
    z-index: 2;
    pointer-events: none;
  }
  .p1-panel:last-child::after { display: none; }

  .p1-panel:hover {
    background: rgba(var(--p1-rgb), 0.07);
  }
  .p1-panel:hover::after {
    opacity: 1;
    box-shadow: 0 0 16px rgba(var(--p1-rgb), 0.5);
  }

  /* center panel emphasis */
  .p1-panel.p1-center {
    background: rgba(255,255,255,0.018);
  }
  [data-theme="sepia"] .p1-panel.p1-center {
    background: rgba(44,31,14,0.03);
  }
  .p1-panel.p1-center:hover {
    background: rgba(var(--p1-rgb), 0.08);
  }

  /* ── Emblem layer (behind everything) ── */
  .p1-emblem {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 64%;
    height: 64%;
    transform: translate(-50%, -50%);
    color: var(--p1-color);
    z-index: 1;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: transform, opacity;
  }
  .p1-emblem svg { width: 100%; height: 100%; }

  /* each emblem floats with its own keyframe instance via inline duration/delay */
  .p1-emblem-inner {
    width: 100%;
    height: 100%;
    opacity: 0.13;
    animation-name: p1-drift;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    will-change: transform, opacity;
    transition: opacity 0.35s ease, transform 0.35s ease;
  }
  [data-theme="sepia"] .p1-emblem-inner { opacity: 0.19; }

  .p1-panel:hover .p1-emblem-inner {
    opacity: 0.24;
    transform: scale(1.06);
  }
  [data-theme="sepia"] .p1-panel:hover .p1-emblem-inner {
    opacity: 0.30;
    transform: scale(1.06);
  }

  @keyframes p1-drift {
    0%   { transform: translateY(0px)   rotate(-3deg); opacity: var(--p1-op-lo, 0.11); }
    50%  { transform: translateY(-9px)  rotate(3deg);  opacity: var(--p1-op-hi, 0.16); }
    100% { transform: translateY(0px)   rotate(-3deg); opacity: var(--p1-op-lo, 0.11); }
  }

  /* ── Content (above emblem) ── */
  .p1-content {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 7%;
    max-width: 460px;
  }

  .p1-kicker {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: var(--p1-color);
    opacity: 0.62;
    margin-bottom: 20px;
  }

  .p1-title {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(26px, 3.2vw, 40px);
    line-height: 1.08;
    letter-spacing: -0.012em;
    color: var(--text, #eae6f5);
    margin: 0;
  }
  [data-theme="sepia"] .p1-title { color: var(--text, #2c1f0e); }

  .p1-panel.p1-center .p1-title {
    font-size: clamp(29px, 3.6vw, 45px);
  }

  .p1-tagline {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 15px;
    line-height: 1.5;
    color: var(--text-muted, #8a849a);
    margin: 16px 0 0;
    max-width: 30ch;
  }

  /* ── Enter affordance pinned near the bottom ── */
  .p1-enter {
    position: absolute;
    bottom: 9%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .p1-hairline {
    width: 38px;
    height: 1px;
    background: rgba(var(--p1-rgb), 0.45);
    transition: width 0.35s ease, background 0.35s ease;
  }
  .p1-panel:hover .p1-hairline {
    width: 62px;
    background: rgba(var(--p1-rgb), 0.85);
  }
  .p1-enter-label {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--p1-color);
    opacity: 0.6;
    transition: opacity 0.35s ease, letter-spacing 0.35s ease;
  }
  .p1-panel:hover .p1-enter-label {
    opacity: 1;
    letter-spacing: 0.28em;
  }

  /* ── Narrow screens: stack vertically ── */
  @media (max-width: 760px) {
    .p1-root {
      flex-direction: column;
      height: auto;
      min-height: calc(100vh - 80px);
      overflow: visible;
    }
    .p1-panel {
      min-height: 46vh;
      border-right: none;
      border-bottom: 1px solid var(--p1-divider, rgba(255,255,255,0.05));
    }
    .p1-panel:last-child { border-bottom: none; }
    /* turn the right-edge divider glow into a bottom-edge one */
    .p1-panel::after {
      top: auto;
      bottom: -0.5px;
      right: 8%;
      left: 8%;
      width: auto;
      height: 1px;
      background: linear-gradient(
        to right,
        rgba(var(--p1-rgb), 0) 0%,
        rgba(var(--p1-rgb), 0.45) 50%,
        rgba(var(--p1-rgb), 0) 100%
      );
    }
    .p1-panel:last-child::after { display: none; }
    .p1-emblem { width: 56%; height: 80%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .p1-emblem-inner { animation: none; }
  }
`;

// per-panel motion tuning so the three emblems never sync up
const MOTION: Record<string, { dur: string; delay: string }> = {
  influence:   { dur: "16s", delay: "0s" },
  sovereignty: { dur: "21s", delay: "-7s" },
  craftsman:   { dur: "18s", delay: "-3s" },
};

export default function Prototype1Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: P1_STYLES }} />
      <NavG active="The Council" />

      <main className="p1-root">
        {COUNCILS.map((c) => {
          const motion = MOTION[c.key] ?? { dur: "18s", delay: "0s" };
          const isCenter = c.key === "sovereignty";
          return (
            <Link
              key={c.key}
              href={`/council/${c.key}`}
              aria-label={c.name}
              className={`p1-panel${isCenter ? " p1-center" : ""}`}
              style={
                {
                  "--p1-color": c.color,
                  "--p1-rgb": c.colorRgb,
                } as React.CSSProperties
              }
            >
              {/* drifting emblem behind the title */}
              <div className="p1-emblem">
                <div
                  className="p1-emblem-inner"
                  style={{
                    animationDuration: motion.dur,
                    animationDelay: motion.delay,
                  }}
                >
                  <Emblem kind={c.emblem} style={{ width: "100%", height: "100%" }} />
                </div>
              </div>

              {/* title block */}
              <div className="p1-content">
                <div className="p1-kicker">{c.mode}</div>
                <h2 className="p1-title">{c.name}</h2>
                <p className="p1-tagline">{c.tagline}</p>
              </div>

              {/* enter affordance */}
              <div className="p1-enter">
                <span className="p1-hairline" />
                <span className="p1-enter-label">Enter →</span>
              </div>
            </Link>
          );
        })}
      </main>
    </>
  );
}
