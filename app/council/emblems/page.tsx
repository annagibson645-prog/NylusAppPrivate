import NavG from "@/components/NavG";
import { EMBLEM_SETS } from "@/components/council/EmblemPrototypes";

export const dynamic = "force-static";

const COLS = [
  { key: "eye", label: "Eye", sub: "Influence", color: "#dc2626", rgb: "220,38,38" },
  { key: "crown", label: "Crown", sub: "Sovereignty", color: "#e8b86a", rgb: "232,184,106" },
  { key: "gears", label: "Gears", sub: "Craftsmanship", color: "#60a5fa", rgb: "96,165,250" },
] as const;

export default function EmblemPrototypes() {
  return (
    <>
      <NavG active="The Council" />
      <div className="emb-page">
        <div className="emb-inner">
          <div className="emb-kicker">emblem studies · pick per image</div>
          <h1 className="emb-title">Three Emblem Sets</h1>
          <p className="emb-lede">
            Each row is one style across all three emblems. You can mix — e.g. the eye from one
            set, the crown from another. Tell me which eye, which crown, which gears.
          </p>

          {EMBLEM_SETS.map((set) => (
            <section key={set.id} className="emb-set">
              <div className="emb-set-head">
                <span className="emb-set-id">{set.id}</span>
                <div>
                  <h2 className="emb-set-name">{set.name}</h2>
                  <p className="emb-set-note">{set.note}</p>
                </div>
              </div>
              <div className="emb-grid">
                {COLS.map((col) => {
                  const Glyph = set[col.key];
                  return (
                    <div key={col.key} className="emb-cell"
                      style={{ ["--ec" as string]: col.color, ["--erc" as string]: col.rgb }}>
                      <div className="emb-glyph">
                        <Glyph />
                      </div>
                      <div className="emb-cell-label">
                        <span className="emb-cell-name">{col.label}</span>
                        <span className="emb-cell-sub">{set.id} · {col.sub}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .emb-page { min-height: 100vh; background: var(--bg, #0e0d14); --emb-card: rgba(255,255,255,0.02); --emb-bd: rgba(255,255,255,0.08); }
        [data-theme="sepia"] .emb-page { --emb-card: #f0ead8; --emb-bd: #d8cdb8; }
        .emb-inner { max-width: 1080px; margin: 0 auto; padding: 56px clamp(20px,5vw,64px) 160px; }
        .emb-kicker { font-family: var(--font-jetbrains), monospace; font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: var(--text-muted, #8a849a); margin-bottom: 16px; }
        .emb-title { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-weight: 400; font-size: clamp(34px,5vw,52px); color: var(--text, #eae6f5); margin: 0 0 18px; }
        .emb-lede { font-family: 'Newsreader', Georgia, serif; font-size: 18px; line-height: 1.6; color: var(--text-muted, #8a849a); max-width: 640px; margin: 0 0 56px; }

        .emb-set { margin-bottom: 48px; }
        .emb-set-head { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
        .emb-set-id { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: 30px; color: var(--text-muted, #8a849a); width: 36px; flex-shrink: 0; }
        .emb-set-name { font-family: 'Fraunces', Georgia, serif; font-size: 22px; color: var(--text, #eae6f5); margin: 0 0 3px; }
        .emb-set-note { font-size: 13.5px; color: var(--text-muted, #8a849a); margin: 0; }

        .emb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 760px) { .emb-grid { grid-template-columns: 1fr; } }

        .emb-cell {
          border: 1px solid var(--emb-bd); border-radius: 14px; background: var(--emb-card);
          display: flex; flex-direction: column; align-items: center;
          padding: 30px 20px 18px;
        }
        .emb-glyph {
          color: var(--ec); width: 132px; height: 132px;
          display: flex; align-items: center; justify-content: center;
          filter: drop-shadow(0 0 16px rgba(var(--erc), 0.28));
          margin-bottom: 18px;
        }
        .emb-glyph svg { width: 100%; height: 100%; }
        .emb-cell-label { text-align: center; }
        .emb-cell-name { display: block; font-family: 'Fraunces', Georgia, serif; font-size: 17px; color: var(--text, #eae6f5); }
        [data-theme="sepia"] .emb-cell-name { color: #2c1f0e; }
        .emb-cell-sub { display: block; font-family: var(--font-jetbrains), monospace; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--ec); opacity: .8; margin-top: 5px; }
      `}} />
    </>
  );
}
