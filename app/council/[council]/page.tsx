import { notFound } from "next/navigation";
import Link from "next/link";
import NavG from "@/components/NavG";
import { getCouncil, COUNCILS } from "@/lib/council-data";
import { Emblem } from "@/components/council/CouncilEmblems";
import CouncilStars from "@/components/council/CouncilStars";

export const dynamic = "force-static";

export function generateStaticParams() {
  return COUNCILS.map((c) => ({ council: c.key }));
}

export default async function CouncilPage({
  params,
}: {
  params: Promise<{ council: string }>;
}) {
  const { council: key } = await params;
  const council = getCouncil(key);
  if (!council) notFound();

  const cssVars = {
    "--domain-color": council.color,
    "--domain-color-rgb": council.colorRgb,
    "--emblem-bg": "#0e0d14",
  } as React.CSSProperties;

  return (
    <>
      <NavG active="The Council" />
      <div className="void-page council-page" style={cssVars}>
        <div className="void-ambient" />
        <CouncilStars density={0.5} accent={council.color} />

        <div className="council-inner">
          {/* Back */}
          <Link href="/council" className="council-back">
            ← The Council
          </Link>

          {/* Centered header — name at top, large emblem beneath */}
          <header className="council-head">
            <div className="council-domain-chip">{council.mode}</div>
            <h1 className="council-title">{council.name}</h1>
            <div className="council-emblem-mark" aria-hidden>
              <Emblem kind={council.emblem} />
            </div>
            <p className="council-lede">{council.tagline}</p>
            <p className="council-sub">{council.question}</p>
          </header>

          {/* Seats */}
          <div className="council-seats">
            {council.members.map((m) => (
              <Link key={m.slug} href={`/council/${council.key}/${m.slug}`} className="seat-card">
                <div className="seat-top">
                  <span className="seat-carries">{m.carries}</span>
                  {m.living && <span className="seat-living">living figure</span>}
                </div>
                <h2 className="seat-name">{m.name}</h2>
                <p className="seat-role">{m.seat}</p>
                <blockquote className="seat-question">“{m.question}”</blockquote>
                <p className="seat-blurb">{m.blurb}</p>
                <span className="seat-enter">Enter the seat →</span>
              </Link>
            ))}
          </div>

          <p className="council-convene">{council.convene}</p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .council-page { position: relative; min-height: 100vh; background: transparent; }
        .council-inner {
          position: relative; z-index: 2;
          max-width: 1120px; margin: 0 auto;
          padding: 56px clamp(20px,5vw,64px) 160px;
        }
        .council-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
          color: #494456; text-decoration: none; margin-bottom: 40px;
          transition: color .2s;
        }
        .council-back:hover { color: var(--domain-color); }

        /* Centered header */
        .council-head {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; margin-bottom: 60px;
        }
        .council-emblem-mark {
          color: var(--domain-color);
          width: clamp(112px, 16vw, 168px); height: clamp(112px, 16vw, 168px);
          margin: 26px 0 4px; opacity: .92;
          filter: drop-shadow(0 0 22px rgba(var(--domain-color-rgb), 0.25));
        }
        .council-emblem-mark svg { width: 100%; height: 100%; }

        .council-domain-chip {
          font-family: var(--font-jetbrains), monospace;
          font-size: 11px; letter-spacing: .28em; text-transform: uppercase;
          color: var(--domain-color); opacity: .85; margin-bottom: 16px;
        }
        .council-title {
          font-family: 'Fraunces', Georgia, serif; font-style: italic;
          font-weight: 400; font-size: clamp(38px, 6vw, 64px);
          line-height: 1.04; color: #eae6f5; margin: 0;
          letter-spacing: -0.01em;
        }
        .council-lede {
          font-family: 'Newsreader', Georgia, serif;
          font-size: clamp(19px, 2.4vw, 25px); line-height: 1.5;
          color: #cdc8dd; max-width: 680px;
          margin: 26px auto 0;
        }
        .council-sub {
          font-size: 15px; line-height: 1.6; color: #8a849a;
          max-width: 620px; margin: 14px auto 0;
        }

        .council-seats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px; margin-bottom: 56px;
        }
        @media (max-width: 880px) { .council-seats { grid-template-columns: 1fr; } }

        .seat-card {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 26px 24px 28px;
          background: rgba(20,18,28,0.55);
          backdrop-filter: blur(3px);
          display: flex; flex-direction: column;
          text-decoration: none; color: inherit;
          transition: border-color .25s, transform .25s, background .25s;
        }
        .seat-enter {
          margin-top: 20px;
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
          color: var(--domain-color); opacity: 0; transform: translateY(4px);
          transition: opacity .25s, transform .25s;
        }
        .seat-card:hover .seat-enter { opacity: .95; transform: translateY(0); }
        [data-theme="sepia"] .seat-card { background: rgba(240,234,216,0.7); }
        .seat-card:hover {
          border-color: color-mix(in srgb, var(--domain-color) 55%, transparent);
          background: rgba(var(--domain-color-rgb), .05);
          transform: translateY(-3px);
        }
        .seat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .seat-carries {
          font-family: var(--font-jetbrains), monospace;
          font-size: 9.5px; letter-spacing: .2em; text-transform: uppercase;
          color: var(--domain-color);
          border: 1px solid color-mix(in srgb, var(--domain-color) 35%, transparent);
          border-radius: 999px; padding: 4px 10px;
        }
        .seat-living {
          font-family: var(--font-jetbrains), monospace;
          font-size: 8.5px; letter-spacing: .14em; text-transform: uppercase;
          color: #6a6478;
        }
        .seat-name {
          font-family: 'Fraunces', Georgia, serif; font-style: italic;
          font-weight: 400; font-size: 28px; color: #eae6f5; margin: 0 0 4px;
        }
        .seat-role {
          font-size: 12.5px; color: #8a849a; margin: 0 0 18px;
          letter-spacing: .01em;
        }
        .seat-question {
          font-family: 'Newsreader', Georgia, serif; font-style: italic;
          font-size: 16.5px; line-height: 1.45; color: var(--domain-color);
          margin: 0 0 16px; padding: 0;
        }
        .seat-blurb { font-size: 13.5px; line-height: 1.62; color: #9a93a8; margin: auto 0 0; }

        .council-convene {
          font-family: 'Newsreader', Georgia, serif; font-style: italic;
          font-size: 16px; line-height: 1.6; color: #8a849a;
          max-width: 760px; padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        /* ── Parchment ── */
        [data-theme="sepia"] .council-title { color: #2c1f0e; }
        [data-theme="sepia"] .council-lede  { color: #5c4a2a; }
        [data-theme="sepia"] .council-sub   { color: #8b7355; }
        [data-theme="sepia"] .seat-card {
          border-color: #d8cdb8; background: #f0ead8;
        }
        [data-theme="sepia"] .seat-card:hover {
          border-color: color-mix(in srgb, var(--domain-color) 55%, transparent);
          background: #e8dfc8;
        }
        [data-theme="sepia"] .seat-name { color: #1e1408; }
        [data-theme="sepia"] .seat-role { color: #8b7355; }
        [data-theme="sepia"] .seat-blurb { color: #5c4a2a; }
        [data-theme="sepia"] .seat-living { color: #a89878; }
        [data-theme="sepia"] .council-convene { color: #6b5a3a; border-top-color: #d8cdb8; }
        [data-theme="sepia"] .council-back { color: #a89878; }
      `,
        }}
      />
    </>
  );
}
