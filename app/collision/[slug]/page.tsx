import { idsOfType, loadVaultJSON } from "@/lib/vault-json";
import { readFileSync } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { VaultNode, GraphData } from "@/lib/types";
import NavG from "@/components/NavG";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return idsOfType("collision").map((slug) => ({ slug }));
}

function loadJSON<T>(file: string): T {
  return loadVaultJSON<T>(file);
}

const DOMAIN_COLOR: Record<string, string> = {
  "cross-domain": "#38bdf8", "psychology": "#3b82f6", "eastern-spirituality": "#dc2626",
  "behavioral-mechanics": "#f97316", "creative-practice": "#14b8a6", "history": "#f59e0b",
  "african-spirituality": "#10b981", "business": "#e879a0", "occult": "#d95ae8",
};
const DOMAIN_RGB: Record<string, string> = {
  "cross-domain": "56,189,248", "psychology": "59,130,246", "eastern-spirituality": "220,38,38",
  "behavioral-mechanics": "249,115,22", "creative-practice": "20,184,166", "history": "245,158,11",
  "african-spirituality": "16,185,129", "business": "232,121,160", "occult": "217,90,232",
};
const DOMAIN_LABEL: Record<string, string> = {
  "cross-domain": "Cross-Domain", "psychology": "Psychology", "eastern-spirituality": "Eastern Spirituality",
  "behavioral-mechanics": "Behavioral Mechanics", "creative-practice": "Creative Practice", "history": "History",
  "african-spirituality": "African Spirituality", "business": "Business", "occult": "Occult",
};

function hexToRgb(hex: string): string {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
function cleanTitle(t: string) { return t.replace(/^Collision:\s*/i, ""); }

function parseSections(content: string): Record<string, string> {
  const body = content.replace(/^---[\s\S]*?---\n?/, "").replace(/^#[^\n]+\n/, "");
  const result: Record<string, string> = {};
  body.split(/\n##\s+/).forEach((part) => {
    const nl = part.indexOf("\n");
    if (nl === -1) return;
    result[part.slice(0, nl).trim().toLowerCase()] = part.slice(nl + 1).trim();
  });
  return result;
}
function stripMd(s: string): string {
  return s
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}
function paragraphs(s: string): string[] {
  return stripMd(s).split(/\n{2,}/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
}
function lines(s: string): string[] {
  return stripMd(s).split(/\n+/).map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
}

const CSS = `
  .cx{
    --bg:#0e0d14; --ink:#eae6f5; --muted:#8a849a; --dim:#5a546b;
    --hair:rgba(255,255,255,0.09); --panel:rgba(255,255,255,0.022);
    --counter:150,165,210;
    --ac: var(--ac0);
    position:relative; min-height:100vh; background:var(--bg); color:var(--ink);
    font-family:var(--font-newsreader),Georgia,serif; line-height:1.6; overflow-x:hidden;
  }
  [data-theme="sepia"] .cx{
    --bg:#f0ead8; --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a;
    --hair:rgba(44,31,14,0.13); --panel:rgba(44,31,14,0.025);
    --counter:150,120,70;
    /* deepen the accent for readable small mono labels on cream (light domains
       like sky/teal/green otherwise fail AA contrast) */
    --ac: color-mix(in srgb, var(--ac0) 56%, #14100a);
    background:#f0ead8;
  }

  /* ── Atmosphere: two currents colliding ── */
  .cx-bg{ position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
  .cx-cur{ position:absolute; width:86vw; height:86vw; max-width:1100px; max-height:1100px;
    border-radius:50%; filter:blur(8px); will-change:transform,opacity; }
  .cx-a{ top:-26vw; left:-22vw;
    background:radial-gradient(circle at 50% 50%, rgba(var(--ac-rgb),0.26), rgba(var(--ac-rgb),0.07) 42%, transparent 66%);
    animation:cxSweepA 1.7s cubic-bezier(0.16,1,0.3,1) both, cxDriftA 19s ease-in-out 1.7s infinite alternate; }
  .cx-b{ bottom:-26vw; right:-22vw;
    background:radial-gradient(circle at 50% 50%, rgba(var(--counter),0.20), rgba(var(--counter),0.05) 42%, transparent 66%);
    animation:cxSweepB 1.9s cubic-bezier(0.16,1,0.3,1) both, cxDriftB 23s ease-in-out 1.9s infinite alternate; }
  [data-theme="sepia"] .cx-a{ background:radial-gradient(circle at 50% 50%, rgba(var(--ac-rgb),0.20), rgba(var(--ac-rgb),0.05) 42%, transparent 66%); }
  [data-theme="sepia"] .cx-b{ background:radial-gradient(circle at 50% 50%, rgba(var(--counter),0.16), rgba(var(--counter),0.04) 42%, transparent 66%); }
  .cx-impact{ position:absolute; top:32%; left:50%; width:46vw; height:46vw; max-width:620px; max-height:620px;
    transform:translate(-50%,-50%); border-radius:50%;
    background:radial-gradient(circle, rgba(var(--ac-rgb),0.22), rgba(var(--ac-rgb),0.05) 38%, transparent 62%);
    animation:cxFlare 1.4s cubic-bezier(0.16,1,0.3,1) both, cxPulse 7s ease-in-out 1.4s infinite; }
  [data-theme="sepia"] .cx-impact{ background:radial-gradient(circle, rgba(var(--ac-rgb),0.14), transparent 60%); }
  .cx-grain{ position:fixed; inset:0; z-index:1; pointer-events:none; opacity:0.04; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  [data-theme="sepia"] .cx-grain{ opacity:0.06; }
  .cx-dust i{ position:fixed; z-index:1; width:2px; height:2px; border-radius:50%;
    background:rgba(var(--ac-rgb),0.7); box-shadow:0 0 6px rgba(var(--ac-rgb),0.6); pointer-events:none;
    animation:cxTwinkle 5s ease-in-out infinite; }

  @keyframes cxSweepA{ from{ opacity:0; transform:translate(-14vw,-10vw) scale(.7);} to{ opacity:1; transform:none;} }
  @keyframes cxSweepB{ from{ opacity:0; transform:translate(14vw,10vw) scale(.7);} to{ opacity:1; transform:none;} }
  @keyframes cxDriftA{ from{ transform:translate(0,0);} to{ transform:translate(6vw,4vw);} }
  @keyframes cxDriftB{ from{ transform:translate(0,0);} to{ transform:translate(-6vw,-4vw);} }
  @keyframes cxFlare{ from{ opacity:0; transform:translate(-50%,-50%) scale(.4);} to{ opacity:1; transform:translate(-50%,-50%) scale(1);} }
  @keyframes cxPulse{ 0%,100%{ opacity:.7; } 50%{ opacity:1; transform:translate(-50%,-50%) scale(1.06);} }
  @keyframes cxTwinkle{ 0%,100%{ opacity:.15; } 50%{ opacity:.9; } }

  /* ── Reading column ── */
  .cx-page{ position:relative; z-index:2; max-width:760px; margin:0 auto; padding:clamp(40px,7vw,84px) clamp(22px,5vw,40px) 140px; }

  .cx-back{ display:inline-flex; align-items:center; gap:7px; font-family:var(--font-jetbrains),monospace;
    font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--muted); text-decoration:none;
    padding:11px 4px; margin:-11px 0 clamp(30px,6vw,62px) -4px; transition:color .2s, transform .2s; }
  .cx-back:hover{ color:var(--ac); transform:translateX(-3px); }
  .cx-back:focus-visible{ outline:1px solid var(--ac); outline-offset:4px; border-radius:2px; }

  .cx-meta{ display:flex; align-items:center; gap:14px; margin-bottom:26px; }
  .cx-chip{ display:inline-flex; align-items:center; gap:8px; font-family:var(--font-jetbrains),monospace;
    font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--ac); }
  .cx-chip::before{ content:""; width:7px; height:7px; border-radius:50%; background:var(--ac);
    box-shadow:0 0 10px rgba(var(--ac-rgb),0.8); }
  .cx-date{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.06em; color:var(--dim);
    margin-left:auto; }

  .cx-eyebrow{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.34em;
    text-transform:uppercase; color:var(--dim); margin-bottom:22px; display:flex; align-items:center; gap:12px; }
  .cx-eyebrow::after{ content:""; flex:1; height:1px;
    background:linear-gradient(90deg, var(--hair), transparent); }

  .cx-title{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400;
    font-size:clamp(40px,6.6vw,76px); line-height:1.02; letter-spacing:-0.02em; color:var(--ink);
    text-wrap:balance; margin:0 0 28px; font-feature-settings:"liga" 1,"dlig" 1; }
  .cx-lede{ font-family:var(--font-newsreader),serif; font-size:clamp(19px,2.3vw,24px); line-height:1.55;
    color:var(--muted); text-wrap:pretty; margin:0 0 34px; max-width:60ch; }

  .cx-charge{ display:flex; align-items:center; gap:14px; padding:18px 0 0; border-top:1px solid var(--hair); }
  .cx-meter{ display:flex; gap:4px; }
  .cx-seg{ width:18px; height:3px; border-radius:2px; background:var(--hair); }
  .cx-seg.on{ background:var(--ac); box-shadow:0 0 8px rgba(var(--ac-rgb),0.5); }
  .cx-charge-lbl{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.08em;
    color:var(--muted); }
  .cx-status{ font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:0.14em;
    text-transform:uppercase; color:var(--dim); margin-left:auto; }

  .cx-sec{ margin-top:clamp(48px,7vw,76px); }
  .cx-sec-label{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.26em;
    text-transform:uppercase; color:var(--ac); opacity:0.9; margin-bottom:20px; }
  .cx-p{ font-family:var(--font-newsreader),serif; font-size:18.5px; line-height:1.75; color:var(--ink);
    text-wrap:pretty; margin:0 0 20px; }
  .cx-p:last-child{ margin-bottom:0; }

  /* Sources in tension — two stacked, with a meeting glyph */
  .cx-tension{ position:relative; padding-left:26px; }
  .cx-tension::before{ content:""; position:absolute; left:0; top:6px; bottom:6px; width:2px;
    background:linear-gradient(180deg, var(--ac), rgba(var(--ac-rgb),0.15)); border-radius:2px; }
  .cx-tension .cx-p{ font-style:italic; color:var(--muted); }

  /* Candidate idea — the luminous payoff */
  .cx-idea{ position:relative; margin-top:clamp(48px,7vw,76px); padding:clamp(30px,4vw,44px) clamp(26px,4vw,44px);
    border:1px solid rgba(var(--ac-rgb),0.32); border-radius:6px;
    background:linear-gradient(180deg, rgba(var(--ac-rgb),0.07), rgba(var(--ac-rgb),0.02));
    overflow:hidden; }
  .cx-idea::before{ content:"✦"; position:absolute; top:-14px; left:clamp(26px,4vw,44px);
    font-size:24px; color:var(--ac); background:var(--bg); padding:0 8px; line-height:28px;
    text-shadow:0 0 14px rgba(var(--ac-rgb),0.7); }
  .cx-idea-label{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.26em;
    text-transform:uppercase; color:var(--ac); margin-bottom:18px; }
  .cx-idea .cx-p{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400;
    font-size:clamp(20px,2.4vw,26px); line-height:1.4; color:var(--ink); }

  /* What would need to be true — conditions list */
  .cx-cond{ list-style:none; padding:0; margin:0; }
  .cx-cond li{ position:relative; padding:16px 0 16px 30px; border-bottom:1px solid var(--hair);
    font-family:var(--font-newsreader),serif; font-size:17px; line-height:1.6; color:var(--ink); text-wrap:pretty; }
  .cx-cond li:last-child{ border-bottom:0; }
  .cx-cond li::before{ content:""; position:absolute; left:2px; top:24px; width:9px; height:9px;
    border:1.5px solid var(--ac); border-radius:50%; }

  /* Connected */
  .cx-conn{ margin-top:clamp(48px,7vw,76px); }
  .cx-conn a{ display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid var(--hair);
    text-decoration:none; transition:padding .25s cubic-bezier(0.16,1,0.3,1); }
  .cx-conn a:hover{ padding-left:8px; }
  .cx-conn a:focus-visible{ outline:1px solid var(--ac); outline-offset:2px; }
  .cx-dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .cx-conn-type{ font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:0.12em;
    text-transform:uppercase; width:108px; flex-shrink:0; }
  .cx-conn-title{ font-family:var(--font-newsreader),serif; font-style:italic; font-size:16.5px;
    color:var(--muted); transition:color .25s; }
  .cx-conn a:hover .cx-conn-title{ color:var(--ink); }

  .cx-foot{ margin-top:clamp(56px,8vw,84px); }

  /* Load stagger */
  .cx-rise{ opacity:0; transform:translateY(20px); animation:cxRise .9s cubic-bezier(0.16,1,0.3,1) forwards; }
  .cx-rise.d1{ animation-delay:.15s; } .cx-rise.d2{ animation-delay:.26s; }
  .cx-rise.d3{ animation-delay:.37s; } .cx-rise.d4{ animation-delay:.48s; }
  @keyframes cxRise{ to{ opacity:1; transform:none; } }

  @media (max-width:560px){ .cx-conn-type{ width:84px; } .cx-date{ display:none; } }

  @media (prefers-reduced-motion:reduce){
    .cx-cur,.cx-impact,.cx-dust i,.cx-rise{ animation:none !important; }
    .cx-rise{ opacity:1; transform:none; }
    .cx-cur,.cx-impact{ opacity:1; }
    .cx-cur.cx-a{ transform:none; } .cx-cur.cx-b{ transform:none; }
    .cx-impact{ transform:translate(-50%,-50%); }
  }
`;

const DUST = [
  { l: "18%", t: "26%", d: "0s" }, { l: "72%", t: "20%", d: "1.4s" }, { l: "60%", t: "44%", d: "2.6s" },
  { l: "30%", t: "60%", d: "0.8s" }, { l: "84%", t: "56%", d: "3.4s" }, { l: "44%", t: "32%", d: "1.9s" },
];

export default async function CollisionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { nodes } = loadJSON<GraphData>("graph.json");
  const node = nodes.find((n) => n.id === slug && n.type === "collision");
  if (!node) notFound();

  const col = node.color || DOMAIN_COLOR[node.domain] || "#8b5cf6";
  const colRgb = DOMAIN_RGB[node.domain] || hexToRgb(col);
  const score = node.pressure_score ?? 0;
  const charge = Math.min(Math.max(Math.round((score / 14) * 10), 1), 10);

  const collisionsData = loadJSON<VaultNode[]>("collisions.json");
  const content = collisionsData.find((n) => n.id === slug)?.content ?? "";
  const sections = parseSections(content);

  const sourceTensions = sections["source tensions"] || "";
  const collisionBody = sections["the collision"] || sections["collision"] || "";
  const candidateIdea = sections["candidate idea"] || node.candidate_idea || "";
  const needsTrue = sections["what would need to be true"] || "";

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const connected = [...node.links, ...node.backlinks]
    .map((id) => nodeMap.get(id))
    .filter(Boolean)
    .filter((n, i, arr) => arr.findIndex((x) => x!.id === n!.id) === i) as VaultNode[];

  const rootStyle = {
    ["--ac0" as string]: col,
    ["--ac-rgb" as string]: colRgb,
  } as React.CSSProperties;

  const hrefFor = (n: VaultNode) =>
    n.type === "collision" ? `/collision/${n.id}` :
    n.type === "source" ? `/source/${n.id}` :
    n.type === "spark" ? `/spark/${n.id}` :
    n.type === "essay" ? `/essay/${n.id}` :
    `/concept/${n.id}`;

  return (
    <div className="cx" style={rootStyle}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavG
        active="Collisions"
        right={
          <span className="cx-chip" style={{ fontSize: 10 }}>{DOMAIN_LABEL[node.domain] || node.domain}</span>
        }
      />

      {/* Ambient: two currents colliding */}
      <div className="cx-bg" aria-hidden>
        <div className="cx-cur cx-a" />
        <div className="cx-cur cx-b" />
        <div className="cx-impact" />
      </div>
      <div className="cx-grain" aria-hidden />
      <div className="cx-dust" aria-hidden>
        {DUST.map((d, i) => (
          <i key={i} style={{ left: d.l, top: d.t, animationDelay: d.d }} />
        ))}
      </div>

      <main className="cx-page">
        <Link href="/collisions" className="cx-back">← Collisions</Link>

        <header className="cx-rise d1">
          <div className="cx-meta">
            <span className="cx-chip">{DOMAIN_LABEL[node.domain] || node.domain}</span>
            <span className="cx-date">{node.created}</span>
          </div>
          <div className="cx-eyebrow">collision</div>
          <h1 className="cx-title">{cleanTitle(node.title)}</h1>
          {node.excerpt && <p className="cx-lede">{node.excerpt}</p>}
          <div className="cx-charge">
            <span className="cx-meter">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`cx-seg${i < charge ? " on" : ""}`} />
              ))}
            </span>
            <span className="cx-charge-lbl">pressure {score}</span>
            {node.status && <span className="cx-status">{node.status}</span>}
          </div>
        </header>

        {sourceTensions && (
          <section className="cx-sec cx-rise d2">
            <div className="cx-sec-label">Sources in tension</div>
            <div className="cx-tension">
              {paragraphs(sourceTensions).map((p, i) => <p key={i} className="cx-p">{p}</p>)}
            </div>
          </section>
        )}

        {collisionBody && (
          <section className="cx-sec cx-rise d3">
            <div className="cx-sec-label">The collision</div>
            {paragraphs(collisionBody).map((p, i) => <p key={i} className="cx-p">{p}</p>)}
          </section>
        )}

        {candidateIdea && (
          <section className="cx-idea cx-rise d4">
            <div className="cx-idea-label">Candidate idea</div>
            {paragraphs(candidateIdea).map((p, i) => <p key={i} className="cx-p">{p}</p>)}
          </section>
        )}

        {needsTrue && (
          <section className="cx-sec">
            <div className="cx-sec-label">What would need to be true</div>
            <ul className="cx-cond">
              {lines(needsTrue).map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </section>
        )}

        {connected.length > 0 && (
          <section className="cx-conn">
            <div className="cx-sec-label">Connected</div>
            {connected.map((n) => {
              const lcol = n.color || DOMAIN_COLOR[n.domain] || "#8b5cf6";
              return (
                <Link key={n.id} href={hrefFor(n)}>
                  <span className="cx-dot" style={{ background: lcol }} />
                  <span className="cx-conn-type" style={{ color: lcol }}>{n.type}</span>
                  <span className="cx-conn-title">{n.title}</span>
                </Link>
              );
            })}
          </section>
        )}

        <div className="cx-foot">
          <Link href="/collisions" className="cx-back">← Back to collisions</Link>
        </div>
      </main>
    </div>
  );
}
