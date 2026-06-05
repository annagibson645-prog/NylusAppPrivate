import Link from "next/link";
import NavG from "@/components/NavG";
import { COUNCILS } from "@/lib/council-data";
import { Emblem } from "@/components/council/CouncilEmblems";

// ─── Prototype 3 — "Cathedral Arches" ────────────────────────────────────────
// The three councils are three arched doorways of a chamber, like the portals of
// a cathedral. Each arch glows from within: the emblem floats behind the title
// inside a soft radial halo, breathing slowly and out of phase with its
// neighbours. The center arch (Sovereignty) stands tallest — the seat of being.
// Hover swings the door toward the light. All custom CSS is scoped with `p3-`.

const P3_STYLES = `
  .p3-root {
    position: relative;
    width: 100%;
    height: calc(100vh - 80px);
    overflow: hidden;
    /* dark stone floor */
    background:
      radial-gradient(120% 80% at 50% 120%, rgba(8,7,12,0) 0%, rgba(4,3,7,0.9) 100%),
      linear-gradient(to bottom, #0c0b12 0%, #08070d 60%, #050409 100%);
    color: var(--text, #eae6f5);
  }
  [data-theme="sepia"] .p3-root {
    background:
      radial-gradient(120% 80% at 50% 120%, rgba(240,234,216,0) 0%, rgba(212,200,170,0.55) 100%),
      linear-gradient(to bottom, #e7ddc4 0%, #ddd0b2 60%, #d2c39d 100%);
    color: var(--text, #2c1f0e);
  }

  /* the row of three portals */
  .p3-nave {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;          /* arches bottom-aligned */
    justify-content: center;
    gap: clamp(14px, 2.6vw, 40px);
    width: 100%;
    height: 100%;
    padding: 0 clamp(16px, 4vw, 64px) 0;
    box-sizing: border-box;
  }

  /* ── A single arched doorway ── */
  .p3-arch {
    position: relative;
    flex: 1 1 0;
    max-width: 460px;
    align-self: flex-end;
    height: 78%;                    /* side arches */
    display: flex;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    /* gothic-ish rounded top, square base — the doorway silhouette */
    border-radius: 50% 50% 0 0 / 28% 28% 0 0;
    border: 1.25px solid rgba(var(--p3-rgb), 0.34);
    border-bottom: none;

    /* lit-from-within interior + backlit inset */
    background:
      radial-gradient(75% 55% at 50% 86%, rgba(var(--p3-rgb), 0.10) 0%, rgba(var(--p3-rgb), 0) 70%),
      linear-gradient(to bottom, rgba(255,255,255,0.012) 0%, rgba(0,0,0,0.34) 100%);
    box-shadow:
      inset 0 0 60px rgba(var(--p3-rgb), 0.06),
      inset 0 2px 0 rgba(var(--p3-rgb), 0.10),
      0 0 0 1px rgba(0,0,0,0.3);
    overflow: hidden;
    transition: background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, transform 0.35s ease;
  }
  [data-theme="sepia"] .p3-arch {
    border-color: rgba(var(--p3-rgb), 0.5);
    background:
      radial-gradient(75% 55% at 50% 86%, rgba(var(--p3-rgb), 0.16) 0%, rgba(var(--p3-rgb), 0) 70%),
      linear-gradient(to bottom, rgba(255,255,255,0.10) 0%, rgba(70,52,20,0.14) 100%);
    box-shadow:
      inset 0 0 60px rgba(var(--p3-rgb), 0.10),
      inset 0 2px 0 rgba(255,255,255,0.22),
      0 0 0 1px rgba(120,96,52,0.18);
  }

  /* the center portal — throne / seat of being — stands taller */
  .p3-arch.p3-center { height: 92%; }

  /* faint vertical light shaft falling through each doorway */
  .p3-arch::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 46%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 0;
    background: linear-gradient(
      to bottom,
      rgba(var(--p3-rgb), 0.07) 0%,
      rgba(var(--p3-rgb), 0.02) 38%,
      rgba(var(--p3-rgb), 0) 80%
    );
    opacity: 0.7;
    transition: opacity 0.35s ease;
  }

  /* ── glowing emblem + halo, behind the title ── */
  .p3-glow {
    position: absolute;
    left: 50%;
    bottom: 14%;
    width: 70%;
    aspect-ratio: 1 / 1;
    transform: translateX(-50%);
    z-index: 1;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: transform;
    animation: p3-breathe var(--p3-dur, 7.5s) ease-in-out infinite;
    animation-delay: var(--p3-delay, 0s);
  }
  /* soft radial halo behind the emblem */
  .p3-halo {
    position: absolute;
    inset: -14%;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(var(--p3-rgb), 0.55) 0%,
      rgba(var(--p3-rgb), 0.22) 34%,
      rgba(var(--p3-rgb), 0) 68%
    );
    opacity: 0.26;
    filter: blur(2px);
    will-change: opacity;
    animation: p3-pulse var(--p3-dur, 7.5s) ease-in-out infinite;
    animation-delay: var(--p3-delay, 0s);
    transition: opacity 0.35s ease, filter 0.35s ease;
  }
  .p3-emblem {
    position: relative;
    width: 100%;
    height: 100%;
    color: var(--p3-color);
    opacity: 0.42;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.35s ease;
  }
  .p3-emblem svg { width: 100%; height: 100%; }

  @keyframes p3-breathe {
    0%, 100% { transform: translateX(-50%) scale(1.0); }
    50%      { transform: translateX(-50%) scale(1.05); }
  }
  @keyframes p3-pulse {
    0%, 100% { opacity: 0.18; }
    50%      { opacity: 0.34; }
  }

  /* ── carved title block, lower-middle of the arch, above the emblem ── */
  .p3-text {
    position: relative;
    z-index: 3;
    margin-top: auto;
    width: 100%;
    padding: 0 9% 14%;
    box-sizing: border-box;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .p3-kicker {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: var(--p3-color);
    opacity: 0.66;
    margin-bottom: 14px;
  }
  .p3-title {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(24px, 3vw, 38px);
    line-height: 1.06;
    letter-spacing: -0.012em;
    margin: 0;
    color: var(--text, #f1edfb);
    /* carved / lit-edge feel */
    text-shadow:
      0 1px 0 rgba(0,0,0,0.55),
      0 0 20px rgba(var(--p3-rgb), 0.22);
  }
  [data-theme="sepia"] .p3-title {
    color: var(--text, #2c1f0e);
    text-shadow:
      0 1px 0 rgba(255,255,255,0.5),
      0 0 18px rgba(var(--p3-rgb), 0.2);
  }
  .p3-arch.p3-center .p3-title { font-size: clamp(27px, 3.4vw, 43px); }

  .p3-tagline {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-muted, #8f89a0);
    margin: 12px 0 0;
    max-width: 28ch;
  }

  /* enter affordance at the threshold */
  .p3-enter {
    margin-top: 18px;
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--p3-color);
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.35s ease, transform 0.35s ease, letter-spacing 0.35s ease;
  }

  /* ── HOVER: the door opens to light ── */
  .p3-arch:hover {
    border-color: rgba(var(--p3-rgb), 0.85);
    background:
      radial-gradient(75% 58% at 50% 84%, rgba(var(--p3-rgb), 0.22) 0%, rgba(var(--p3-rgb), 0) 70%),
      linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.26) 100%);
    box-shadow:
      inset 0 0 90px rgba(var(--p3-rgb), 0.18),
      inset 0 2px 0 rgba(var(--p3-rgb), 0.4),
      0 0 34px rgba(var(--p3-rgb), 0.22);
  }
  [data-theme="sepia"] .p3-arch:hover {
    background:
      radial-gradient(75% 58% at 50% 84%, rgba(var(--p3-rgb), 0.3) 0%, rgba(var(--p3-rgb), 0) 70%),
      linear-gradient(to bottom, rgba(255,255,255,0.16) 0%, rgba(70,52,20,0.12) 100%);
    box-shadow:
      inset 0 0 90px rgba(var(--p3-rgb), 0.26),
      inset 0 2px 0 rgba(255,255,255,0.4),
      0 0 34px rgba(var(--p3-rgb), 0.3);
  }
  .p3-arch:hover::before { opacity: 1; }
  .p3-arch:hover .p3-emblem { opacity: 0.72; }
  .p3-arch:hover .p3-halo {
    opacity: 0.5;
    filter: blur(1px);
  }
  .p3-arch:hover .p3-enter {
    opacity: 0.95;
    transform: translateY(0);
    letter-spacing: 0.3em;
  }

  /* ── Narrow screens: stack the arches vertically, equal heights ── */
  @media (max-width: 820px) {
    .p3-root { height: auto; min-height: calc(100vh - 80px); overflow: visible; }
    .p3-nave {
      flex-direction: column;
      align-items: center;
      gap: 26px;
      padding: 28px clamp(16px, 6vw, 48px) 40px;
      height: auto;
    }
    .p3-arch,
    .p3-arch.p3-center {
      width: 100%;
      max-width: 520px;
      height: auto;
      min-height: 42vh;
    }
    .p3-glow { bottom: 18%; width: 60%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .p3-glow, .p3-halo { animation: none; }
  }
`;

// per-arch breathing tuning so the three doorways pulse out of phase
const BREATH: Record<string, { dur: string; delay: string }> = {
  influence:   { dur: "7s", delay: "0s" },
  sovereignty: { dur: "9s", delay: "-3s" },
  craftsman:   { dur: "8s", delay: "-5.5s" },
};

export default function Prototype3Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: P3_STYLES }} />
      <NavG active="The Council" />

      <main className="p3-root">
        <div className="p3-nave">
          {COUNCILS.map((c) => {
            const breath = BREATH[c.key] ?? { dur: "8s", delay: "0s" };
            const isCenter = c.key === "sovereignty";
            return (
              <Link
                key={c.key}
                href={`/council/${c.key}`}
                aria-label={c.name}
                className={`p3-arch${isCenter ? " p3-center" : ""}`}
                style={
                  {
                    "--p3-color": c.color,
                    "--p3-rgb": c.colorRgb,
                    "--p3-dur": breath.dur,
                    "--p3-delay": breath.delay,
                  } as React.CSSProperties
                }
              >
                {/* glowing emblem + halo, lit behind the title */}
                <div className="p3-glow">
                  <span className="p3-halo" />
                  <span className="p3-emblem">
                    <Emblem kind={c.emblem} style={{ width: "100%", height: "100%" }} />
                  </span>
                </div>

                {/* carved title at the threshold */}
                <div className="p3-text">
                  <div className="p3-kicker">{c.mode}</div>
                  <h2 className="p3-title">{c.name}</h2>
                  <p className="p3-tagline">{c.tagline}</p>
                  <span className="p3-enter">↟ Enter</span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
