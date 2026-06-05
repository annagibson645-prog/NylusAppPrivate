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
      <div className="council-page" style={cssVars}>
        <div className="glow" />
        <div className="grain" />
        <CouncilStars density={0.5} accent={council.color} />

        <main className="page-layout">
          {/* LEFT RAIL / FRONTISPIECE */}
          <aside className="rail">
            {/* Back */}
            <Link href="/council" className="council-back">
              ← The Council
            </Link>

            <div className="emblem-wrapper" aria-hidden="true">
              <Emblem kind={council.emblem} className="emblem" />
            </div>

            <p className="kicker">{council.mode}</p>
            <h1 className="title">{council.name}</h1>
            <p className="tagline">{council.tagline}</p>
            <hr className="hair" />
            <p className="convene">{council.convene}</p>
          </aside>

          {/* RIGHT / ENTRIES */}
          <section className="entries">
            {council.members.map((m, i) => (
              <Link key={m.slug} href={`/council/${council.key}/${m.slug}`} className="entry">
                <div className="num">{(i + 1).toString().padStart(2, "0")}</div>
                <div className="body">
                  <p className="carries">{m.carries}</p>
                  <h2 className="name">{m.name}</h2>
                  <p className="role">{m.seat}</p>
                  <p className="question">{m.question}</p>
                  <p className="blurb">{m.blurb}</p>
                  <span className="seat-enter">Enter the seat →</span>
                </div>
              </Link>
            ))}
          </section>
        </main>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .council-page {
          background: #0e0d14;
          color: #eae6f5;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        /* ---- Atmosphere ---- */
        .glow {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(120% 80% at 18% 8%, rgba(var(--domain-color-rgb), 0.10), transparent 55%),
            radial-gradient(90% 70% at 92% 96%, rgba(var(--domain-color-rgb), 0.05), transparent 60%),
            radial-gradient(140% 120% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%);
        }
        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.035;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* ---- Layout ---- */
        .page-layout {
          position: relative;
          z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
          padding: clamp(32px, 7vw, 96px) clamp(24px, 5vw, 72px) 120px;
          display: grid;
          grid-template-columns: 38% 62%;
          column-gap: clamp(40px, 5vw, 88px);
          align-items: start;
        }

        /* ---- Left rail / frontispiece ---- */
        .rail {
          position: sticky;
          top: clamp(32px, 7vw, 96px);
          padding-right: clamp(16px, 2vw, 40px);
        }
        
        .council-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #494456;
          text-decoration: none;
          margin-bottom: 40px;
          transition: color .2s;
        }
        .council-back:hover { color: var(--domain-color); }

        .emblem-wrapper {
          color: var(--domain-color);
          width: clamp(72px, 7vw, 96px);
          height: clamp(72px, 7vw, 96px);
          margin-bottom: 32px;
          filter: drop-shadow(0 0 18px rgba(var(--domain-color-rgb), 0.22));
        }
        .emblem {
          width: 100%;
          height: 100%;
        }

        .kicker {
          font-family: var(--font-jetbrains), monospace;
          font-weight: 400;
          font-size: 12px;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          color: var(--domain-color);
          margin: 0 0 24px 0;
        }
        .title {
          font-family: var(--font-fraunces), serif;
          font-style: italic;
          font-weight: 400;
          font-size: clamp(40px, 5.4vw, 68px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          color: #eae6f5;
          text-wrap: balance;
          margin: 0 0 24px 0;
        }
        .tagline {
          font-family: var(--font-newsreader), serif;
          font-style: italic;
          font-size: clamp(18px, 2vw, 22px);
          line-height: 1.4;
          color: #8a849a;
          text-wrap: pretty;
          margin: 0 0 32px 0;
        }
        .hair {
          height: 1px;
          border: 0;
          background: linear-gradient(90deg, rgba(var(--domain-color-rgb), 0.55), rgba(var(--domain-color-rgb), 0.06) 70%, transparent);
          margin: 0 0 28px;
        }
        .convene {
          font-family: var(--font-jetbrains), monospace;
          font-weight: 300;
          font-size: 12.5px;
          line-height: 1.85;
          letter-spacing: 0.02em;
          color: #494456;
          text-wrap: pretty;
          max-width: 34ch;
          margin: 0;
        }
        .convene::before {
          content: "⟡ convene";
          display: block;
          color: #8a849a;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          font-size: 10.5px;
          margin-bottom: 10px;
        }

        /* ---- Right column / entries ---- */
        .entries {
          padding-top: 8px;
        }
        .entry {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: clamp(20px, 2.6vw, 40px);
          padding: clamp(28px, 3.4vw, 44px) 0 clamp(28px, 3.4vw, 44px) clamp(18px, 2vw, 28px);
          border-top: 1px solid rgba(255,255,255,0.08);
          transition: transform .6s cubic-bezier(0.16,1,0.3,1);
          text-decoration: none;
          color: inherit;
        }
        .entry:first-child { border-top: 0; }
        .entry:last-child {
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        /* growing left rule */
        .entry::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 0;
          background: linear-gradient(180deg, transparent, var(--domain-color), transparent);
          transition: height .6s cubic-bezier(0.16,1,0.3,1), opacity .6s ease;
          opacity: 0;
        }
        .num {
          font-family: var(--font-fraunces), serif;
          font-style: italic;
          font-weight: 400;
          font-size: clamp(34px, 4vw, 52px);
          line-height: 1;
          color: #494456;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum" 1;
          padding-top: 6px;
          transition: color .5s ease, text-shadow .5s ease;
          user-select: none;
        }
        .body { min-width: 0; }
        .carries {
          font-family: var(--font-jetbrains), monospace;
          font-weight: 400;
          font-size: 10.5px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #8a849a;
          margin: 0 0 10px 0;
        }
        .name {
          font-family: var(--font-fraunces), serif;
          font-style: italic;
          font-weight: 400;
          font-size: clamp(30px, 3.6vw, 46px);
          line-height: 1.04;
          letter-spacing: -0.01em;
          color: #eae6f5;
          transition: color .5s ease;
          margin: 0 0 8px 0;
          text-wrap: balance;
        }
        .role {
          font-family: var(--font-jetbrains), monospace;
          font-weight: 300;
          font-size: 12px;
          letter-spacing: 0.05em;
          color: var(--domain-color);
          opacity: 0.78;
          margin: 0 0 20px 0;
        }
        .question {
          font-family: var(--font-newsreader), serif;
          font-style: italic;
          font-size: clamp(18px, 1.9vw, 22px);
          line-height: 1.45;
          color: #eae6f5;
          text-wrap: pretty;
          margin: 0 0 16px 0;
          max-width: 46ch;
        }
        .blurb {
          font-family: var(--font-newsreader), serif;
          font-size: 16px;
          line-height: 1.62;
          color: #8a849a;
          text-wrap: pretty;
          max-width: 54ch;
          margin: 0;
        }
        
        .seat-enter {
          display: block;
          margin-top: 24px;
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: var(--domain-color);
          opacity: 0;
          transform: translateY(4px);
          transition: opacity .4s ease, transform .4s ease;
        }

        /* ---- Hover ---- */
        @media (hover: hover) {
          .entry:hover { transform: translateX(6px); }
          .entry:hover::before { height: 62%; opacity: 1; }
          .entry:hover .num {
            color: var(--domain-color);
            text-shadow: 0 0 22px rgba(var(--domain-color-rgb), 0.35);
          }
          .entry:hover .name {
            color: color-mix(in srgb, #fff 80%, var(--domain-color));
          }
          .entry:hover .seat-enter {
            opacity: .95;
            transform: translateY(0);
          }
        }

        /* ---- Load motion ---- */
        .rail, .entry {
          opacity: 0;
          transform: translateY(18px);
          animation: rise .9s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .rail { transform: translateY(14px); }
        .entry { animation-delay: .28s; }
        .entry:nth-child(1) { animation-delay: .34s; }
        .entry:nth-child(2) { animation-delay: .46s; }
        .entry:nth-child(3) { animation-delay: .58s; }
        @keyframes rise {
          to { opacity: 1; transform: none; }
        }
        /* keep hover transform after load */
        @media (hover: hover) {
          .entry { will-change: transform; }
        }

        /* ---- Responsive ---- */
        @media (max-width: 860px) {
          .page-layout {
            grid-template-columns: 1fr;
            row-gap: clamp(40px, 8vw, 64px);
            padding-bottom: 96px;
          }
          .rail {
            position: static;
            top: auto;
            padding-right: 0;
          }
          .title { font-size: clamp(38px, 11vw, 58px); }
          .entry { column-gap: 18px; padding-left: 14px; }
          .num { font-size: clamp(28px, 9vw, 42px); }
          .name { font-size: clamp(28px, 8vw, 40px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .rail, .entry {
            opacity: 1;
            transform: none;
            animation: none;
          }
          .entry { transition: none; }
          .entry::before { transition: none; }
          .num, .name { transition: none; }
          .entry:hover { transform: none; }
        }

        /* ── Parchment / Sepia Theme adjustments ── */
        [data-theme="sepia"] .council-page {
          background: #f0ead8;
          color: #2c1f0e;
        }
        [data-theme="sepia"] .title { color: #2c1f0e; }
        [data-theme="sepia"] .tagline { color: #5c4a2a; }
        [data-theme="sepia"] .convene { color: #6b5a3a; }
        [data-theme="sepia"] .convene::before { color: #8b7355; }
        [data-theme="sepia"] .council-back { color: #a89878; }
        [data-theme="sepia"] .num { color: #a89878; }
        [data-theme="sepia"] .carries { color: #8b7355; }
        [data-theme="sepia"] .name { color: #1e1408; }
        [data-theme="sepia"] .question { color: #2c1f0e; }
        [data-theme="sepia"] .blurb { color: #5c4a2a; }
        [data-theme="sepia"] .hair {
          background: linear-gradient(90deg, rgba(var(--domain-color-rgb), 0.55), rgba(var(--domain-color-rgb), 0.06) 70%, transparent);
        }
        [data-theme="sepia"] .entry { border-color: #d8cdb8; }
        [data-theme="sepia"] .entry:last-child { border-bottom-color: #d8cdb8; }
        [data-theme="sepia"] .glow {
          background:
            radial-gradient(120% 80% at 18% 8%, rgba(var(--domain-color-rgb), 0.05), transparent 55%),
            radial-gradient(90% 70% at 92% 96%, rgba(var(--domain-color-rgb), 0.03), transparent 60%),
            radial-gradient(140% 120% at 50% 50%, transparent 40%, rgba(240,234,216,0.45) 100%);
        }
      `,
        }}
      />
    </>
  );
}

