import Link from "next/link";
import NavG from "@/components/NavG";
import { SOVEREIGNTY as C } from "@/lib/council-data";
import { Emblem } from "@/components/council/CouncilEmblems";

// ─── Council-page prototype 2 — "Illuminated Index" ─────────────────────────
// One council (Sovereignty), its three seats, rendered as an asymmetric
// editorial index. A sticky LEFT identity rail (the frontispiece — crown
// emblem, mode kicker, council name, tagline, convene note) sits beside a
// RIGHT list of three large numbered ENTRIES separated by gold hairlines.
// Server component — pure CSS motion, so no "use client". Void/sepia skin;
// one accent (gold), deepened for the cream theme so it reads on parchment.

const STYLES = `
  /* ── Root + theme tokens ───────────────────────────────────────────── */
  .cp2-root {
    position: relative;
    min-height: 100vh;
    background: #0e0d14;
    color: #eae6f5;
    overflow: clip;
    --ac: #e8b86a;
    --acrgb: 232,184,106;
    --cp2-ink: #eae6f5;
    --cp2-muted: #8a849a;
    --cp2-dim: #494456;
    --cp2-hair: rgba(255,255,255,0.08);
  }
  [data-theme="sepia"] .cp2-root {
    background: #f0ead8;
    color: #2c1f0e;
    --ac: #9a6f1e;
    --acrgb: 154,111,30;
    --cp2-ink: #2c1f0e;
    --cp2-muted: #6f6048;
    --cp2-dim: #b0a07c;
    --cp2-hair: rgba(44,31,14,0.12);
  }

  /* faint gold radial glow + hairline atmosphere */
  .cp2-ambient {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(680px 560px at 22% 6%, rgba(var(--acrgb), 0.10), transparent 70%),
      radial-gradient(760px 620px at 92% 94%, rgba(var(--acrgb), 0.05), transparent 72%);
  }
  [data-theme="sepia"] .cp2-ambient {
    background:
      radial-gradient(680px 560px at 22% 6%, rgba(var(--acrgb), 0.12), transparent 70%),
      radial-gradient(760px 620px at 92% 94%, rgba(var(--acrgb), 0.06), transparent 72%);
  }

  .cp2-shell {
    position: relative;
    z-index: 2;
    max-width: 1180px;
    margin: 0 auto;
    padding: 40px clamp(20px, 5vw, 64px) 160px;
  }

  /* ── Back link ─────────────────────────────────────────────────────── */
  .cp2-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--cp2-dim);
    text-decoration: none;
    margin-bottom: 56px;
    transition: color 0.2s, gap 0.2s;
  }
  .cp2-back:hover { color: var(--ac); gap: 14px; }
  .cp2-back:focus-visible { outline: 1px solid rgba(var(--acrgb),0.5); outline-offset: 4px; border-radius: 2px; }

  /* ── Asymmetric split ──────────────────────────────────────────────── */
  .cp2-split {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 56px;
  }
  @media (min-width: 860px) {
    .cp2-split {
      grid-template-columns: 38% minmax(0, 62%);
      gap: clamp(48px, 6vw, 88px);
      align-items: start;
    }
  }

  /* ── LEFT identity rail (frontispiece) ─────────────────────────────── */
  .cp2-rail { position: relative; }
  @media (min-width: 860px) {
    .cp2-rail { position: sticky; top: 96px; }
  }
  .cp2-emblem {
    color: var(--ac);
    opacity: 0.95;
    margin-bottom: 30px;
    filter: drop-shadow(0 0 24px rgba(var(--acrgb), 0.24));
  }
  .cp2-kicker {
    font-family: var(--font-jetbrains), monospace;
    font-size: 11px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--ac);
    margin: 0 0 20px;
  }
  .cp2-name {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: clamp(46px, 6vw, 72px);
    line-height: 0.98;
    letter-spacing: -0.02em;
    color: var(--cp2-ink);
    margin: 0 0 24px;
    text-wrap: balance;
  }
  .cp2-tagline {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(20px, 2.6vw, 26px);
    line-height: 1.34;
    color: var(--cp2-muted);
    margin: 0 0 32px;
    max-width: 26ch;
    text-wrap: pretty;
  }
  [data-theme="sepia"] .cp2-tagline { color: #5c4a2a; }
  .cp2-rail-hair {
    height: 1px;
    width: 100%;
    background: linear-gradient(90deg, rgba(var(--acrgb),0.5), var(--cp2-hair) 60%, transparent);
    margin-bottom: 28px;
  }
  .cp2-convene {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 15px;
    line-height: 1.66;
    color: var(--cp2-muted);
    margin: 0;
    max-width: 38ch;
    text-wrap: pretty;
  }

  /* ── RIGHT seat list ───────────────────────────────────────────────── */
  .cp2-entries {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid rgba(var(--acrgb), 0.28);
  }
  .cp2-entry {
    position: relative;
    display: block;
    text-decoration: none;
    padding: 40px 8px 40px 26px;
    border-bottom: 1px solid rgba(var(--acrgb), 0.28);
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1),
                background 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  /* growing accent rule on the left */
  .cp2-entry::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    height: 0;
    width: 2px;
    background: var(--ac);
    box-shadow: 0 0 10px rgba(var(--acrgb), 0.55);
    transform: translateY(-50%);
    transition: height 0.5s cubic-bezier(0.16,1,0.3,1);
  }
  .cp2-entry:hover,
  .cp2-entry:focus-visible {
    transform: translateX(6px);
    background: rgba(var(--acrgb), 0.05);
    outline: none;
  }
  .cp2-entry:hover::before,
  .cp2-entry:focus-visible::before { height: 78%; }

  .cp2-entry-grid {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: clamp(18px, 3vw, 36px);
    align-items: baseline;
  }
  .cp2-num {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: clamp(40px, 5.5vw, 60px);
    line-height: 0.9;
    letter-spacing: -0.02em;
    color: var(--ac);
    opacity: 0.42;
    font-variant-numeric: tabular-nums;
    transition: opacity 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .cp2-entry:hover .cp2-num,
  .cp2-entry:focus-visible .cp2-num { opacity: 1; }

  .cp2-entry-name {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: clamp(30px, 4vw, 42px);
    line-height: 1.02;
    letter-spacing: -0.018em;
    color: var(--cp2-ink);
    margin: 0 0 10px;
    text-wrap: balance;
    transition: color 0.3s;
  }
  .cp2-entry:hover .cp2-entry-name,
  .cp2-entry:focus-visible .cp2-entry-name { color: var(--ac); }

  .cp2-seat {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--cp2-muted);
    margin: 0 0 22px;
  }
  .cp2-seat .cp2-living {
    color: var(--ac);
    letter-spacing: 0.12em;
  }

  .cp2-question {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(19px, 2.3vw, 24px);
    line-height: 1.32;
    color: var(--cp2-ink);
    margin: 0 0 18px;
    max-width: 34ch;
    text-wrap: balance;
  }
  [data-theme="sepia"] .cp2-question { color: #3c2e18; }

  .cp2-blurb {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 16px;
    line-height: 1.66;
    color: var(--cp2-muted);
    margin: 0 0 22px;
    max-width: 56ch;
    text-wrap: pretty;
  }

  .cp2-cue {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ac);
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.4s cubic-bezier(0.16,1,0.3,1),
                transform 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .cp2-entry:hover .cp2-cue,
  .cp2-entry:focus-visible .cp2-cue {
    opacity: 1;
    transform: translateX(0);
  }

  /* ── Load motion: rail rises, entries cascade ──────────────────────── */
  .cp2-rise {
    opacity: 0;
    transform: translateY(10px);
    animation: cp2Rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .cp2-rail-rise { animation-delay: 0.04s; }
  .cp2-e1 { animation-delay: 0.22s; }
  .cp2-e2 { animation-delay: 0.34s; }
  .cp2-e3 { animation-delay: 0.46s; }
  @keyframes cp2Rise {
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .cp2-rise { animation: none; opacity: 1; transform: none; }
    .cp2-entry { transition: background 0.2s; }
    .cp2-entry:hover, .cp2-entry:focus-visible { transform: none; }
    .cp2-cue { transition: opacity 0.2s; }
  }
`;

function pad(n: number) {
  return String(n + 1).padStart(2, "0");
}

export default function CouncilPagePrototype2() {
  return (
    <>
      <NavG active="The Council" />
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="cp2-root">
        <div className="cp2-ambient" />

        <div className="cp2-shell">
          <Link href="/council" className="cp2-back">
            ← The Council
          </Link>

          <div className="cp2-split">
            {/* ── LEFT identity rail (frontispiece) ───────────────── */}
            <aside className="cp2-rail cp2-rise cp2-rail-rise" aria-label="Council frontispiece">
              <div className="cp2-emblem" aria-hidden="true">
                <Emblem kind={C.emblem} width={104} height={104} />
              </div>
              <p className="cp2-kicker">{C.mode}</p>
              <h1 className="cp2-name">{C.name}</h1>
              <p className="cp2-tagline">{C.tagline}</p>
              <div className="cp2-rail-hair" aria-hidden="true" />
              <p className="cp2-convene">{C.convene}</p>
            </aside>

            {/* ── RIGHT seat list ─────────────────────────────────── */}
            <ol className="cp2-entries">
              {C.members.map((m, i) => (
                <li key={m.slug}>
                  <Link
                    href={`/council/sovereignty/${m.slug}`}
                    className={`cp2-entry cp2-rise cp2-e${i + 1}`}
                  >
                    <div className="cp2-entry-grid">
                      <span className="cp2-num" aria-hidden="true">{pad(i)}</span>
                      <div>
                        <h2 className="cp2-entry-name">{m.name}</h2>
                        <p className="cp2-seat">
                          {m.seat}
                          {m.living && <span className="cp2-living">· living</span>}
                        </p>
                        <p className="cp2-question">{m.question}</p>
                        <p className="cp2-blurb">{m.blurb}</p>
                        <span className="cp2-cue">enter →</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
