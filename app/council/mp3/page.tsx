import Link from "next/link";
import NavG from "@/components/NavG";
import { RASPUTIN as M } from "@/lib/council-dossiers";
import { Emblem } from "@/components/council/CouncilEmblems";

// ─── Member-page Prototype 3 — "Luxury / Refined" ────────────────────────────
// A contemplative, spacious dossier. Narrow centered measure, a small perfectly
// placed emblem, the seat's QUESTION as the still epigraph the page breathes
// around. Empty space is the material. Restrained palette, exquisite type,
// slow considered fade-up motion. All custom CSS scoped with the `mp3-` prefix.
// Pure CSS → no client hooks, no "use client".

const MP3_STYLES = `
  .mp3-root {
    --ac: ${M.color};
    --acrgb: ${M.colorRgb};
    --mp3-bg: #0e0d14;
    --mp3-ink: #eae6f5;
    --mp3-muted: #8a849a;
    --mp3-dim: #494456;
    --mp3-line: rgba(255,255,255,0.07);
    --mp3-emblem-bg: #0e0d14;
    background: var(--mp3-bg);
    color: var(--mp3-ink);
    min-height: calc(100vh - 80px);
    position: relative;
    overflow: hidden;
  }
  [data-theme="sepia"] .mp3-root {
    --mp3-bg: #f0ead8;
    --mp3-ink: #2c1f0e;
    --mp3-muted: #6f6249;
    --mp3-dim: #b3a684;
    --mp3-line: rgba(44,31,14,0.12);
    --mp3-emblem-bg: #f0ead8;
  }

  /* a single faint accent glow, high and centered — otherwise air */
  .mp3-root::before {
    content: "";
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(720px 420px at 50% -6%, rgba(var(--acrgb),0.06), transparent 72%);
  }

  .mp3-wrap {
    position: relative; z-index: 1;
    max-width: 760px;
    margin: 0 auto;
    padding: 56px 40px 160px;
  }

  /* ── back link, quiet, top-left of the measure ── */
  .mp3-back {
    display: inline-block;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--mp3-dim);
    text-decoration: none;
    padding-bottom: 2px;
    border-bottom: 1px solid transparent;
    transition: color 0.45s cubic-bezier(0.16,1,0.3,1),
                border-color 0.45s cubic-bezier(0.16,1,0.3,1);
  }
  .mp3-back:hover { color: var(--mp3-muted); border-bottom-color: var(--mp3-line); }

  /* ── header: emblem, name, seat ── */
  .mp3-head {
    text-align: center;
    margin-top: 88px;
  }
  .mp3-emblem {
    color: var(--ac);
    width: 72px; height: 72px;
    margin: 0 auto 40px;
    opacity: 0.92;
    display: block;
  }
  .mp3-kicker {
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px; letter-spacing: 0.34em; text-transform: uppercase;
    color: var(--ac);
    opacity: 0.7;
    margin-bottom: 28px;
  }
  .mp3-name {
    font-family: var(--font-cormorant), Georgia, serif;
    font-weight: 300;
    font-size: clamp(52px, 9vw, 88px);
    line-height: 1.02;
    letter-spacing: 0.01em;
    color: var(--mp3-ink);
    margin: 0;
  }
  .mp3-seat {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: 17px;
    color: var(--mp3-muted);
    margin-top: 22px;
    letter-spacing: 0.01em;
  }
  .mp3-mode {
    font-family: var(--font-jetbrains), monospace;
    font-size: 9.5px; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--mp3-dim);
    margin-top: 18px;
  }
  .mp3-mode span { color: var(--ac); opacity: 0.8; }

  /* hairline accent rule under the header */
  .mp3-rule {
    width: 48px; height: 1px;
    margin: 56px auto 0;
    background: linear-gradient(90deg, transparent, rgba(var(--acrgb),0.55), transparent);
  }

  /* ── the QUESTION — still center of the page ── */
  .mp3-epigraph {
    text-align: center;
    margin: 132px auto;
    max-width: 600px;
    position: relative;
  }
  .mp3-epigraph-mark {
    font-family: var(--font-cormorant), Georgia, serif;
    font-size: 110px;
    line-height: 0;
    color: var(--ac);
    opacity: 0.16;
    display: block;
    height: 40px;
    user-select: none;
  }
  .mp3-question {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(24px, 3.4vw, 33px);
    line-height: 1.5;
    color: var(--mp3-ink);
    margin: 28px auto 0;
    text-wrap: balance;
    letter-spacing: 0.005em;
  }

  /* ── sections ── */
  .mp3-section { margin-top: 124px; }
  .mp3-section-rule {
    width: 28px; height: 1px;
    margin: 0 auto 26px;
    background: var(--mp3-line);
  }
  .mp3-label {
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px; letter-spacing: 0.36em; text-transform: uppercase;
    color: var(--mp3-muted);
    text-align: center;
    margin-bottom: 44px;
  }
  .mp3-body p {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 18px;
    line-height: 1.78;
    color: var(--mp3-ink);
    margin: 0 0 26px;
    text-wrap: pretty;
  }
  .mp3-body p:last-child { margin-bottom: 0; }

  /* ── signature moves: refined unbulleted list, hairline-separated ── */
  .mp3-moves { list-style: none; margin: 0; padding: 0; }
  .mp3-move {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 18px;
    line-height: 1.72;
    color: var(--mp3-ink);
    padding: 32px 0;
    border-top: 1px solid var(--mp3-line);
    text-wrap: pretty;
    position: relative;
  }
  .mp3-move:last-child { border-bottom: 1px solid var(--mp3-line); }
  .mp3-move-num {
    display: block;
    font-family: var(--font-jetbrains), monospace;
    font-size: 9.5px; letter-spacing: 0.24em;
    color: var(--ac);
    opacity: 0.7;
    margin-bottom: 12px;
  }

  /* ── cautions: a quiet indented coda with a thin accent rule ── */
  .mp3-cautions {
    margin: 132px auto 0;
    max-width: 600px;
    padding-left: 28px;
    border-left: 1px solid rgba(var(--acrgb),0.4);
  }
  .mp3-cautions-label {
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px; letter-spacing: 0.34em; text-transform: uppercase;
    color: var(--ac);
    opacity: 0.75;
    margin-bottom: 28px;
  }
  .mp3-caution {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: 16px;
    line-height: 1.72;
    color: var(--mp3-muted);
    margin: 0 0 20px;
    text-wrap: pretty;
  }
  .mp3-caution:last-child { margin-bottom: 0; }

  /* ── pull quote, a small whispered close ── */
  .mp3-pull {
    text-align: center;
    margin: 120px auto 0;
    max-width: 560px;
  }
  .mp3-pull p {
    font-family: var(--font-cormorant), Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(22px, 3vw, 28px);
    line-height: 1.45;
    color: var(--mp3-ink);
    margin: 0;
    text-wrap: balance;
  }

  /* ── meta: one delicate centered detail row at the very bottom ── */
  .mp3-meta {
    margin: 116px auto 0;
    display: flex; flex-wrap: wrap;
    justify-content: center;
    gap: 10px 26px;
  }
  .mp3-meta-item {
    font-family: var(--font-jetbrains), monospace;
    font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--mp3-dim);
    white-space: nowrap;
  }
  .mp3-meta-k { color: var(--mp3-dim); opacity: 0.65; }
  .mp3-meta-v { color: var(--mp3-muted); margin-left: 8px; }

  /* return link at the very bottom */
  .mp3-return {
    text-align: center;
    margin-top: 96px;
  }
  .mp3-return a {
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--mp3-dim);
    text-decoration: none;
    padding-bottom: 3px;
    border-bottom: 1px solid transparent;
    transition: color 0.45s cubic-bezier(0.16,1,0.3,1),
                border-color 0.45s cubic-bezier(0.16,1,0.3,1);
  }
  .mp3-return a:hover { color: var(--ac); border-bottom-color: rgba(var(--acrgb),0.4); }

  /* ── slow, elegant fade-up reveal, cascading ── */
  @keyframes mp3-rise {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mp3-rise {
    opacity: 0;
    animation: mp3-rise 1.4s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  .mp3-d1 { animation-delay: 0.05s; }
  .mp3-d2 { animation-delay: 0.28s; }
  .mp3-d3 { animation-delay: 0.55s; }
  .mp3-d4 { animation-delay: 0.85s; }

  @media (prefers-reduced-motion: reduce) {
    .mp3-rise {
      opacity: 1;
      animation: none;
      transform: none;
    }
    .mp3-back, .mp3-return a { transition: none; }
  }

  @media (max-width: 640px) {
    .mp3-wrap { padding: 40px 24px 120px; }
    .mp3-head { margin-top: 56px; }
    .mp3-epigraph { margin: 96px auto; }
    .mp3-section { margin-top: 96px; }
  }
`;

export default function MemberPageProto3() {
  // Split sections into the "Signature Moves" list and the prose sections.
  return (
    <div style={{ background: "var(--mp3-bg, #0e0d14)" }}>
      <NavG active="The Council" />
      <style dangerouslySetInnerHTML={{ __html: MP3_STYLES }} />

      <div
        className="mp3-root"
        style={{ "--emblem-bg": "var(--mp3-emblem-bg)" } as React.CSSProperties}
      >
        <div className="mp3-wrap">
          {/* back link */}
          <div className="mp3-rise mp3-d1">
            <Link href="/council/influence" className="mp3-back">
              ← {M.councilName}
            </Link>
          </div>

          {/* header */}
          <header className="mp3-head">
            <div className="mp3-rise mp3-d1">
              <Emblem
                kind={M.emblem}
                className="mp3-emblem"
                style={{ "--emblem-bg": "var(--mp3-emblem-bg)" } as React.CSSProperties}
              />
            </div>
            <div className="mp3-rise mp3-d2">
              <div className="mp3-kicker">{M.carries}</div>
              <h1 className="mp3-name">{M.name}</h1>
              <div className="mp3-seat">{M.seatTitle}</div>
              <div className="mp3-mode">
                <span>{M.mode}</span> &nbsp;·&nbsp; {M.councilName}
              </div>
            </div>
            <div className="mp3-rule mp3-rise mp3-d3" />
          </header>

          {/* the question — still center */}
          <section className="mp3-epigraph mp3-rise mp3-d4">
            <span className="mp3-epigraph-mark" aria-hidden="true">“</span>
            <p className="mp3-question">{M.question}</p>
          </section>

          {/* sections */}
          {M.sections.map((sec) => {
            const isMoves = sec.label.toLowerCase().includes("signature");
            return (
              <section className="mp3-section" key={sec.label}>
                <div className="mp3-section-rule" />
                <h2 className="mp3-label">{sec.label}</h2>
                {isMoves ? (
                  <ol className="mp3-moves">
                    {sec.body.map((move, i) => (
                      <li className="mp3-move" key={i}>
                        <span className="mp3-move-num">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {move}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="mp3-body">
                    {sec.body.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {/* cautions — the quiet coda */}
          {M.cautions.length > 0 && (
            <aside className="mp3-cautions">
              <div className="mp3-cautions-label">Warnings welded to the chair</div>
              {M.cautions.map((c, i) => (
                <p className="mp3-caution" key={i}>{c}</p>
              ))}
            </aside>
          )}

          {/* pull quote close */}
          <div className="mp3-pull">
            <p>“{M.pullQuote}”</p>
          </div>

          {/* meta — one delicate detail row */}
          <div className="mp3-meta">
            {M.meta.map((m) => (
              <div className="mp3-meta-item" key={m.k}>
                <span className="mp3-meta-k">{m.k}</span>
                <span className="mp3-meta-v">{m.v}</span>
              </div>
            ))}
          </div>

          {/* return */}
          <div className="mp3-return">
            <Link href="/council/influence">Return to the {M.councilName}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
