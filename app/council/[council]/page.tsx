// app/council/[council]/page.tsx
// The council page — "Illuminated Index": an asymmetric frontispiece rail beside
// a numbered list of seats. Data-driven for all three councils, both themes,
// solid themed backgrounds, seats link through to the member pages.

import { notFound } from "next/navigation";
import Link from "next/link";
import NavG from "@/components/NavG";
import { getCouncil, COUNCILS } from "@/lib/council-data";
import { Emblem } from "@/components/council/CouncilEmblems";
import CouncilStars from "@/components/council/CouncilStars";

export const dynamic = "force-static";
// Without this, unlisted params render on demand — which costs a serverless
// function, and the Hobby plan allows only 12 across the whole deployment.
export const dynamicParams = false;

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

  const rootStyle = {
    ["--ac0" as string]: council.color,
    ["--ac-rgb" as string]: council.colorRgb,
  } as React.CSSProperties;

  return (
    <>
      <NavG active="The Council" />
      <div className="ci-root" style={rootStyle}>
        <CouncilStars density={0.4} accent={council.color} />
        <div className="ci-glow" aria-hidden />
        <div className="ci-grain" aria-hidden />

        <main className="ci-page">
          {/* ── Frontispiece rail ── */}
          <aside className="ci-rail">
            <Link href="/council" className="ci-back">← The Council</Link>
            <div className="ci-emblem" aria-hidden>
              <Emblem kind={council.emblem} />
            </div>
            <p className="ci-kicker">{council.mode}</p>
            <h1 className="ci-title">{council.name}</h1>
            <p className="ci-tagline">{council.tagline}</p>
            <hr className="ci-hair" />
            <p className="ci-convene">{council.question}</p>
          </aside>

          {/* ── Seats ── */}
          <section className="ci-entries">
            {council.members.map((m, i) => (
              <Link
                key={m.slug}
                href={`/council/${council.key}/${m.slug}`}
                className="ci-entry"
              >
                <div className="ci-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="ci-body">
                  <p className="ci-carries">
                    {m.carries}
                    {m.living && <span className="ci-living"> · living figure</span>}
                  </p>
                  <h2 className="ci-name">{m.name}</h2>
                  <p className="ci-role">{m.seat}</p>
                  <p className="ci-question">{m.question}</p>
                  <p className="ci-blurb">{m.blurb}</p>
                  <span className="ci-enter">Enter the seat →</span>
                </div>
              </Link>
            ))}
          </section>
        </main>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ci-root{
          --ac: var(--ac0);
          --ink:#eae6f5; --muted:#8a849a; --dim:#494456;
          --hair:rgba(255,255,255,0.08); --emblem-bg:#0e0d14;
          position:relative; min-height:100vh; background:#0e0d14; color:var(--ink);
          font-family:var(--font-newsreader),Georgia,serif; line-height:1.55; overflow-x:hidden;
        }
        [data-theme="sepia"] .ci-root{
          --ac: color-mix(in srgb, var(--ac0) 72%, #2a1c06);
          --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a;
          --hair:rgba(44,31,14,0.12); --emblem-bg:#f0ead8;
          background:#f0ead8;
        }

        .ci-glow{
          position:fixed; inset:0; pointer-events:none; z-index:0;
          background:
            radial-gradient(120% 80% at 16% 6%, rgba(var(--ac-rgb),0.10), transparent 55%),
            radial-gradient(90% 70% at 94% 98%, rgba(var(--ac-rgb),0.05), transparent 60%);
        }
        .ci-grain{
          position:fixed; inset:0; pointer-events:none; z-index:1; opacity:0.035; mix-blend-mode:overlay;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        [data-theme="sepia"] .ci-grain{ opacity:0.05; }

        .ci-page{
          position:relative; z-index:2; max-width:1180px; margin:0 auto;
          padding:clamp(28px,6vw,80px) clamp(24px,5vw,72px) 140px;
          display:grid; grid-template-columns:38% 62%; column-gap:clamp(40px,5vw,88px); align-items:start;
        }

        .ci-rail{ position:sticky; top:clamp(28px,6vw,96px); padding-right:clamp(16px,2vw,40px); }
        .ci-back{
          display:inline-block; font-family:var(--font-jetbrains),monospace;
          font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--muted);
          text-decoration:none; margin-bottom:32px; transition:color .2s, transform .2s;
        }
        .ci-back:hover{ color:var(--ac); transform:translateX(-3px); }
        .ci-emblem{ color:var(--ac); width:clamp(74px,7vw,98px); height:clamp(74px,7vw,98px);
          margin-bottom:30px; filter:drop-shadow(0 0 18px rgba(var(--ac-rgb),0.22)); }
        .ci-emblem svg{ width:100%; height:100%; display:block; }
        .ci-kicker{ font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:0.42em;
          text-transform:uppercase; color:var(--ac); margin-bottom:22px; }
        .ci-title{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400;
          font-size:clamp(40px,5.4vw,68px); line-height:1.02; letter-spacing:-0.01em; color:var(--ink);
          text-wrap:balance; margin-bottom:22px; }
        .ci-tagline{ font-family:var(--font-newsreader),serif; font-style:italic;
          font-size:clamp(18px,2vw,22px); line-height:1.4; color:var(--muted); text-wrap:pretty; margin-bottom:30px; }
        .ci-hair{ height:1px; border:0; margin:0 0 26px;
          background:linear-gradient(90deg, rgba(var(--ac-rgb),0.55), rgba(var(--ac-rgb),0.06) 70%, transparent); }
        .ci-convene{ font-family:var(--font-jetbrains),monospace; font-weight:300; font-size:12.5px;
          line-height:1.85; letter-spacing:0.02em; color:var(--dim); text-wrap:pretty; max-width:34ch; }
        .ci-convene::before{ content:"⟡ convene"; display:block; color:var(--muted); letter-spacing:0.28em;
          text-transform:uppercase; font-size:10.5px; margin-bottom:10px; }

        .ci-entries{ padding-top:8px; }
        .ci-entry{
          position:relative; display:grid; grid-template-columns:auto 1fr; column-gap:clamp(20px,2.6vw,40px);
          padding:clamp(26px,3.2vw,42px) 0 clamp(26px,3.2vw,42px) clamp(18px,2vw,28px);
          border-top:1px solid var(--hair); text-decoration:none; color:inherit;
          transition:transform .6s cubic-bezier(0.16,1,0.3,1);
        }
        .ci-entry:first-child{ border-top:0; }
        .ci-entry:last-child{ border-bottom:1px solid var(--hair); }
        .ci-entry::before{ content:""; position:absolute; left:0; top:50%; transform:translateY(-50%);
          width:2px; height:0; opacity:0;
          background:linear-gradient(180deg, transparent, var(--ac), transparent);
          transition:height .6s cubic-bezier(0.16,1,0.3,1), opacity .6s ease; }
        .ci-num{ font-family:var(--font-fraunces),serif; font-style:italic; font-weight:400;
          font-size:clamp(34px,4vw,52px); line-height:1; color:var(--dim); font-variant-numeric:tabular-nums;
          padding-top:6px; transition:color .5s ease, text-shadow .5s ease; user-select:none; }
        .ci-body{ min-width:0; }
        .ci-carries{ font-family:var(--font-jetbrains),monospace; font-size:10.5px; letter-spacing:0.26em;
          text-transform:uppercase; color:var(--muted); margin-bottom:10px; }
        .ci-living{ color:var(--dim); letter-spacing:0.14em; }
        .ci-name{ font-family:var(--font-fraunces),serif; font-style:italic; font-weight:400;
          font-size:clamp(30px,3.6vw,46px); line-height:1.04; letter-spacing:-0.01em; color:var(--ink);
          transition:color .5s ease; margin-bottom:8px; text-wrap:balance; }
        .ci-role{ font-family:var(--font-jetbrains),monospace; font-weight:300; font-size:12px;
          letter-spacing:0.05em; color:var(--ac); opacity:0.82; margin-bottom:20px; }
        .ci-question{ font-family:var(--font-newsreader),serif; font-style:italic;
          font-size:clamp(18px,1.9vw,22px); line-height:1.45; color:var(--ink); text-wrap:pretty;
          margin-bottom:16px; max-width:46ch; }
        .ci-blurb{ font-family:var(--font-newsreader),serif; font-size:16px; line-height:1.62;
          color:var(--muted); text-wrap:pretty; max-width:54ch; }
        .ci-enter{ display:inline-block; margin-top:18px; font-family:var(--font-jetbrains),monospace;
          font-size:10.5px; letter-spacing:0.18em; text-transform:uppercase; color:var(--ac);
          opacity:0; transform:translateY(4px); transition:opacity .4s ease, transform .4s ease; }

        @media (hover:hover){
          .ci-entry:hover{ transform:translateX(6px); }
          .ci-entry:hover::before{ height:62%; opacity:1; }
          .ci-entry:hover .ci-num{ color:var(--ac); text-shadow:0 0 22px rgba(var(--ac-rgb),0.35); }
          .ci-entry:hover .ci-name{ color:color-mix(in srgb, var(--ac) 42%, var(--ink)); }
          .ci-entry:hover .ci-enter{ opacity:0.95; transform:translateY(0); }
        }

        .ci-rail, .ci-entry{ opacity:0; transform:translateY(18px); animation:ci-rise .9s cubic-bezier(0.16,1,0.3,1) forwards; }
        .ci-rail{ transform:translateY(14px); }
        .ci-entry:nth-child(1){ animation-delay:.34s; }
        .ci-entry:nth-child(2){ animation-delay:.46s; }
        .ci-entry:nth-child(3){ animation-delay:.58s; }
        @keyframes ci-rise{ to{ opacity:1; transform:none; } }
        @media (hover:hover){ .ci-entry{ will-change:transform; } }

        @media (max-width:860px){
          .ci-page{ grid-template-columns:1fr; row-gap:clamp(36px,8vw,60px); padding-bottom:120px; }
          .ci-rail{ position:static; top:auto; padding-right:0; }
          .ci-title{ font-size:clamp(38px,11vw,58px); }
          .ci-entry{ column-gap:18px; padding-left:14px; }
          .ci-num{ font-size:clamp(28px,9vw,42px); }
          .ci-name{ font-size:clamp(28px,8vw,40px); }
          .ci-enter{ opacity:0.9; transform:none; }
        }

        @media (prefers-reduced-motion:reduce){
          .ci-rail,.ci-entry{ opacity:1; transform:none; animation:none; }
          .ci-entry,.ci-entry::before,.ci-num,.ci-name,.ci-enter{ transition:none; }
          .ci-entry:hover{ transform:none; }
        }
      `,
        }}
      />
    </>
  );
}
