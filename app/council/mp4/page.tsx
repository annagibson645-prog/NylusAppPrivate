// app/council/mp4/page.tsx
// Council member dossier — Prototype 4 of 5: "The Seat" (cinematic full-bleed hero).
// Pure CSS load-stagger; no client hooks. Void/sepia themes both supported.

import Link from "next/link";
import NavG from "@/components/NavG";
import { RASPUTIN as M } from "@/lib/council-dossiers";
import { Emblem } from "@/components/council/CouncilEmblems";

const CSS = `
  .mp4-root {
    --ink: #eae6f5;
    --muted: #8a849a;
    --dim: #494456;
    --bg: #0e0d14;
    --hair: rgba(255,255,255,0.07);
    --emblem-bg: #0e0d14;
    background: var(--bg);
    color: var(--ink);
    min-height: 100vh;
    font-family: var(--font-newsreader), Georgia, serif;
    overflow-x: hidden;
  }
  [data-theme="sepia"] .mp4-root {
    --ink: #2c1f0e;
    --muted: #6f6048;
    --dim: #b3a07e;
    --bg: #f0ead8;
    --hair: rgba(44,31,14,0.12);
    --emblem-bg: #f0ead8;
  }

  /* ── HERO ───────────────────────────────────────────── */
  .mp4-hero {
    position: relative;
    min-height: calc(100vh - 80px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 96px 32px 72px;
    overflow: hidden;
  }
  .mp4-glow {
    position: absolute;
    top: 38%; left: 60%;
    width: 90vw; height: 90vw;
    max-width: 1100px; max-height: 1100px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(var(--acrgb),0.22) 0%, rgba(var(--acrgb),0.06) 38%, transparent 68%);
    pointer-events: none;
    z-index: 0;
    animation: mp4-glowIn 2.4s cubic-bezier(0.16,1,0.3,1) both;
  }
  .mp4-emblemWrap {
    position: absolute;
    top: 50%; right: -4vw;
    transform: translateY(-50%);
    color: var(--ac);
    opacity: 0.13;
    z-index: 0;
    pointer-events: none;
    animation: mp4-emblemIn 2.6s cubic-bezier(0.16,1,0.3,1) both;
  }
  .mp4-emblemWrap svg { width: 70vh; height: 70vh; display: block; }
  /* scrim so the question stays legible over the faint emblem */
  .mp4-heroScrim {
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
    background: linear-gradient(90deg, var(--bg) 8%, rgba(14,13,20,0) 70%);
  }
  [data-theme="sepia"] .mp4-heroScrim {
    background: linear-gradient(90deg, var(--bg) 8%, rgba(240,234,216,0) 70%);
  }
  .mp4-heroInner {
    position: relative;
    z-index: 2;
    max-width: 920px;
  }
  .mp4-back {
    display: inline-block;
    font-family: var(--font-jetbrains), monospace;
    font-size: 12px; letter-spacing: 0.08em;
    color: var(--muted); text-decoration: none;
    margin-bottom: 40px;
    transition: color 0.2s, transform 0.2s;
    animation: mp4-rise 0.8s cubic-bezier(0.16,1,0.3,1) both;
    animation-delay: 0.05s;
  }
  .mp4-back:hover { color: var(--ac); transform: translateX(-3px); }

  .mp4-kicker {
    font-family: var(--font-jetbrains), monospace;
    font-size: 12px; letter-spacing: 0.32em; text-transform: uppercase;
    color: var(--ac);
    margin-bottom: 24px;
    animation: mp4-rise 0.9s cubic-bezier(0.16,1,0.3,1) both;
    animation-delay: 0.15s;
  }
  .mp4-name {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic; font-weight: 500;
    font-size: clamp(64px, 11vw, 110px);
    line-height: 0.92;
    letter-spacing: -0.02em;
    margin: 0 0 20px;
    animation: mp4-rise 1s cubic-bezier(0.16,1,0.3,1) both;
    animation-delay: 0.28s;
  }
  .mp4-seatTitle {
    font-family: var(--font-newsreader), serif;
    font-size: clamp(16px, 2.4vw, 22px);
    color: var(--muted);
    margin: 0 0 28px;
    max-width: 640px;
    animation: mp4-rise 1s cubic-bezier(0.16,1,0.3,1) both;
    animation-delay: 0.42s;
  }
  .mp4-chip {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--ac);
    border: 1px solid rgba(var(--acrgb),0.4);
    border-radius: 999px;
    padding: 6px 14px;
    margin-bottom: 44px;
    animation: mp4-rise 1s cubic-bezier(0.16,1,0.3,1) both;
    animation-delay: 0.52s;
  }
  .mp4-chip::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: var(--ac); box-shadow: 0 0 8px rgba(var(--acrgb),0.8);
  }
  .mp4-question {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic; font-weight: 400;
    font-size: clamp(28px, 4.4vw, 52px);
    line-height: 1.16;
    letter-spacing: -0.01em;
    color: var(--ink);
    max-width: 800px;
    margin: 0;
    padding-left: 22px;
    border-left: 3px solid var(--ac);
    animation: mp4-rise 1.1s cubic-bezier(0.16,1,0.3,1) both;
    animation-delay: 0.66s;
  }
  .mp4-scrollCue {
    position: absolute;
    bottom: 28px; left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    font-family: var(--font-jetbrains), monospace;
    font-size: 11px; letter-spacing: 0.3em;
    color: var(--muted);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    animation: mp4-rise 1.2s cubic-bezier(0.16,1,0.3,1) both, mp4-bob 2.6s ease-in-out infinite;
    animation-delay: 1s, 1.6s;
  }
  .mp4-scrollCue span:last-child { font-size: 18px; }

  /* ── META STRIP ─────────────────────────────────────── */
  .mp4-metaStrip {
    position: relative; z-index: 2;
    display: flex; flex-wrap: wrap;
    gap: 0;
    border-top: 1px solid var(--hair);
    border-bottom: 1px solid var(--hair);
    background: rgba(var(--acrgb),0.03);
  }
  .mp4-metaItem {
    flex: 1 1 180px;
    padding: 18px 24px;
    border-right: 1px solid var(--hair);
  }
  .mp4-metaItem:last-child { border-right: none; }
  .mp4-metaK {
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 6px;
  }
  .mp4-metaV {
    font-family: var(--font-newsreader), serif;
    font-size: 15px; color: var(--ink);
  }

  /* ── BODY ───────────────────────────────────────────── */
  .mp4-body {
    position: relative;
    max-width: 860px;
    margin: 0 auto;
    padding: 96px 32px 120px;
  }
  .mp4-spine {
    position: relative;
    border-left: 2px solid rgba(var(--acrgb),0.35);
    padding-left: 40px;
  }
  .mp4-section { margin-bottom: 88px; position: relative; }
  .mp4-section:last-child { margin-bottom: 0; }
  .mp4-secHead {
    display: flex; align-items: baseline; gap: 18px;
    margin-bottom: 28px;
  }
  .mp4-secNum {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-size: clamp(40px, 6vw, 64px);
    line-height: 1;
    color: rgba(var(--acrgb),0.5);
    font-weight: 500;
  }
  .mp4-secLabel {
    font-family: var(--font-jetbrains), monospace;
    font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--ink);
  }
  .mp4-secDot {
    position: absolute;
    left: -49px; top: 24px;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: var(--bg);
    border: 2px solid var(--ac);
    box-shadow: 0 0 0 4px var(--bg);
  }
  .mp4-para {
    font-family: var(--font-newsreader), serif;
    font-size: 18px; line-height: 1.7;
    color: var(--ink);
    margin: 0 0 20px;
    max-width: 66ch;
  }
  .mp4-para:last-child { margin-bottom: 0; }

  /* Signature Moves — bold numbered sequence */
  .mp4-moves { list-style: none; padding: 0; margin: 0; counter-reset: mp4move; }
  .mp4-move {
    counter-increment: mp4move;
    position: relative;
    padding: 22px 0 22px 64px;
    border-bottom: 1px solid var(--hair);
    font-family: var(--font-newsreader), serif;
    font-size: 18px; line-height: 1.55;
    color: var(--ink);
    transition: color 0.2s;
  }
  .mp4-move:last-child { border-bottom: none; }
  .mp4-move::before {
    content: counter(mp4move, decimal-leading-zero);
    position: absolute; left: 0; top: 22px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 14px; font-weight: 600;
    color: var(--ac);
    letter-spacing: 0.05em;
  }
  .mp4-move:hover { color: var(--ac); }

  /* Echoed question */
  .mp4-echo {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-size: clamp(22px, 3vw, 30px);
    line-height: 1.3;
    color: var(--muted);
    margin: 0 0 36px;
    padding-left: 24px;
    border-left: 2px solid rgba(var(--acrgb),0.4);
  }

  /* ── CAUTIONS PANEL ─────────────────────────────────── */
  .mp4-cautions {
    position: relative;
    margin: 8px 0 40px;
    margin-left: -40px;
    padding: 32px 36px 32px 40px;
    background: rgba(var(--acrgb),0.07);
    border: 1px solid rgba(var(--acrgb),0.4);
    border-left: 5px solid var(--ac);
    border-radius: 4px;
  }
  .mp4-cautionsHead {
    font-family: var(--font-jetbrains), monospace;
    font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--ac);
    margin-bottom: 18px;
    display: flex; align-items: center; gap: 10px;
  }
  .mp4-cautionsHead::before { content: '⚠'; font-size: 16px; }
  .mp4-caution {
    font-family: var(--font-newsreader), serif;
    font-size: 17px; line-height: 1.6;
    color: var(--ink);
    margin: 0 0 16px;
    padding-left: 18px;
    border-left: 2px solid rgba(var(--acrgb),0.45);
  }
  .mp4-caution:last-child { margin-bottom: 0; }

  /* ── FOOTER ─────────────────────────────────────────── */
  .mp4-footer {
    border-top: 1px solid var(--hair);
    padding: 40px 32px 80px;
    text-align: center;
  }
  .mp4-pull {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic;
    font-size: clamp(20px, 3vw, 28px);
    line-height: 1.35;
    color: var(--ink);
    max-width: 700px; margin: 0 auto 32px;
  }
  .mp4-footLink {
    display: inline-block;
    font-family: var(--font-jetbrains), monospace;
    font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted); text-decoration: none;
    border: 1px solid var(--hair);
    border-radius: 999px;
    padding: 10px 22px;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
  }
  .mp4-footLink:hover {
    color: var(--ac);
    border-color: rgba(var(--acrgb),0.5);
    background: rgba(var(--acrgb),0.05);
  }

  /* ── KEYFRAMES ──────────────────────────────────────── */
  @keyframes mp4-rise {
    from { opacity: 0; transform: translateY(26px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mp4-glowIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes mp4-emblemIn {
    from { opacity: 0; transform: translateY(-50%) scale(0.86); }
    to   { opacity: 0.13; transform: translateY(-50%) scale(1); }
  }
  @keyframes mp4-bob {
    0%,100% { transform: translateX(-50%) translateY(0); }
    50%     { transform: translateX(-50%) translateY(6px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .mp4-back, .mp4-kicker, .mp4-name, .mp4-seatTitle, .mp4-chip,
    .mp4-question, .mp4-scrollCue, .mp4-glow, .mp4-emblemWrap {
      animation: none !important;
    }
    .mp4-emblemWrap { transform: translateY(-50%); opacity: 0.13; }
  }

  @media (max-width: 640px) {
    .mp4-emblemWrap svg { width: 90vw; height: 90vw; }
    .mp4-spine { padding-left: 24px; }
    .mp4-secDot { left: -33px; }
    .mp4-cautions { margin-left: -24px; }
  }
`;

export default function Page() {
  const rootStyle = {
    ["--ac" as string]: M.color,
    ["--acrgb" as string]: M.colorRgb,
  } as React.CSSProperties;

  return (
    <div className="mp4-root" style={rootStyle}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavG active="The Council" />

      {/* ── HERO ───────────────────────────────────── */}
      <header className="mp4-hero">
        <div className="mp4-glow" aria-hidden />
        <div className="mp4-emblemWrap" aria-hidden>
          <Emblem kind={M.emblem} />
        </div>
        <div className="mp4-heroScrim" aria-hidden />

        <div className="mp4-heroInner">
          <Link href="/council/influence" className="mp4-back">
            ← Council of Influence
          </Link>
          <div className="mp4-kicker">
            {M.mode} · {M.councilName}
          </div>
          <h1 className="mp4-name">{M.name}</h1>
          <p className="mp4-seatTitle">{M.seatTitle}</p>
          <div className="mp4-chip">{M.carries}</div>
          <p className="mp4-question">{M.question}</p>
        </div>

        <div className="mp4-scrollCue" aria-hidden>
          <span>THE DOSSIER</span>
          <span>↓</span>
        </div>
      </header>

      {/* ── META STRIP ─────────────────────────────── */}
      <div className="mp4-metaStrip">
        {M.meta.map((m) => (
          <div className="mp4-metaItem" key={m.k}>
            <div className="mp4-metaK">{m.k}</div>
            <div className="mp4-metaV">{m.v}</div>
          </div>
        ))}
      </div>

      {/* ── BODY ───────────────────────────────────── */}
      <main className="mp4-body">
        <div className="mp4-spine">
          {M.sections.map((sec, i) => {
            const num = String(i + 1).padStart(2, "0");
            const isMoves = sec.label === "Signature Moves";
            const isConvene = sec.label === "How to Convene";
            return (
              <section className="mp4-section" key={sec.label}>
                <span className="mp4-secDot" aria-hidden />
                <div className="mp4-secHead">
                  <span className="mp4-secNum">{num}</span>
                  <span className="mp4-secLabel">{sec.label}</span>
                </div>

                {/* echo the question once near the convene section */}
                {isConvene && (
                  <p className="mp4-echo">{M.question}</p>
                )}

                {/* cautions land as a dramatic panel within "How to Convene" */}
                {isConvene && (
                  <div className="mp4-cautions">
                    <div className="mp4-cautionsHead">
                      Warnings welded to the chair
                    </div>
                    {M.cautions.map((c, ci) => (
                      <p className="mp4-caution" key={ci}>{c}</p>
                    ))}
                  </div>
                )}

                {isMoves ? (
                  <ol className="mp4-moves">
                    {sec.body.map((move, mi) => (
                      <li className="mp4-move" key={mi}>{move}</li>
                    ))}
                  </ol>
                ) : (
                  sec.body.map((p, pi) => (
                    <p className="mp4-para" key={pi}>{p}</p>
                  ))
                )}
              </section>
            );
          })}
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className="mp4-footer">
        <p className="mp4-pull">&ldquo;{M.pullQuote}&rdquo;</p>
        <Link href="/council/influence" className="mp4-footLink">
          ← Back to the Council of Influence
        </Link>
      </footer>
    </div>
  );
}
