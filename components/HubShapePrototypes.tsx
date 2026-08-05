"use client";
// components/HubShapePrototypes.tsx — five candidate redesigns of the hub
// card's icon treatment, shown side-by-side on the same sample hubs so they
// can be compared directly. Nothing here is wired into /hubs yet.

import Link from "next/link";
import { pickHubIcon } from "@/lib/hubIcons";

export interface ProtoHub {
  id: string;
  title: string;
  domain: string;
  color: string;
  excerpt: string;
  covers: number;
}

const STYLE = `
  .hp-card {
    background: var(--h-bg2, #14131c);
    border: 1px solid var(--h-border, #2a2836);
    padding: 30px 24px 26px;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
    position: relative;
  }
  .hp-card:hover { background: var(--h-bg3, #1b1926); transform: translateY(-3px); }

  .hp-index {
    font-family: var(--font-jetbrains, 'JetBrains Mono', monospace);
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    opacity: 0.55; margin-bottom: 10px;
  }
  .hp-title {
    font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif);
    font-size: 24px; font-weight: 400; line-height: 1.2;
    color: var(--h-text, #ece9f5); margin: 0 0 18px;
  }
  .hp-excerpt {
    font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif);
    font-size: 16px; font-style: italic; line-height: 1.55;
    color: var(--h-text2, #a7a3b8); margin: 16px 0 14px;
  }
  .hp-count {
    font-family: var(--font-jetbrains, 'JetBrains Mono', monospace);
    font-size: 11px; letter-spacing: 0.14em; color: var(--h-text3, #6f6c80);
    margin-top: auto; padding-top: 10px;
  }

  /* ---- 1. Halo Circle ---- */
  @keyframes hpSpinRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .hp-halo { position: relative; width: 76px; height: 76px; display: flex; align-items: center; justify-content: center; }
  .hp-halo-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1px dashed var(--gc); opacity: 0.45;
    animation: hpSpinRing 22s linear infinite;
  }
  .hp-card:hover .hp-halo-ring { opacity: 0.9; animation-duration: 6s; }
  .hp-halo-fill {
    width: 58px; height: 58px; border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, color-mix(in srgb, var(--gc) 55%, transparent), color-mix(in srgb, var(--gc) 12%, transparent) 70%);
    border: 1px solid color-mix(in srgb, var(--gc) 55%, transparent);
    display: flex; align-items: center; justify-content: center; font-size: 26px;
    transition: box-shadow 0.3s ease;
  }
  .hp-card:hover .hp-halo-fill { box-shadow: 0 0 22px color-mix(in srgb, var(--gc) 60%, transparent); }

  /* ---- 2. Hex Seal ---- */
  .hp-hex {
    width: 68px; height: 68px;
    clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
    background: linear-gradient(160deg, color-mix(in srgb, var(--gc) 40%, transparent), color-mix(in srgb, var(--gc) 8%, transparent));
    border: 1px solid color-mix(in srgb, var(--gc) 50%, transparent);
    display: flex; align-items: center; justify-content: center; font-size: 26px;
    transition: transform 0.4s cubic-bezier(.2,.8,.3,1.3), box-shadow 0.3s ease;
  }
  .hp-card:hover .hp-hex { transform: rotate(12deg) scale(1.06); box-shadow: 0 0 18px color-mix(in srgb, var(--gc) 45%, transparent); }

  /* ---- 3. Arch Niche ---- */
  @keyframes hpFlicker { 0%,100% { opacity: 1; } 45% { opacity: 0.82; } 55% { opacity: 0.95; } 72% { opacity: 0.86; } }
  .hp-arch-wrap { display: flex; flex-direction: column; align-items: center; }
  .hp-arch {
    width: 60px; height: 72px;
    border-radius: 50% 50% 4px 4px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--gc) 30%, transparent), color-mix(in srgb, var(--gc) 6%, transparent));
    border: 1px solid color-mix(in srgb, var(--gc) 45%, transparent);
    border-bottom: none;
    display: flex; align-items: flex-start; justify-content: center; padding-top: 16px;
    font-size: 24px;
  }
  .hp-arch span { animation: hpFlicker 3.2s ease-in-out infinite; }
  .hp-arch-base { width: 76px; height: 4px; background: color-mix(in srgb, var(--gc) 55%, transparent); border-radius: 1px; }

  /* ---- 4. Liquid Blob ---- */
  @keyframes hpMorph {
    0%, 100% { border-radius: 62% 38% 37% 63% / 60% 35% 65% 40%; }
    50%      { border-radius: 40% 60% 63% 37% / 45% 62% 38% 55%; }
  }
  .hp-blob {
    width: 72px; height: 72px;
    background: radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--gc) 55%, transparent), color-mix(in srgb, var(--gc) 15%, transparent) 75%);
    border: 1px solid color-mix(in srgb, var(--gc) 45%, transparent);
    display: flex; align-items: center; justify-content: center; font-size: 26px;
    animation: hpMorph 7s ease-in-out infinite;
  }
  .hp-card:hover .hp-blob { animation-duration: 2.4s; }

  /* ---- 5. Compass Diamond ---- */
  .hp-diamond-wrap { width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; }
  .hp-diamond {
    width: 50px; height: 50px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--gc) 42%, transparent), color-mix(in srgb, var(--gc) 10%, transparent));
    border: 1px solid color-mix(in srgb, var(--gc) 55%, transparent);
    transform: rotate(45deg);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.5s cubic-bezier(.2,.7,.2,1.2);
    position: relative;
  }
  .hp-diamond::before {
    content: ""; position: absolute; inset: 6px;
    border: 1px solid color-mix(in srgb, var(--gc) 30%, transparent);
  }
  .hp-diamond span { transform: rotate(-45deg); font-size: 22px; }
  .hp-card:hover .hp-diamond { transform: rotate(135deg); }
  .hp-card:hover .hp-diamond span { transform: rotate(-135deg); }
`;

function Card({
  hub, index, variant, children,
}: { hub: ProtoHub; index: number; variant: string; children: React.ReactNode }) {
  const title = hub.title.replace(" — Map of Content", "").replace(/ Hub$/i, "");
  return (
    <Link href={`/hub/${hub.id}`} className="hp-card" style={{ "--gc": hub.color } as React.CSSProperties}>
      <div className="hp-index" style={{ color: hub.color }}>{String(index + 1).padStart(2, "0")}</div>
      <div className="hp-title">{title}</div>
      {children}
      <div className="hp-excerpt">{hub.excerpt.length > 90 ? hub.excerpt.slice(0, 90) + "…" : hub.excerpt}</div>
      <div className="hp-count">{hub.covers} concepts</div>
    </Link>
  );
}

function Section({
  n, name, blurb, hubs, render,
}: {
  n: number; name: string; blurb: string; hubs: ProtoHub[];
  render: (glyph: string) => React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 72 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--h-text3)", letterSpacing: "0.2em" }}>
          {String(n).padStart(2, "0")}
        </span>
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 26, fontStyle: "italic", fontWeight: 400, color: "var(--h-text)", margin: 0 }}>
          {name}
        </h2>
      </div>
      <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, fontStyle: "italic", color: "var(--h-text3)", margin: "0 0 24px", maxWidth: 640 }}>
        {blurb}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {hubs.map((h, i) => {
          const glyph = pickHubIcon(h.title, h.domain, i);
          return (
            <Card key={h.id} hub={h} index={i} variant={name}>
              {render(glyph)}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default function HubShapePrototypes({ hubs }: { hubs: ProtoHub[] }) {
  const sample = hubs.slice(0, 6);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      <Section
        n={1} name="Halo Circle" hubs={sample}
        blurb="A perfect circle with a slow-orbiting dashed ring, like a planet's rim. The ring speeds up and glows on hover — quiet by default, alive on approach."
        render={(g) => (
          <div className="hp-halo">
            <div className="hp-halo-ring" />
            <div className="hp-halo-fill"><span>{g}</span></div>
          </div>
        )}
      />

      <Section
        n={2} name="Hex Seal" hubs={sample}
        blurb="An angular faceted plate, like a wax seal or a coin. Tilts and lifts on hover rather than spinning — a firmer, more architectural feel than the circle."
        render={(g) => <div className="hp-hex"><span>{g}</span></div>}
      />

      <Section
        n={3} name="Arch Niche" hubs={sample}
        blurb="The icon sits inside a shrine alcove on a small base — closer to the vault's own temple/altar language. The glyph flickers gently, like a candle in the niche."
        render={(g) => (
          <div className="hp-arch-wrap">
            <div className="hp-arch"><span>{g}</span></div>
            <div className="hp-arch-base" />
          </div>
        )}
      />

      <Section
        n={4} name="Liquid Blob" hubs={sample}
        blurb="An organic, asymmetric membrane that never quite holds still — slowly morphing at rest, faster on hover. The warmest and least geometric of the five."
        render={(g) => <div className="hp-blob"><span>{g}</span></div>}
      />

      <Section
        n={5} name="Compass Diamond" hubs={sample}
        blurb="A rotated square with an inset facet, echoing the compass rose on /hubs itself. On hover it turns a quarter-turn like a needle finding a new bearing — the icon counter-rotates to stay upright."
        render={(g) => (
          <div className="hp-diamond-wrap">
            <div className="hp-diamond"><span>{g}</span></div>
          </div>
        )}
      />
    </>
  );
}
