import Link from "next/link";
import NavG from "@/components/NavG";
import { RASPUTIN as M } from "@/lib/council-dossiers";
import { Emblem } from "@/components/council/CouncilEmblems";

// ─────────────────────────────────────────────────────────────────────────────
// Member-page prototype 5 of 5 — "The Reading Room"
// A structured two-pane long-form reader: sticky identity rail (left) + the
// dossier body scrolling beside it (right). Pure CSS sticky + anchor jump links
// (no JS scroll-spy), so this can stay a server component.
// ─────────────────────────────────────────────────────────────────────────────

const AC = M.color;
const ACRGB = M.colorRgb;

// Stable slug for in-page anchor ids (index ↔ section jump links).
function sectionId(label: string) {
  return "sec-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const STYLE = `
  .mp5-root {
    --ac: ${AC};
    --acrgb: ${ACRGB};
    --ink: #eae6f5;
    --muted: #8a849a;
    --dim: #494456;
    --hair: rgba(255,255,255,0.07);
    --card: rgba(255,255,255,0.02);
    --bg: #0e0d14;
    background: var(--bg);
    color: var(--ink);
    min-height: 100vh;
  }

  /* faint accent glow at the top of the page */
  .mp5-atmos {
    position: absolute; inset: 0 0 auto 0; height: 460px;
    pointer-events: none; z-index: 0;
    background:
      radial-gradient(620px 320px at 22% -8%, rgba(var(--acrgb),0.10), transparent 70%),
      radial-gradient(720px 360px at 100% 0%, rgba(var(--acrgb),0.04), transparent 72%);
  }

  .mp5-shell {
    position: relative; z-index: 1;
    max-width: 1180px; margin: 0 auto;
    padding: 40px 32px 120px;
  }

  .mp5-back {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted); text-decoration: none;
    padding: 6px 0; margin-bottom: 32px;
    transition: color 0.2s, transform 0.2s;
  }
  .mp5-back:hover { color: var(--ink); transform: translateX(-3px); }

  /* ── two-pane grid ───────────────────────────────────────────────────────── */
  .mp5-grid {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 56px;
    align-items: start;
  }

  .mp5-rail {
    position: sticky; top: 96px;
    align-self: start;
  }

  /* ── left rail content ───────────────────────────────────────────────────── */
  .mp5-emblem {
    color: var(--ac); width: 72px; height: 72px;
    filter: drop-shadow(0 0 18px rgba(var(--acrgb),0.35));
    margin-bottom: 20px;
  }
  .mp5-chip {
    display: inline-block;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ac);
    background: rgba(var(--acrgb),0.08);
    border: 1px solid rgba(var(--acrgb),0.28);
    border-radius: 999px;
    padding: 4px 11px; margin-bottom: 16px;
  }
  .mp5-name {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic; font-weight: 400;
    font-size: 34px; line-height: 1.04;
    color: var(--ink); letter-spacing: -0.015em;
    margin: 0 0 6px;
  }
  .mp5-seat {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 14px; line-height: 1.4; color: var(--muted);
    margin: 0;
  }
  .mp5-rule { height: 1px; background: var(--hair); border: 0; margin: 22px 0; }

  .mp5-q {
    background: var(--card);
    border: 1px solid var(--hair);
    border-left: 2px solid var(--ac);
    border-radius: 4px;
    padding: 14px 16px;
  }
  .mp5-q-label {
    font-family: var(--font-jetbrains), monospace;
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--ac); display: block; margin-bottom: 8px;
  }
  .mp5-q-text {
    font-family: var(--font-newsreader), Georgia, serif;
    font-style: italic; font-size: 15px; line-height: 1.5;
    color: var(--ink); margin: 0;
  }

  .mp5-meta { margin: 0; }
  .mp5-meta-row {
    display: grid; grid-template-columns: 96px 1fr;
    gap: 12px; padding: 7px 0;
    border-bottom: 1px solid var(--hair);
  }
  .mp5-meta-row:last-child { border-bottom: 0; }
  .mp5-meta-k {
    font-family: var(--font-jetbrains), monospace;
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--dim); padding-top: 2px;
  }
  .mp5-meta-v {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 13.5px; line-height: 1.4; color: var(--muted);
  }

  /* ── index ───────────────────────────────────────────────────────────────── */
  .mp5-idx-label {
    font-family: var(--font-jetbrains), monospace;
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--dim); margin: 0 0 12px;
  }
  .mp5-idx { list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 2px; }
  .mp5-idx a {
    display: flex; align-items: baseline; gap: 10px;
    font-family: var(--font-jetbrains), monospace;
    font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); text-decoration: none;
    padding: 5px 8px; margin: 0 -8px; border-radius: 4px;
    transition: color 0.18s, background 0.18s, padding-left 0.18s;
  }
  .mp5-idx a:hover {
    color: var(--ink);
    background: rgba(var(--acrgb),0.06);
    padding-left: 14px;
  }
  .mp5-idx-num {
    color: var(--ac); font-size: 9px; min-width: 18px;
  }

  /* ── right reading column ────────────────────────────────────────────────── */
  .mp5-read { max-width: 62ch; }

  .mp5-pull {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic; font-weight: 300;
    font-size: 24px; line-height: 1.4;
    color: var(--ink); margin: 0 0 44px;
    padding-left: 20px; border-left: 2px solid rgba(var(--acrgb),0.5);
  }

  .mp5-sec { padding: 0 0 8px; scroll-margin-top: 100px; }
  .mp5-sec + .mp5-sec { border-top: 1px solid var(--hair); margin-top: 40px; padding-top: 40px; }

  .mp5-sec-h {
    display: flex; align-items: center; gap: 12px;
    margin: 0 0 20px;
  }
  .mp5-tick {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--ac); flex-shrink: 0;
    box-shadow: 0 0 10px rgba(var(--acrgb),0.6);
  }
  .mp5-sec-title {
    font-family: var(--font-fraunces), Georgia, serif;
    font-style: italic; font-weight: 400;
    font-size: 23px; color: var(--ink);
    letter-spacing: -0.01em; margin: 0;
  }
  .mp5-p {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 16.5px; line-height: 1.72;
    color: #cdc8dd; margin: 0 0 18px;
  }
  .mp5-p:last-child { margin-bottom: 0; }

  /* numbered moves list */
  .mp5-moves { list-style: none; margin: 4px 0 0; padding: 0;
    display: flex; flex-direction: column; gap: 16px; }
  .mp5-move { display: grid; grid-template-columns: 40px 1fr; gap: 14px; align-items: start; }
  .mp5-move-n {
    font-family: var(--font-jetbrains), monospace;
    font-size: 13px; font-weight: 600; color: var(--ac);
    padding-top: 3px; letter-spacing: 0.05em;
  }
  .mp5-move-t {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 16px; line-height: 1.6; color: #cdc8dd;
  }

  /* cautions callout */
  .mp5-cautions {
    margin-top: 48px;
    background: var(--card);
    border: 1px solid var(--hair);
    border-left: 3px solid var(--ac);
    border-radius: 4px;
    padding: 22px 24px;
  }
  .mp5-cautions-label {
    font-family: var(--font-jetbrains), monospace;
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--ac); margin: 0 0 14px;
  }
  .mp5-caution {
    font-family: var(--font-newsreader), Georgia, serif;
    font-size: 15px; line-height: 1.62; color: var(--muted);
    margin: 0; padding-left: 18px; position: relative;
  }
  .mp5-caution::before {
    content: "—"; position: absolute; left: 0; color: var(--ac);
  }
  .mp5-caution + .mp5-caution { margin-top: 14px; }

  /* ── entrance motion ─────────────────────────────────────────────────────── */
  @keyframes mp5-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mp5-anim { opacity: 0; animation: mp5-rise 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
  .mp5-d1 { animation-delay: 0.04s; }
  .mp5-d2 { animation-delay: 0.16s; }

  @media (prefers-reduced-motion: reduce) {
    .mp5-anim { animation: none; opacity: 1; }
    .mp5-back:hover { transform: none; }
    .mp5-idx a:hover { padding-left: 8px; }
  }

  /* ── responsive: rail stacks above body, stops being sticky ──────────────── */
  @media (max-width: 900px) {
    .mp5-grid { grid-template-columns: 1fr; gap: 36px; }
    .mp5-rail { position: static; top: auto; }
    .mp5-read { max-width: none; }
    .mp5-shell { padding: 28px 22px 96px; }
  }

  /* ── light / sepia theme overrides ───────────────────────────────────────── */
  [data-theme="sepia"] .mp5-root {
    --ink: #2c1f0e;
    --muted: #6b5d44;
    --dim: #9c8d70;
    --hair: #d8cdb8;
    --card: #f0ead8;
    --bg: #f0ead8;
  }
  [data-theme="sepia"] .mp5-p,
  [data-theme="sepia"] .mp5-move-t { color: #3c2f1c; }
  [data-theme="sepia"] .mp5-q,
  [data-theme="sepia"] .mp5-cautions { border-color: #d8cdb8; background: rgba(0,0,0,0.02); }
  [data-theme="sepia"] .mp5-atmos {
    background:
      radial-gradient(620px 320px at 22% -8%, rgba(var(--acrgb),0.14), transparent 70%),
      radial-gradient(720px 360px at 100% 0%, rgba(var(--acrgb),0.06), transparent 72%);
  }
`;

export default function Page() {
  return (
    <>
      <NavG active="The Council" />
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      <main className="mp5-root">
        <div className="mp5-atmos" />
        <div className="mp5-shell">
          <Link href="/council/influence" className="mp5-back">
            ← Council of Influence
          </Link>

          <div className="mp5-grid">
            {/* ─── LEFT RAIL — identity + index ─────────────────────────── */}
            <aside className="mp5-rail mp5-anim mp5-d1">
              <Emblem kind={M.emblem} className="mp5-emblem" />

              <span className="mp5-chip">{M.carries}</span>

              <h1 className="mp5-name">{M.name}</h1>
              <p className="mp5-seat">{M.seatTitle}</p>

              <hr className="mp5-rule" />

              <div className="mp5-q">
                <span className="mp5-q-label">The seat asks</span>
                <p className="mp5-q-text">{M.question}</p>
              </div>

              <hr className="mp5-rule" />

              <dl className="mp5-meta">
                {M.meta.map((m) => (
                  <div className="mp5-meta-row" key={m.k}>
                    <dt className="mp5-meta-k">{m.k}</dt>
                    <dd className="mp5-meta-v">{m.v}</dd>
                  </div>
                ))}
              </dl>

              <hr className="mp5-rule" />

              <p className="mp5-idx-label">In this dossier</p>
              <ul className="mp5-idx">
                {M.sections.map((s, i) => (
                  <li key={s.label}>
                    <a href={`#${sectionId(s.label)}`}>
                      <span className="mp5-idx-num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            {/* ─── RIGHT COLUMN — the dossier body ──────────────────────── */}
            <div className="mp5-read mp5-anim mp5-d2">
              <p className="mp5-pull">{M.pullQuote}</p>

              {M.sections.map((s) => {
                const isMoves = s.label === "Signature Moves";
                return (
                  <section
                    className="mp5-sec"
                    id={sectionId(s.label)}
                    key={s.label}
                  >
                    <div className="mp5-sec-h">
                      <span className="mp5-tick" />
                      <h2 className="mp5-sec-title">{s.label}</h2>
                    </div>

                    {isMoves ? (
                      <ol className="mp5-moves">
                        {s.body.map((move, i) => (
                          <li className="mp5-move" key={i}>
                            <span className="mp5-move-n">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="mp5-move-t">{move}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      s.body.map((para, i) => (
                        <p className="mp5-p" key={i}>
                          {para}
                        </p>
                      ))
                    )}
                  </section>
                );
              })}

              {/* cautions callout */}
              <div className="mp5-cautions">
                <p className="mp5-cautions-label">Handling — warnings welded to the chair</p>
                {M.cautions.map((c, i) => (
                  <p className="mp5-caution" key={i}>
                    {c}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
