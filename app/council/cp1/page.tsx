import Link from "next/link";
import NavG from "@/components/NavG";
import { SOVEREIGNTY as C } from "@/lib/council-data";
import { Emblem } from "@/components/council/CouncilEmblems";

// ─── Council Prototype 1 — "Altar Triptych" ──────────────────────────────────
// ONE council (Sovereignty) and its three member seats, rendered as a reverent,
// symmetrical three-panel altarpiece. Server component, pure CSS. All custom
// classes are prefixed `cp1-`. Dark/void is the default; parchment via
// [data-theme="sepia"]. Accent is GOLD — brighter in void, deeper in parchment.

const NUMERALS = ["I", "II", "III"] as const;

const CP1_STYLES = `
  .cp1-root {
    --ac: #e8b86a;
    --ac-rgb: ${C.colorRgb};
    min-height: calc(100vh - 80px);
    background: #0e0d14;
    color: #eae6f5;
    --cp1-ink: #eae6f5;
    --cp1-muted: #8a849a;
    --cp1-dim: #494456;
    --cp1-hair: rgba(255,255,255,0.08);
    --cp1-wash: rgba(232,184,106,0.06);
    --emblem-bg: #0e0d14;
    position: relative;
    overflow: hidden;
    padding: 0 0 8px;
  }
  [data-theme="sepia"] .cp1-root {
    --ac: #9a6f1e;
    --ac-rgb: 154,111,30;
    background: #f0ead8;
    color: #2c1f0e;
    --cp1-ink: #2c1f0e;
    --cp1-muted: #6f6048;
    --cp1-dim: #9a8b6f;
    --cp1-hair: rgba(44,31,14,0.12);
    --cp1-wash: rgba(154,111,30,0.07);
    --emblem-bg: #f0ead8;
  }

  /* faint gold radial glow behind the header */
  .cp1-glow {
    position: absolute;
    top: -180px;
    left: 50%;
    width: 900px;
    height: 620px;
    transform: translateX(-50%);
    background: radial-gradient(
      ellipse at center,
      rgba(var(--ac-rgb), 0.13) 0%,
      rgba(var(--ac-rgb), 0.05) 38%,
      rgba(var(--ac-rgb), 0) 70%
    );
    pointer-events: none;
    z-index: 0;
  }
  [data-theme="sepia"] .cp1-glow {
    background: radial-gradient(
      ellipse at center,
      rgba(var(--ac-rgb), 0.10) 0%,
      rgba(var(--ac-rgb), 0.04) 40%,
      rgba(var(--ac-rgb), 0) 72%
    );
  }

  .cp1-inner {
    position: relative;
    z-index: 1;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 32px;
  }

  /* ── Back link ── */
  .cp1-back {
    display: inline-block;
    margin: 28px 0 0;
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--cp1-dim);
    text-decoration: none;
    transition: color 0.3s ease;
  }
  .cp1-back:hover { color: var(--ac); }

  /* ── Header ── */
  .cp1-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 0 8px;
    opacity: 0;
    transform: translateY(16px);
    animation: cp1-rise 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
  }

  .cp1-emblem {
    width: 110px;
    height: 110px;
    color: var(--ac);
    filter: drop-shadow(0 0 22px rgba(var(--ac-rgb), 0.4));
    margin-bottom: 24px;
  }
  .cp1-emblem svg { width: 100%; height: 100%; }

  .cp1-mode {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.36em;
    text-transform: uppercase;
    color: var(--ac);
    opacity: 0.72;
    margin-bottom: 16px;
  }

  .cp1-name {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(36px, 5vw, 60px);
    line-height: 1.04;
    letter-spacing: -0.015em;
    color: var(--cp1-ink);
    margin: 0;
    text-wrap: balance;
  }

  .cp1-tagline {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(16px, 2vw, 20px);
    line-height: 1.5;
    color: var(--cp1-muted);
    margin: 18px 0 0;
    max-width: 38ch;
    text-wrap: balance;
  }

  /* ── Ornamental rule with center glyph ── */
  .cp1-rule {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    margin: 40px 0 8px;
  }
  .cp1-rule-line {
    height: 1px;
    width: clamp(80px, 22vw, 240px);
    background: linear-gradient(
      to var(--cp1-dir, right),
      rgba(var(--ac-rgb), 0) 0%,
      rgba(var(--ac-rgb), 0.55) 100%
    );
  }
  .cp1-rule-line.cp1-rl-right { --cp1-dir: left; }
  .cp1-rule-glyph {
    font-family: var(--font-fraunces), Georgia, serif;
    font-size: 13px;
    color: var(--ac);
    opacity: 0.85;
    line-height: 1;
  }

  /* ── Triptych ── */
  .cp1-triptych {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin: 24px 0 0;
    border-top: 1px solid var(--cp1-hair);
    border-bottom: 1px solid var(--cp1-hair);
  }

  .cp1-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 56px 36px 48px;
    text-decoration: none;
    overflow: hidden;
    border-right: 1px solid rgba(var(--ac-rgb), 0.18);
    transition: background 0.5s cubic-bezier(0.16,1,0.3,1),
                transform 0.5s cubic-bezier(0.16,1,0.3,1);
    -webkit-tap-highlight-color: transparent;
    opacity: 0;
    transform: translateY(20px);
    animation: cp1-rise 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  .cp1-panel:last-child { border-right: none; }

  .cp1-panel:hover {
    background: var(--cp1-wash);
    transform: translateY(-6px);
  }

  /* watermark Roman numeral */
  .cp1-numeral {
    position: absolute;
    top: 22px;
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 92px;
    line-height: 1;
    color: var(--ac);
    opacity: 0.10;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
    user-select: none;
    transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1);
    z-index: 0;
  }
  .cp1-panel:hover .cp1-numeral { opacity: 0.22; }

  /* top flourish */
  .cp1-flourish {
    position: relative;
    z-index: 1;
    width: 30px;
    height: 1px;
    background: rgba(var(--ac-rgb), 0.5);
    margin-bottom: 28px;
  }

  .cp1-carries {
    position: relative;
    z-index: 1;
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--ac);
    opacity: 0.75;
    margin-bottom: 16px;
  }

  .cp1-membername {
    position: relative;
    z-index: 1;
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(28px, 3vw, 38px);
    line-height: 1.06;
    letter-spacing: -0.01em;
    color: var(--cp1-ink);
    margin: 0;
    text-wrap: balance;
  }

  .cp1-seat {
    position: relative;
    z-index: 1;
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 13px;
    line-height: 1.4;
    color: var(--cp1-muted);
    margin: 12px 0 0;
    max-width: 24ch;
  }

  .cp1-q {
    position: relative;
    z-index: 1;
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(17px, 1.8vw, 20px);
    line-height: 1.45;
    color: var(--ac);
    margin: 28px 0;
    max-width: 28ch;
    text-wrap: pretty;
  }
  [data-theme="sepia"] .cp1-q { color: var(--ac); }

  .cp1-blurb {
    position: relative;
    z-index: 1;
    font-family: var(--font-newsreader), Georgia, serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.62;
    color: var(--cp1-muted);
    margin: 0;
    max-width: 32ch;
    text-wrap: pretty;
  }

  .cp1-living {
    display: inline-block;
    margin-left: 8px;
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ac);
    opacity: 0.6;
    vertical-align: middle;
  }

  /* bottom flourish + enter cue */
  .cp1-foot {
    position: relative;
    z-index: 1;
    margin-top: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .cp1-flourish-b {
    width: 30px;
    height: 1px;
    background: rgba(var(--ac-rgb), 0.5);
    transition: width 0.5s cubic-bezier(0.16,1,0.3,1),
                background 0.5s cubic-bezier(0.16,1,0.3,1);
  }
  .cp1-panel:hover .cp1-flourish-b {
    width: 54px;
    background: rgba(var(--ac-rgb), 0.85);
  }
  .cp1-enter {
    font-family: var(--font-jetbrains), 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ac);
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1),
                transform 0.5s cubic-bezier(0.16,1,0.3,1),
                letter-spacing 0.5s cubic-bezier(0.16,1,0.3,1);
  }
  .cp1-panel:hover .cp1-enter {
    opacity: 0.95;
    transform: translateY(0);
    letter-spacing: 0.28em;
  }

  /* ── Footer ── */
  .cp1-convene {
    text-align: center;
    max-width: 56ch;
    margin: 48px auto 36px;
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 15px;
    line-height: 1.6;
    color: var(--cp1-muted);
    text-wrap: pretty;
  }
  .cp1-footrule {
    height: 1px;
    width: 100%;
    max-width: 1240px;
    margin: 0 auto;
    background: var(--cp1-hair);
  }

  /* ── Staggered rise ── */
  @keyframes cp1-rise {
    to { opacity: 1; transform: translateY(0); }
  }
  .cp1-header { animation-delay: 0.05s; }
  .cp1-panel.cp1-d0 { animation-delay: 0.28s; }
  .cp1-panel.cp1-d1 { animation-delay: 0.40s; }
  .cp1-panel.cp1-d2 { animation-delay: 0.52s; }

  /* ── Responsive: stack to one column with horizontal rules ── */
  @media (max-width: 760px) {
    .cp1-triptych {
      grid-template-columns: 1fr;
    }
    .cp1-panel {
      border-right: none;
      border-bottom: 1px solid rgba(var(--ac-rgb), 0.18);
      padding: 52px 28px 44px;
    }
    .cp1-panel:last-child { border-bottom: none; }
    .cp1-rule-line { width: clamp(50px, 26vw, 160px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .cp1-header,
    .cp1-panel {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }
`;

export default function CouncilPrototype1Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CP1_STYLES }} />
      <NavG active="The Council" />

      <main
        className="cp1-root"
        style={{ "--ac-rgb": C.colorRgb } as React.CSSProperties}
      >
        <div className="cp1-glow" aria-hidden="true" />

        <div className="cp1-inner">
          <Link href="/council" className="cp1-back">
            ← The Council
          </Link>

          {/* ── Altar header ── */}
          <header className="cp1-header">
            <div className="cp1-emblem" aria-hidden="true">
              <Emblem kind={C.emblem} />
            </div>
            <div className="cp1-mode">{C.mode}</div>
            <h1 className="cp1-name">{C.name}</h1>
            <p className="cp1-tagline">{C.tagline}</p>

            <div className="cp1-rule" aria-hidden="true">
              <span className="cp1-rule-line" />
              <span className="cp1-rule-glyph">◆</span>
              <span className="cp1-rule-line cp1-rl-right" />
            </div>
          </header>
        </div>

        {/* ── Triptych of three seats ── */}
        <div className="cp1-inner">
          <div className="cp1-triptych">
            {C.members.map((m, i) => (
              <Link
                key={m.slug}
                href={`/council/sovereignty/${m.slug}`}
                aria-label={`Enter the seat of ${m.name}`}
                className={`cp1-panel cp1-d${i}`}
              >
                <span className="cp1-numeral" aria-hidden="true">
                  {NUMERALS[i]}
                </span>

                <span className="cp1-flourish" aria-hidden="true" />

                <div className="cp1-carries">{m.carries}</div>

                <h2 className="cp1-membername">
                  {m.name}
                  {m.living && <span className="cp1-living">living</span>}
                </h2>

                <p className="cp1-seat">{m.seat}</p>

                <p className="cp1-q">{m.question}</p>

                <p className="cp1-blurb">{m.blurb}</p>

                <div className="cp1-foot">
                  <span className="cp1-flourish-b" aria-hidden="true" />
                  <span className="cp1-enter">enter the seat →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="cp1-inner">
          <p className="cp1-convene">{C.convene}</p>
        </div>
        <div className="cp1-footrule" aria-hidden="true" />
      </main>
    </>
  );
}
