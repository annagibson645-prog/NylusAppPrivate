// app/sparks/prototypes/page.tsx — gallery to compare the 6 Sparks-list redesigns.
import Link from "next/link";
import NavG from "@/components/NavG";

export const dynamic = "force-static";

const PROTOS = [
  { href: "/sparks/sp1", n: "01", name: "Quote Wall", desc: "A masonry wall of spark fragments at varying sizes — shows the writing itself best." },
  { href: "/sparks/sp2", n: "02", name: "The Stream", desc: "A dated commonplace-book feed down a left timeline rule; domain + subtype filters." },
  { href: "/sparks/sp3", n: "03", name: "Illuminated Index", desc: "Two-pane: sticky domain rail + numbered entries. The Council-page idiom. (currently live at /sparks)" },
  { href: "/sparks/sp4", n: "04", name: "Subtype Lens", desc: "Re-sorted by kind — resonance / essay-seed / question / speculative — each its own colored section." },
  { href: "/sparks/sp5", n: "05", name: "Ember Field", desc: "A flowing field of glowing spark-cards over drifting dust." },
  { href: "/sparks/sp6", n: "06", name: "Currents", desc: "Eight horizontal-scroll rivers, one per domain, led by a featured spark." },
];

export default function SparksPrototypes() {
  return (
    <>
      <NavG active="Sparks" />
      <div className="spg">
        <div className="spg-glow" aria-hidden />
        <main className="spg-page">
          <div className="spg-eyebrow">⚡ sparks · choose a layout</div>
          <h1 className="spg-title">Six ways to hold the sparks</h1>
          <p className="spg-lede">
            Six redesigns of the Sparks list, all in the site&rsquo;s style. Open each, toggle light/dark, then tell me
            which to keep. <strong>Illuminated Index</strong> is live at <code>/sparks</code> right now.
          </p>
          <div className="spg-list">
            {PROTOS.map((p) => (
              <Link key={p.href} href={p.href} className="spg-card">
                <span className="spg-num">{p.n}</span>
                <span className="spg-body">
                  <span className="spg-name">{p.name}</span>
                  <span className="spg-desc">{p.desc}</span>
                </span>
                <span className="spg-arrow">→</span>
              </Link>
            ))}
          </div>
        </main>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .spg{ --bg:#0e0d14; --ink:#eae6f5; --muted:#8a849a; --dim:#5a546b; --hair:rgba(255,255,255,0.08);
          --panel:rgba(255,255,255,0.022); --ac:#5fc9a8; --ac-rgb:95,201,168;
          position:relative; min-height:100vh; background:#0e0d14; color:var(--ink);
          font-family:var(--font-newsreader),Georgia,serif; overflow-x:hidden; }
        html[data-theme="sepia"] .spg{ --bg:#f0ead8; --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a;
          --hair:rgba(44,31,14,0.13); --panel:rgba(44,31,14,0.03); --ac:#246a55; --ac-rgb:36,106,85; background:#f0ead8; }
        .spg-glow{ position:fixed; inset:0; z-index:0; pointer-events:none;
          background:radial-gradient(110% 70% at 20% 4%, rgba(var(--ac-rgb),0.10), transparent 56%); }
        .spg-page{ position:relative; z-index:1; max-width:760px; margin:0 auto; padding:clamp(40px,6vw,72px) clamp(20px,5vw,40px) 120px; }
        .spg-eyebrow{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.32em;
          text-transform:uppercase; color:var(--ac); margin-bottom:18px; }
        .spg-title{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400;
          font-size:clamp(34px,5.4vw,52px); line-height:1.03; color:var(--ink); margin:0 0 16px; text-wrap:balance; }
        .spg-lede{ font-family:var(--font-newsreader),serif; font-size:17px; line-height:1.6; color:var(--muted);
          max-width:56ch; margin:0 0 44px; }
        .spg-lede code{ font-family:var(--font-jetbrains),monospace; font-size:13px; color:var(--ac); }
        .spg-lede strong{ color:var(--ink); font-weight:500; }
        .spg-list{ display:flex; flex-direction:column; gap:12px; }
        .spg-card{ display:flex; align-items:baseline; gap:20px; padding:20px 22px; border-radius:12px;
          text-decoration:none; color:inherit; border:1px solid var(--hair); background:var(--panel);
          transition:border-color .2s, transform .2s, background .2s; }
        .spg-card:hover{ border-color:rgba(var(--ac-rgb),0.5); background:rgba(var(--ac-rgb),0.05); transform:translateY(-2px); }
        .spg-card:focus-visible{ outline:1px solid var(--ac); outline-offset:3px; }
        .spg-num{ font-family:var(--font-fraunces),serif; font-style:italic; font-size:26px; color:var(--ac);
          flex-shrink:0; width:40px; font-variant-numeric:tabular-nums; }
        .spg-body{ flex:1; min-width:0; }
        .spg-name{ display:block; font-family:var(--font-fraunces),serif; font-size:21px; color:var(--ink); margin-bottom:5px; }
        .spg-desc{ display:block; font-size:14.5px; line-height:1.5; color:var(--muted); }
        .spg-arrow{ margin-left:auto; align-self:center; color:var(--dim); font-family:var(--font-jetbrains),monospace; flex-shrink:0; }
        .spg-card:hover .spg-arrow{ color:var(--ac); }
      `}} />
    </>
  );
}
