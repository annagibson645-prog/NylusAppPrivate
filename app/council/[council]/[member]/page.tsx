// app/council/[council]/[member]/page.tsx
// The Seat — the individual member dossier page (cinematic full-bleed hero).
// Data-driven for all nine seats. Themed shooting-star field behind the content.

import Link from "next/link";
import { notFound } from "next/navigation";
import NavG from "@/components/NavG";
import { Emblem } from "@/components/council/CouncilEmblems";
import CouncilStars from "@/components/council/CouncilStars";
import { getDossier, ALL_DOSSIERS } from "@/lib/council-dossiers";

export const dynamic = "force-static";
// See sibling route: unlisted params would otherwise cost a serverless function.
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_DOSSIERS.map((d) => ({ council: d.councilKey, member: d.slug }));
}

const CSS = `
  .seat-root {
    --ink: #eae6f5; --muted: #8a849a; --dim: #494456;
    --bg: #0e0d14; --hair: rgba(255,255,255,0.07); --emblem-bg: #0e0d14;
    background: #0e0d14;
    color: var(--ink);
    min-height: 100vh;
    font-family: var(--font-newsreader), Georgia, serif;
    overflow-x: hidden;
    position: relative;
  }
  [data-theme="sepia"] .seat-root {
    --ink: #2c1f0e; --muted: #6f6048; --dim: #b3a07e;
    --bg: #f0ead8; --hair: rgba(44,31,14,0.12); --emblem-bg: #f0ead8;
    background: #f0ead8;
  }

  .seat-hero {
    position: relative; min-height: calc(100vh - 80px);
    display: flex; flex-direction: column; justify-content: center;
    padding: 96px 32px 72px; overflow: hidden;
  }
  .seat-glow {
    position: absolute; top: 38%; left: 60%;
    width: 90vw; height: 90vw; max-width: 1100px; max-height: 1100px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(var(--acrgb),0.20) 0%, rgba(var(--acrgb),0.06) 38%, transparent 68%);
    pointer-events: none; z-index: 1;
    animation: seat-glowIn 2.4s cubic-bezier(0.16,1,0.3,1) both;
  }
  .seat-emblemWrap {
    position: absolute; top: 50%; right: -4vw; transform: translateY(-50%);
    color: var(--ac); opacity: 0.14; z-index: 1; pointer-events: none;
    animation: seat-emblemIn 2.6s cubic-bezier(0.16,1,0.3,1) both;
  }
  .seat-emblemWrap svg { width: 70vh; height: 70vh; display: block; }
  .seat-heroScrim {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background: linear-gradient(90deg, var(--bg) 6%, transparent 64%);
    opacity: 0.82;
  }
  .seat-heroInner { position: relative; z-index: 3; max-width: 920px; }

  .seat-back {
    display: inline-block; font-family: var(--font-jetbrains), monospace;
    font-size: 12px; letter-spacing: 0.08em; color: var(--muted);
    text-decoration: none; margin-bottom: 40px;
    transition: color 0.2s, transform 0.2s;
    animation: seat-rise 0.8s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.05s;
  }
  .seat-back:hover { color: var(--ac); transform: translateX(-3px); }
  .seat-kicker {
    font-family: var(--font-jetbrains), monospace;
    font-size: 12px; letter-spacing: 0.32em; text-transform: uppercase;
    color: var(--ac); margin-bottom: 24px;
    animation: seat-rise 0.9s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.15s;
  }
  .seat-name {
    font-family: var(--font-fraunces), Georgia, serif; font-style: italic; font-weight: 500;
    font-size: clamp(60px, 10.5vw, 108px); line-height: 0.92; letter-spacing: -0.02em;
    margin: 0 0 20px;
    animation: seat-rise 1s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.28s;
  }
  .seat-title {
    font-family: var(--font-newsreader), serif; font-size: clamp(16px, 2.4vw, 22px);
    color: var(--muted); margin: 0 0 28px; max-width: 660px;
    animation: seat-rise 1s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.42s;
  }
  .seat-chip {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--ac); border: 1px solid rgba(var(--acrgb),0.4); border-radius: 999px;
    padding: 6px 14px; margin-bottom: 44px;
    animation: seat-rise 1s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.52s;
  }
  .seat-chip.is-living::after {
    content: 'living figure'; color: var(--dim); margin-left: 4px;
    font-size: 9.5px; letter-spacing: 0.1em;
  }
  .seat-chip::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: var(--ac); box-shadow: 0 0 8px rgba(var(--acrgb),0.8);
  }
  .seat-question {
    font-family: var(--font-fraunces), Georgia, serif; font-style: italic; font-weight: 400;
    font-size: clamp(28px, 4.4vw, 52px); line-height: 1.16; letter-spacing: -0.01em;
    color: var(--ink); max-width: 800px; margin: 0; padding-left: 22px;
    border-left: 3px solid var(--ac);
    animation: seat-rise 1.1s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.66s;
  }
  .seat-scrollCue {
    position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); z-index: 3;
    font-family: var(--font-jetbrains), monospace; font-size: 11px; letter-spacing: 0.3em;
    color: var(--muted); display: flex; flex-direction: column; align-items: center; gap: 8px;
    animation: seat-rise 1.2s cubic-bezier(0.16,1,0.3,1) both, seat-bob 2.6s ease-in-out infinite;
    animation-delay: 1s, 1.6s;
  }
  .seat-scrollCue span:last-child { font-size: 18px; }

  .seat-metaStrip {
    position: relative; z-index: 3; display: flex; flex-wrap: wrap; gap: 0;
    border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair);
    background: rgba(var(--acrgb),0.04);
    backdrop-filter: blur(2px);
  }
  .seat-metaItem { flex: 1 1 170px; padding: 18px 24px; border-right: 1px solid var(--hair); }
  .seat-metaItem:last-child { border-right: none; }
  .seat-metaK {
    font-family: var(--font-jetbrains), monospace; font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
  }
  .seat-metaV { font-family: var(--font-newsreader), serif; font-size: 15px; color: var(--ink); }

  .seat-body { position: relative; z-index: 3; max-width: 860px; margin: 0 auto; padding: 96px 32px 120px; }
  .seat-spine { position: relative; border-left: 2px solid rgba(var(--acrgb),0.35); padding-left: 40px; }
  .seat-section { margin-bottom: 84px; position: relative; }
  .seat-section:last-child { margin-bottom: 0; }
  .seat-secHead { display: flex; align-items: baseline; gap: 18px; margin-bottom: 28px; }
  .seat-secNum {
    font-family: var(--font-fraunces), Georgia, serif; font-style: italic;
    font-size: clamp(40px, 6vw, 64px); line-height: 1; color: rgba(var(--acrgb),0.5); font-weight: 500;
  }
  .seat-secLabel {
    font-family: var(--font-jetbrains), monospace; font-size: 13px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--ink);
  }
  .seat-secDot {
    position: absolute; left: -49px; top: 24px; width: 12px; height: 12px; border-radius: 50%;
    background: var(--bg); border: 2px solid var(--ac); box-shadow: 0 0 0 4px var(--bg);
  }
  .seat-para {
    font-family: var(--font-newsreader), serif; font-size: 18px; line-height: 1.7;
    color: var(--ink); margin: 0 0 20px; max-width: 66ch; text-wrap: pretty;
  }
  .seat-para:last-child { margin-bottom: 0; }

  .seat-moves { list-style: none; padding: 0; margin: 0; counter-reset: seatmove; }
  .seat-move {
    counter-increment: seatmove; position: relative; padding: 22px 0 22px 64px;
    border-bottom: 1px solid var(--hair);
    font-family: var(--font-newsreader), serif; font-size: 18px; line-height: 1.55;
    color: var(--ink); transition: color 0.2s;
  }
  .seat-move:last-child { border-bottom: none; }
  .seat-move::before {
    content: counter(seatmove, decimal-leading-zero); position: absolute; left: 0; top: 22px;
    font-family: var(--font-jetbrains), monospace; font-size: 14px; font-weight: 600;
    color: var(--ac); letter-spacing: 0.05em;
  }
  .seat-move:hover { color: var(--ac); }

  .seat-echo {
    font-family: var(--font-fraunces), Georgia, serif; font-style: italic;
    font-size: clamp(22px, 3vw, 30px); line-height: 1.3; color: var(--muted);
    margin: 0 0 36px; padding-left: 24px; border-left: 2px solid rgba(var(--acrgb),0.4);
  }

  .seat-cautions {
    position: relative; margin: 8px 0 40px; margin-left: -40px;
    padding: 32px 36px 32px 40px;
    background: rgba(var(--acrgb),0.07); border: 1px solid rgba(var(--acrgb),0.4);
    border-left: 5px solid var(--ac); border-radius: 4px;
  }
  .seat-cautionsHead {
    font-family: var(--font-jetbrains), monospace; font-size: 12px; letter-spacing: 0.24em;
    text-transform: uppercase; color: var(--ac); margin-bottom: 18px;
    display: flex; align-items: center; gap: 10px;
  }
  .seat-cautionsHead::before { content: '⚠'; font-size: 16px; }
  .seat-caution {
    font-family: var(--font-newsreader), serif; font-size: 17px; line-height: 1.6;
    color: var(--ink); margin: 0 0 16px; padding-left: 18px;
    border-left: 2px solid rgba(var(--acrgb),0.45);
  }
  .seat-caution:last-child { margin-bottom: 0; }

  .seat-footer {
    position: relative; z-index: 3; border-top: 1px solid var(--hair);
    padding: 40px 32px 80px; text-align: center;
  }
  .seat-pull {
    font-family: var(--font-fraunces), Georgia, serif; font-style: italic;
    font-size: clamp(20px, 3vw, 28px); line-height: 1.35; color: var(--ink);
    max-width: 700px; margin: 0 auto 32px;
  }
  .seat-footLink {
    display: inline-block; font-family: var(--font-jetbrains), monospace;
    font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted); text-decoration: none; border: 1px solid var(--hair);
    border-radius: 999px; padding: 10px 22px;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
  }
  .seat-footLink:hover { color: var(--ac); border-color: rgba(var(--acrgb),0.5); background: rgba(var(--acrgb),0.05); }

  @keyframes seat-rise { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes seat-glowIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes seat-emblemIn { from { opacity: 0; transform: translateY(-50%) scale(0.86); } to { opacity: 0.14; transform: translateY(-50%) scale(1); } }
  @keyframes seat-bob { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(6px); } }

  @media (prefers-reduced-motion: reduce) {
    .seat-back, .seat-kicker, .seat-name, .seat-title, .seat-chip,
    .seat-question, .seat-scrollCue, .seat-glow, .seat-emblemWrap { animation: none !important; }
    .seat-emblemWrap { transform: translateY(-50%); opacity: 0.14; }
  }
  @media (max-width: 640px) {
    .seat-emblemWrap svg { width: 90vw; height: 90vw; }
    .seat-spine { padding-left: 24px; }
    .seat-secDot { left: -33px; }
    .seat-cautions { margin-left: -24px; }
  }
`;

export default async function SeatPage({
  params,
}: {
  params: Promise<{ council: string; member: string }>;
}) {
  const { council, member } = await params;
  const M = getDossier(member);
  if (!M || M.councilKey !== council) notFound();

  const rootStyle = {
    ["--ac" as string]: M.color,
    ["--acrgb" as string]: M.colorRgb,
  } as React.CSSProperties;

  const backHref = `/council/${M.councilKey}`;

  return (
    <div className="seat-root" style={rootStyle}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavG active="The Council" />
      <CouncilStars density={0.55} accent={M.color} />

      {/* ── HERO ─────────────────────────────────────── */}
      <header className="seat-hero">
        <div className="seat-glow" aria-hidden />
        <div className="seat-emblemWrap" aria-hidden>
          <Emblem kind={M.emblem} />
        </div>
        <div className="seat-heroScrim" aria-hidden />

        <div className="seat-heroInner">
          <Link href={backHref} className="seat-back">← {M.councilName}</Link>
          <div className="seat-kicker">{M.mode} · {M.councilName}</div>
          <h1 className="seat-name">{M.name}</h1>
          <p className="seat-title">{M.seatTitle}</p>
          <div className={`seat-chip${M.living ? " is-living" : ""}`}>{M.carries}</div>
          <p className="seat-question">{M.question}</p>
        </div>

        <div className="seat-scrollCue" aria-hidden>
          <span>THE DOSSIER</span>
          <span>↓</span>
        </div>
      </header>

      {/* ── META STRIP ───────────────────────────────── */}
      <div className="seat-metaStrip">
        {M.meta.map((m) => (
          <div className="seat-metaItem" key={m.k}>
            <div className="seat-metaK">{m.k}</div>
            <div className="seat-metaV">{m.v}</div>
          </div>
        ))}
      </div>

      {/* ── BODY ─────────────────────────────────────── */}
      <main className="seat-body">
        <div className="seat-spine">
          {M.sections.map((sec, i) => {
            const num = String(i + 1).padStart(2, "0");
            const isMoves = sec.label === "Signature Moves";
            const isConvene = sec.label === "How to Convene";
            return (
              <section className="seat-section" key={sec.label}>
                <span className="seat-secDot" aria-hidden />
                <div className="seat-secHead">
                  <span className="seat-secNum">{num}</span>
                  <span className="seat-secLabel">{sec.label}</span>
                </div>

                {isConvene && <p className="seat-echo">{M.question}</p>}

                {isConvene && M.cautions.length > 0 && (
                  <div className="seat-cautions">
                    <div className="seat-cautionsHead">Warnings welded to the chair</div>
                    {M.cautions.map((c, ci) => (
                      <p className="seat-caution" key={ci}>{c}</p>
                    ))}
                  </div>
                )}

                {isMoves ? (
                  <ol className="seat-moves">
                    {sec.body.map((move, mi) => (
                      <li className="seat-move" key={mi}>{move}</li>
                    ))}
                  </ol>
                ) : (
                  sec.body.map((p, pi) => (
                    <p className="seat-para" key={pi}>{p}</p>
                  ))
                )}
              </section>
            );
          })}
        </div>
      </main>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="seat-footer">
        <p className="seat-pull">&ldquo;{M.pullQuote}&rdquo;</p>
        <Link href={backHref} className="seat-footLink">← Back to the {M.councilName}</Link>
      </footer>
    </div>
  );
}
