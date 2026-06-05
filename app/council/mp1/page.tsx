import Link from "next/link";
import NavG from "@/components/NavG";
import { RASPUTIN as M } from "@/lib/council-dossiers";
import { Emblem } from "@/components/council/CouncilEmblems";

// ─── Member-page prototype 1 — "Editorial Spread" ───────────────────────────
// A long-form dossier for a single Inner Council member, set as a magazine
// profile: asymmetric masthead, oversized Fraunces-italic pull-quote of the
// seat's QUESTION, a drop-cap opening, numbered signature moves, a fact
// sidebar, and a refined cautions callout. Server component — pure CSS motion,
// so no "use client". On-brand void/sepia skin; one accent (the member color).

const STYLES = `
  /* ── Root + atmosphere ─────────────────────────────────────────────── */
  .mp1-root {
    position: relative;
    min-height: 100vh;
    background: #0e0d14;
    color: #eae6f5;
    overflow: clip;
    --mp1-ink: #eae6f5;
    --mp1-muted: #8a849a;
    --mp1-dim: #494456;
    --mp1-hair: rgba(255,255,255,0.07);
    --mp1-panel: rgba(255,255,255,0.025);
  }
  [data-theme="sepia"] .mp1-root {
    background: #f0ead8;
    color: #2c1f0e;
    --mp1-ink: #2c1f0e;
    --mp1-muted: #8b7355;
    --mp1-dim: #b0a07c;
    --mp1-hair: rgba(60,42,20,0.12);
    --mp1-panel: rgba(60,42,20,0.035);
  }

  /* faint accent radial glow behind the content */
  .mp1-ambient {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(620px 520px at 78% 4%, rgba(var(--acrgb), 0.10), transparent 70%),
      radial-gradient(820px 680px at 18% 96%, rgba(var(--acrgb), 0.05), transparent 72%);
  }
  [data-theme="sepia"] .mp1-ambient {
    background:
      radial-gradient(620px 520px at 78% 4%, rgba(var(--acrgb), 0.13), transparent 70%),
      radial-gradient(820px 680px at 18% 96%, rgba(var(--acrgb), 0.07), transparent 72%);
  }

  .mp1-shell {
    position: relative;
    z-index: 2;
    max-width: 880px;
    margin: 0 auto;
    padding: 48px clamp(20px, 5vw, 64px) 168px;
  }

  /* ── Back link (mono, hover beyond color) ──────────────────────────── */
  .mp1-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--mp1-dim);
    text-decoration: none;
    margin-bottom: 56px;
    transition: color 0.2s, gap 0.2s, opacity 0.2s;
  }
  .mp1-back:hover { color: var(--ac); gap: 14px; }
  .mp1-back:focus-visible { outline: 1px solid rgba(var(--acrgb),0.5); outline-offset: 4px; border-radius: 2px; }

  /* ── Kicker line ───────────────────────────────────────────────────── */
  .mp1-kicker {
    font-family: var(--font-jetbrains), monospace;
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ac);
    margin-bottom: 20px;
  }

  /* ── Masthead (asymmetric) ─────────────────────────────────────────── */
  .mp1-masthead {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 24px;
    padding-bottom: 40px;
    border-bottom: 1px solid var(--mp1-hair);
  }
  .mp1-name {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: clamp(56px, 9vw, 84px);
    line-height: 0.96;
    letter-spacing: -0.02em;
    margin: 0 0 18px;
    color: var(--mp1-ink);
    text-wrap: balance;
  }
  .mp1-standfirst {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: clamp(18px, 2.4vw, 23px);
    line-height: 1.4;
    font-weight: 400;
    color: var(--mp1-muted);
    max-width: 30ch;
    margin: 0 0 24px;
    text-wrap: pretty;
  }
  [data-theme="sepia"] .mp1-standfirst { color: #5c4a2a; }
  .mp1-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ac);
    padding: 7px 14px;
    border: 1px solid rgba(var(--acrgb), 0.4);
    border-radius: 999px;
    background: rgba(var(--acrgb), 0.06);
  }
  .mp1-chip::before {
    content: "";
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--ac);
    box-shadow: 0 0 8px rgba(var(--acrgb), 0.8);
  }

  /* emblem bleeding slightly off-center to the right */
  .mp1-emblem {
    color: var(--ac);
    margin-right: -16px;
    margin-top: 4px;
    opacity: 0.92;
    flex-shrink: 0;
    filter: drop-shadow(0 0 22px rgba(var(--acrgb), 0.22));
  }

  /* ── Question pull-band ────────────────────────────────────────────── */
  .mp1-questionband {
    position: relative;
    margin: 64px 0 56px;
    padding: 8px 0 8px 8px;
  }
  .mp1-question {
    position: relative;
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(30px, 5.2vw, 52px);
    line-height: 1.08;
    letter-spacing: -0.015em;
    color: var(--mp1-ink);
    max-width: 18ch;
    text-wrap: balance;
    margin: 0;
  }
  .mp1-question .mp1-q-mark {
    position: absolute;
    top: -0.42em;
    left: -0.5em;
    font-size: 1.9em;
    line-height: 1;
    color: var(--ac);
    opacity: 0.32;
    pointer-events: none;
    user-select: none;
  }
  .mp1-question-eyebrow {
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--mp1-muted);
    margin: 0 0 22px;
  }

  /* ── Body layout ───────────────────────────────────────────────────── */
  .mp1-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 56px;
  }
  @media (min-width: 940px) {
    .mp1-body {
      grid-template-columns: minmax(0, 1fr) 232px;
      gap: 64px;
      align-items: start;
    }
  }

  .mp1-column { max-width: 66ch; }

  .mp1-section { margin-bottom: 52px; }
  .mp1-section:last-child { margin-bottom: 0; }

  .mp1-label {
    display: flex;
    align-items: center;
    gap: 14px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--mp1-muted);
    margin: 0 0 22px;
  }
  .mp1-label::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--mp1-hair);
  }
  .mp1-label .mp1-label-idx { color: var(--ac); }

  .mp1-p {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 18px;
    line-height: 1.72;
    color: var(--mp1-ink);
    margin: 0 0 20px;
    text-wrap: pretty;
  }
  [data-theme="sepia"] .mp1-p { color: #3c2e18; }
  .mp1-p:last-child { margin-bottom: 0; }

  /* drop cap on the very first body paragraph */
  .mp1-dropcap::first-letter {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: 4.2em;
    line-height: 0.78;
    float: left;
    margin: 0.06em 0.09em 0 0;
    color: var(--ac);
  }

  /* ── Signature moves — numbered list ───────────────────────────────── */
  .mp1-moves {
    list-style: none;
    margin: 0;
    padding: 0;
    counter-reset: mp1move;
  }
  .mp1-move {
    counter-increment: mp1move;
    position: relative;
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 18px;
    align-items: baseline;
    padding: 18px 0;
    border-top: 1px solid var(--mp1-hair);
  }
  .mp1-move:last-child { border-bottom: 1px solid var(--mp1-hair); }
  .mp1-move::before {
    content: counter(mp1move, decimal-leading-zero);
    font-family: var(--font-jetbrains), monospace;
    font-size: 12px;
    letter-spacing: 0.1em;
    color: var(--ac);
    padding-top: 4px;
  }
  .mp1-move-text {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 17px;
    line-height: 1.6;
    color: var(--mp1-ink);
    text-wrap: pretty;
  }
  [data-theme="sepia"] .mp1-move-text { color: #3c2e18; }

  /* ── Pull-quote ────────────────────────────────────────────────────── */
  .mp1-pull {
    margin: 12px 0 4px;
    padding: 6px 0 6px 26px;
    border-left: 2px solid var(--ac);
  }
  .mp1-pull p {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: clamp(22px, 3.4vw, 30px);
    line-height: 1.28;
    letter-spacing: -0.01em;
    color: var(--mp1-ink);
    margin: 0;
    text-wrap: balance;
  }

  /* ── Cautions callout ──────────────────────────────────────────────── */
  .mp1-cautions {
    margin-top: 56px;
    padding: 28px 28px 28px 30px;
    border-left: 3px solid var(--ac);
    border-radius: 2px;
    background: rgba(var(--acrgb), 0.05);
  }
  [data-theme="sepia"] .mp1-cautions { background: rgba(var(--acrgb), 0.07); }
  .mp1-cautions-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ac);
    margin: 0 0 18px;
  }
  .mp1-caution {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 16px;
    line-height: 1.62;
    color: var(--mp1-ink);
    margin: 0 0 16px;
    text-wrap: pretty;
  }
  [data-theme="sepia"] .mp1-caution { color: #3c2e18; }
  .mp1-caution:last-child { margin-bottom: 0; }

  /* ── Meta sidebar ──────────────────────────────────────────────────── */
  .mp1-meta {
    position: relative;
    padding-top: 4px;
  }
  @media (min-width: 940px) {
    .mp1-meta { position: sticky; top: 104px; }
  }
  .mp1-meta-head {
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--mp1-muted);
    padding-bottom: 14px;
    margin-bottom: 4px;
    border-bottom: 1px solid var(--mp1-hair);
  }
  .mp1-meta-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3px;
    padding: 14px 0;
    border-bottom: 1px solid var(--mp1-hair);
  }
  .mp1-meta-k {
    font-family: var(--font-jetbrains), monospace;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--mp1-dim);
  }
  .mp1-meta-v {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 16px;
    line-height: 1.4;
    color: var(--mp1-ink);
  }
  [data-theme="sepia"] .mp1-meta-v { color: #3c2e18; }
  .mp1-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 18px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--mp1-muted);
  }
  .mp1-status::before {
    content: "";
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--mp1-dim);
  }

  /* ── Page-load stagger ─────────────────────────────────────────────── */
  .mp1-stagger {
    opacity: 0;
    transform: translateY(8px);
    animation: mp1Rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .mp1-d1 { animation-delay: 0.04s; }
  .mp1-d2 { animation-delay: 0.16s; }
  .mp1-d3 { animation-delay: 0.30s; }
  .mp1-d4 { animation-delay: 0.42s; }
  @keyframes mp1Rise {
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .mp1-stagger { animation: none; opacity: 1; transform: none; }
    .mp1-back, .mp1-move-link { transition: color 0.2s; }
  }
`;

// Section label → mono index (01, 02, …)
function pad(n: number) {
  return String(n + 1).padStart(2, "0");
}

export default function MemberPagePrototype1() {
  const rootVars = {
    "--ac": M.color,
    "--acrgb": M.colorRgb,
  } as React.CSSProperties;

  const movesSection = M.sections.find((s) => s.label === "Signature Moves");
  const proseSections = M.sections.filter((s) => s.label !== "Signature Moves");

  // index map so labels keep their order-number from the full sections array
  const labelIdx = new Map(M.sections.map((s, i) => [s.label, i]));

  return (
    <>
      <NavG active="The Council" />
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="mp1-root" style={rootVars}>
        <div className="mp1-ambient" />

        <div className="mp1-shell">
          {/* ── Back ─────────────────────────────────────────────── */}
          <Link href="/council/influence" className="mp1-back">
            ← Council of Influence
          </Link>

          {/* ── Masthead ─────────────────────────────────────────── */}
          <header className="mp1-masthead mp1-stagger mp1-d1">
            <div>
              <div className="mp1-kicker">{M.mode} · {M.councilName}</div>
              <h1 className="mp1-name">{M.name}</h1>
              <p className="mp1-standfirst">{M.seatTitle}</p>
              <span className="mp1-chip">Carries · {M.carries}</span>
            </div>
            <div className="mp1-emblem" aria-hidden="true">
              <Emblem kind={M.emblem} width={148} height={148} />
            </div>
          </header>

          {/* ── Question band ────────────────────────────────────── */}
          <section className="mp1-questionband mp1-stagger mp1-d2">
            <p className="mp1-question-eyebrow">The question this seat asks</p>
            <p className="mp1-question">
              <span className="mp1-q-mark" aria-hidden="true">“</span>
              {M.question}
            </p>
          </section>

          {/* ── Body + sidebar ───────────────────────────────────── */}
          <div className="mp1-body">
            <div className="mp1-column mp1-stagger mp1-d3">
              {proseSections.map((section) => {
                const idx = labelIdx.get(section.label) ?? 0;
                const isFirst = section.label === proseSections[0].label;
                return (
                  <section className="mp1-section" key={section.label}>
                    <h2 className="mp1-label">
                      <span className="mp1-label-idx">{pad(idx)}</span>
                      {section.label}
                    </h2>
                    {section.body.map((para, pi) => (
                      <p
                        key={pi}
                        className={`mp1-p${isFirst && pi === 0 ? " mp1-dropcap" : ""}`}
                      >
                        {para}
                      </p>
                    ))}
                  </section>
                );
              })}

              {/* Signature moves — numbered list */}
              {movesSection && (
                <section className="mp1-section">
                  <h2 className="mp1-label">
                    <span className="mp1-label-idx">
                      {pad(labelIdx.get(movesSection.label) ?? 0)}
                    </span>
                    {movesSection.label}
                  </h2>
                  <ol className="mp1-moves">
                    {movesSection.body.map((move, mi) => (
                      <li className="mp1-move" key={mi}>
                        <span className="mp1-move-text">{move}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Pull-quote */}
              <blockquote className="mp1-pull">
                <p>{M.pullQuote}</p>
              </blockquote>

              {/* Cautions */}
              <aside className="mp1-cautions" aria-label="Handling and cautions">
                <p className="mp1-cautions-label">⚠ Handling — warnings welded to the chair</p>
                {M.cautions.map((c, ci) => (
                  <p className="mp1-caution" key={ci}>{c}</p>
                ))}
              </aside>
            </div>

            {/* Meta sidebar */}
            <aside className="mp1-meta mp1-stagger mp1-d4" aria-label="Member facts">
              <div className="mp1-meta-head">Dossier</div>
              {M.meta.map((row) => (
                <div className="mp1-meta-row" key={row.k}>
                  <span className="mp1-meta-k">{row.k}</span>
                  <span className="mp1-meta-v">{row.v}</span>
                </div>
              ))}
              <span className="mp1-status">
                {M.living ? "Living seat" : "Historical seat"}
              </span>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
