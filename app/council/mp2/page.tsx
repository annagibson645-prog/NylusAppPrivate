import Link from "next/link";
import NavG from "@/components/NavG";
import { RASPUTIN as M } from "@/lib/council-dossiers";
import { Emblem } from "@/components/council/CouncilEmblems";

// ─── Member-page Prototype 2 — "The Dossier File" ────────────────────────────
// Industrial / classified case-file layout, executed in the NylusS void/parchment
// skin. A stamped wax-seal emblem top-right, a true record table, filed §-numbered
// entries, a bordered DIRECTIVE, and a stamped HANDLING warning.
// All custom CSS scoped with the `mp2-` prefix. Pure CSS → no client hooks.

const MP2_STYLES = `
  .mp2-root {
    --ac: ${M.color};
    --acrgb: ${M.colorRgb};
    --mp2-bg: #0e0d14;
    --mp2-ink: #eae6f5;
    --mp2-muted: #8a849a;
    --mp2-dim: #494456;
    --mp2-line: rgba(255,255,255,0.07);
    --mp2-panel: rgba(255,255,255,0.022);
    --mp2-emblem-bg: #0e0d14;
    background: var(--mp2-bg);
    color: var(--mp2-ink);
    min-height: calc(100vh - 80px);
    position: relative;
  }
  [data-theme="sepia"] .mp2-root {
    --mp2-bg: #f0ead8;
    --mp2-ink: #2c1f0e;
    --mp2-muted: #6f6249;
    --mp2-dim: #b3a684;
    --mp2-line: rgba(44,31,14,0.12);
    --mp2-panel: rgba(44,31,14,0.025);
    --mp2-emblem-bg: #f0ead8;
  }

  /* faint accent glow top-right, behind the seal */
  .mp2-root::before {
    content: "";
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(620px 360px at 88% -4%, rgba(var(--acrgb),0.07), transparent 70%),
      radial-gradient(900px 500px at 0% 102%, rgba(var(--acrgb),0.03), transparent 70%);
  }

  .mp2-wrap {
    position: relative; z-index: 1;
    max-width: 1080px; margin: 0 auto;
    padding: 32px 40px 96px;
  }

  /* ── mono utility ── */
  .mp2-mono {
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase; letter-spacing: 0.16em;
  }

  /* ── top bar: back link ── */
  .mp2-top {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 16px; margin-bottom: 24px;
    border-bottom: 1px solid var(--mp2-line);
  }
  .mp2-back {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--mp2-muted); text-decoration: none;
    transition: color 0.18s;
  }
  .mp2-back:hover { color: var(--ac); }
  .mp2-top-code {
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    letter-spacing: 0.18em; color: var(--mp2-dim);
  }

  /* ── classified header band ── */
  .mp2-strip {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--mp2-muted);
    padding: 10px 0;
    border-top: 1px solid var(--mp2-line);
    border-bottom: 1px solid var(--mp2-line);
    margin-bottom: 8px;
  }
  .mp2-strip-seg { display: inline-flex; align-items: center; gap: 8px; }
  .mp2-strip-dot { color: var(--mp2-dim); }
  .mp2-strip-file { color: var(--ac); }
  .mp2-strip-live {
    margin-left: auto;
    border: 1px solid rgba(var(--acrgb),0.45);
    color: var(--ac);
    padding: 3px 9px; border-radius: 2px; font-size: 9px;
  }

  /* ── header: name + seal ── */
  .mp2-head {
    display: grid; grid-template-columns: 1fr auto; gap: 32px;
    align-items: start;
    padding: 40px 0 36px;
    border-bottom: 1px solid var(--mp2-line);
  }
  .mp2-kicker {
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--mp2-dim); margin-bottom: 16px;
  }
  .mp2-name {
    font-family: 'Fraunces', Georgia, serif; font-style: italic;
    font-weight: 400; font-size: clamp(48px, 8vw, 88px);
    line-height: 0.96; letter-spacing: -0.02em;
    color: var(--mp2-ink); margin: 0;
  }
  .mp2-seat {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--mp2-muted); margin-top: 18px;
  }
  .mp2-carries {
    display: inline-block; margin-top: 14px;
    font-family: 'Newsreader', Georgia, serif; font-style: italic;
    font-size: 16px; color: var(--ac);
  }

  /* ── the stamp / wax seal ── */
  .mp2-seal {
    position: relative; width: 168px; height: 168px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transform: rotate(-7deg);
    --mp2-press: 1;
    animation: mp2-press 720ms cubic-bezier(0.2,0.9,0.3,1) 1 both;
  }
  .mp2-seal-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1.5px solid rgba(var(--acrgb),0.5);
    box-shadow: 0 0 0 6px rgba(var(--acrgb),0.05) inset;
  }
  .mp2-seal-ring2 {
    position: absolute; inset: 12px; border-radius: 50%;
    border: 1px dashed rgba(var(--acrgb),0.3);
  }
  .mp2-seal-emblem {
    color: var(--ac); opacity: 0.92;
    --emblem-bg: var(--mp2-emblem-bg);
  }
  .mp2-seal-text {
    position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%);
    font-family: 'JetBrains Mono', monospace; font-size: 8px;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--ac); background: var(--mp2-bg);
    padding: 0 6px; white-space: nowrap;
  }
  @keyframes mp2-press {
    0%   { transform: rotate(-7deg) scale(1.08); opacity: 0; }
    60%  { opacity: 1; }
    100% { transform: rotate(-7deg) scale(1); opacity: 1; }
  }

  /* ── pull quote ── */
  .mp2-pull {
    margin: 36px 0; padding: 22px 28px;
    border-left: 2px solid var(--ac);
    background: var(--mp2-panel);
    font-family: 'Fraunces', Georgia, serif; font-style: italic;
    font-size: clamp(20px, 2.6vw, 28px); line-height: 1.34;
    color: var(--mp2-ink);
  }

  /* ── two-column body grid ── */
  .mp2-grid {
    display: grid; grid-template-columns: 264px 1fr; gap: 48px;
    align-items: start; margin-top: 8px;
  }

  /* ── RECORD table ── */
  .mp2-record {
    position: sticky; top: 104px;
  }
  .mp2-section-tag {
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--mp2-dim); margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .mp2-section-tag::after {
    content: ""; flex: 1; height: 1px; background: var(--mp2-line);
  }
  .mp2-rec-row {
    display: grid; grid-template-columns: 1fr 1.25fr; gap: 12px;
    padding: 9px 0; border-bottom: 1px solid var(--mp2-line);
    opacity: 0; animation: mp2-fade 480ms ease forwards;
  }
  .mp2-rec-row:first-of-type { border-top: 1px solid var(--mp2-line); }
  .mp2-rec-k {
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--mp2-dim);
  }
  .mp2-rec-v {
    font-family: 'JetBrains Mono', monospace; font-size: 12px;
    color: var(--mp2-muted); font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
  }
  @keyframes mp2-fade { to { opacity: 1; } }

  /* ── DIRECTIVE box ── */
  .mp2-directive {
    margin-top: 28px; padding: 18px 20px;
    border: 1px solid rgba(var(--acrgb),0.35);
    border-radius: 3px;
    background: rgba(var(--acrgb),0.04);
  }
  .mp2-directive-lbl {
    font-family: 'JetBrains Mono', monospace; font-size: 9px;
    letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--ac); margin-bottom: 10px;
  }
  .mp2-directive-q {
    font-family: 'Newsreader', Georgia, serif; font-size: 16px;
    line-height: 1.5; color: var(--mp2-ink); font-style: italic;
  }

  /* ── filed entries ── */
  .mp2-entry {
    display: grid; grid-template-columns: 64px 1fr; gap: 20px;
    padding: 28px 0; border-top: 1px solid var(--mp2-line);
  }
  .mp2-entry:first-child { border-top: none; padding-top: 4px; }
  .mp2-entry-idx {
    font-family: 'JetBrains Mono', monospace; font-size: 13px;
    letter-spacing: 0.04em; color: var(--ac);
    font-variant-numeric: tabular-nums; padding-top: 3px;
  }
  .mp2-entry-label {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--mp2-muted); margin-bottom: 14px;
  }
  .mp2-entry-body p {
    font-family: 'Newsreader', Georgia, serif; font-size: 17px;
    line-height: 1.68; color: var(--mp2-ink); opacity: 0.92;
    margin: 0 0 14px;
  }
  .mp2-entry-body p:last-child { margin-bottom: 0; }

  /* ── signature moves checklist ── */
  .mp2-moves { list-style: none; margin: 0; padding: 0; }
  .mp2-move {
    display: grid; grid-template-columns: 22px 1fr; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid var(--mp2-line);
    transition: background 0.18s;
  }
  .mp2-move:first-child { border-top: 1px solid var(--mp2-line); }
  .mp2-move:hover { background: var(--mp2-panel); }
  .mp2-move-mark {
    font-family: 'JetBrains Mono', monospace; font-size: 14px;
    color: var(--ac); line-height: 1.5;
  }
  .mp2-move-text {
    font-family: 'Newsreader', Georgia, serif; font-size: 16px;
    line-height: 1.55; color: var(--mp2-ink); opacity: 0.92;
  }

  /* ── HANDLING warning ── */
  .mp2-handling {
    margin-top: 56px; padding: 26px 28px;
    border: 1.5px solid rgba(var(--acrgb),0.55);
    border-radius: 3px;
    background: rgba(var(--acrgb),0.05);
    position: relative; overflow: hidden;
  }
  .mp2-handling::before {
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(
      -45deg,
      rgba(var(--acrgb),0.05) 0 10px,
      transparent 10px 20px
    );
    opacity: 0.5; z-index: 0;
  }
  .mp2-handling-inner { position: relative; z-index: 1; }
  .mp2-handling-lbl {
    font-family: 'JetBrains Mono', monospace; font-size: 12px;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ac); margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .mp2-handling-list { list-style: none; margin: 0; padding: 0; }
  .mp2-handling-item {
    display: grid; grid-template-columns: 20px 1fr; gap: 12px;
    padding: 10px 0;
  }
  .mp2-handling-item + .mp2-handling-item {
    border-top: 1px solid rgba(var(--acrgb),0.2);
  }
  .mp2-handling-mark {
    font-family: 'JetBrains Mono', monospace; color: var(--ac); font-size: 13px;
  }
  .mp2-handling-text {
    font-family: 'Newsreader', Georgia, serif; font-size: 16px;
    line-height: 1.6; color: var(--mp2-ink);
  }

  /* ── footer ── */
  .mp2-foot {
    margin-top: 56px; padding-top: 18px;
    border-top: 1px solid var(--mp2-line);
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--mp2-dim);
  }
  .mp2-foot-link { color: var(--mp2-muted); text-decoration: none; transition: color 0.18s; }
  .mp2-foot-link:hover { color: var(--ac); }

  @media (max-width: 760px) {
    .mp2-wrap { padding: 24px 22px 72px; }
    .mp2-head { grid-template-columns: 1fr; }
    .mp2-seal { order: -1; }
    .mp2-grid { grid-template-columns: 1fr; gap: 32px; }
    .mp2-record { position: static; }
    .mp2-entry { grid-template-columns: 48px 1fr; gap: 14px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .mp2-seal { animation: none; }
    .mp2-rec-row { animation: none; opacity: 1; }
  }
`;

function fileCode(name: string) {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "-");
}

export default function MemberDossierPrototype2() {
  const seatNo = "01"; // Influence · first seat
  return (
    <>
      <NavG active="The Council" />
      <style dangerouslySetInnerHTML={{ __html: MP2_STYLES }} />

      <main className="mp2-root">
        <div className="mp2-wrap">
          {/* back + corner code */}
          <div className="mp2-top">
            <Link href="/council/influence" className="mp2-back">
              ← Council of Influence
            </Link>
            <span className="mp2-top-code">REF · {fileCode(M.councilName)}</span>
          </div>

          {/* classified strip */}
          <div className="mp2-strip">
            <span className="mp2-strip-seg">SEAT {seatNo}</span>
            <span className="mp2-strip-dot">·</span>
            <span className="mp2-strip-seg">{M.councilName.replace("Council of ", "").toUpperCase()}</span>
            <span className="mp2-strip-dot">·</span>
            <span className="mp2-strip-seg" style={{ color: "var(--ac)" }}>DARK POWER</span>
            <span className="mp2-strip-dot">·</span>
            <span className="mp2-strip-seg">
              FILE: <span className="mp2-strip-file">{fileCode(M.name)}</span>
            </span>
            <span className="mp2-strip-live">
              {M.living ? "● ACTIVE" : "✦ HISTORICAL"}
            </span>
          </div>

          {/* header: name + stamped seal */}
          <header className="mp2-head">
            <div>
              <div className="mp2-kicker">Dossier · Mode of {M.mode}</div>
              <h1 className="mp2-name">{M.name}</h1>
              <div className="mp2-seat">{M.seatTitle}</div>
              <span className="mp2-carries">Carries — {M.carries}</span>
            </div>

            <div className="mp2-seal" aria-hidden="true">
              <span className="mp2-seal-ring" />
              <span className="mp2-seal-ring2" />
              <Emblem kind={M.emblem} className="mp2-seal-emblem" width={104} height={104} />
              <span className="mp2-seal-text">FILED · SEALED</span>
            </div>
          </header>

          {/* pull quote */}
          <blockquote className="mp2-pull">“{M.pullQuote}”</blockquote>

          {/* body grid */}
          <div className="mp2-grid">
            {/* left rail: RECORD + DIRECTIVE */}
            <aside className="mp2-record">
              <div className="mp2-section-tag">Record</div>
              <div>
                {M.meta.map((row, i) => (
                  <div
                    className="mp2-rec-row"
                    key={row.k}
                    style={{ animationDelay: `${0.08 * i + 0.1}s` }}
                  >
                    <span className="mp2-rec-k">{row.k}</span>
                    <span className="mp2-rec-v">{row.v}</span>
                  </div>
                ))}
              </div>

              <div className="mp2-directive">
                <div className="mp2-directive-lbl">▸ Directive</div>
                <p className="mp2-directive-q">{M.question}</p>
              </div>
            </aside>

            {/* right: filed entries */}
            <section>
              {M.sections.map((sec, i) => {
                const idx = String(i + 1).padStart(2, "0");
                const isMoves = sec.label.toLowerCase().includes("signature");
                return (
                  <article className="mp2-entry" key={sec.label}>
                    <div className="mp2-entry-idx">§ {idx}</div>
                    <div>
                      <div className="mp2-entry-label">{sec.label}</div>
                      <div className="mp2-entry-body">
                        {isMoves ? (
                          <ul className="mp2-moves">
                            {sec.body.map((move, j) => (
                              <li className="mp2-move" key={j}>
                                <span className="mp2-move-mark">▸</span>
                                <span className="mp2-move-text">{move}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          sec.body.map((para, j) => <p key={j}>{para}</p>)
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>

          {/* HANDLING warning */}
          <section className="mp2-handling">
            <div className="mp2-handling-inner">
              <div className="mp2-handling-lbl">⚠ Handling — Do Not Convene Alone</div>
              <ul className="mp2-handling-list">
                {M.cautions.map((c, i) => (
                  <li className="mp2-handling-item" key={i}>
                    <span className="mp2-handling-mark">[!]</span>
                    <span className="mp2-handling-text">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* footer */}
          <footer className="mp2-foot">
            <span>End of file · {fileCode(M.name)}</span>
            <Link href="/council/influence" className="mp2-foot-link">
              ← Return to the Council of Influence
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
}
