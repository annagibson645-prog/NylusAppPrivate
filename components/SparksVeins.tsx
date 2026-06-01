"use client";
import Link from "next/link";
import { useState } from "react";

type Spark = { id: string; title: string };
type Domain = { key: string; label: string; color: string; count: number; sparks: Spark[] };

const INITIAL = 8;

const CSS = `
  .veins-wrap{ max-width:860px; margin:0 auto; padding:48px 18px 120px; }
  .veins-hd h1{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400; font-size:clamp(30px,7vw,44px); margin:0; color:var(--text); }
  .veins-hd p{ font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.28em; text-transform:uppercase; color:var(--text-dim); margin:8px 0 26px; }
  .vrow{ border-top:1px solid var(--border); }
  .vrow:last-child{ border-bottom:1px solid var(--border); }
  .vhead{ display:flex; align-items:center; gap:16px; width:100%; background:none; border:none; color:var(--text); font-family:var(--font-jetbrains),monospace; padding:20px 6px; cursor:pointer; text-align:left; }
  .vname{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-size:clamp(19px,4.4vw,28px); white-space:nowrap; color:var(--c); transition:text-shadow .25s,filter .25s; }
  .vrow:hover .vname,.vrow.open .vname{ text-shadow:0 0 16px color-mix(in srgb,var(--c) 55%,transparent); filter:brightness(1.1); }
  .vein{ flex:1; position:relative; height:2px; min-width:40px; background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--c) 45%,transparent),transparent); }
  .vein i{ position:absolute; top:50%; left:0; width:7px; height:7px; border-radius:50%; background:var(--c); transform:translate(-50%,-50%); box-shadow:0 0 10px var(--c),0 0 20px var(--c); animation:veinTravel var(--d,6s) linear infinite; }
  .vein i.b{ opacity:.5; animation-delay:calc(var(--d,6s) / -2); }
  @keyframes veinTravel{ from{left:-2%} to{left:102%} }
  .vct{ font-variant-numeric:tabular-nums; font-size:clamp(18px,4.4vw,26px); color:var(--c); min-width:54px; text-align:right; }
  .vchev{ color:var(--text-dim); font-size:20px; transition:transform .35s; flex-shrink:0; }
  .vrow.open .vchev{ transform:rotate(90deg); }
  .vinner{ padding:2px 6px 24px; animation:veinReveal .42s cubic-bezier(.16,1,.3,1); }
  @keyframes veinReveal{ from{opacity:0; transform:translateY(-8px)} to{opacity:1; transform:translateY(0)} }
  .vitem{ display:flex; gap:14px; align-items:baseline; width:100%; text-align:left; text-decoration:none; color:var(--text); padding:12px 10px; border-radius:8px; transition:background .15s,padding-left .15s; }
  .vitem:hover{ background:color-mix(in srgb,var(--c) 10%,transparent); padding-left:16px; }
  .vitem .n{ font-family:var(--font-jetbrains),monospace; font-size:10px; color:var(--c); opacity:.8; width:24px; flex-shrink:0; }
  .vitem .t{ font-family:var(--font-newsreader),Georgia,serif; font-style:italic; font-size:15px; line-height:1.4; flex:1; }
  .vmore{ display:inline-flex; align-items:center; gap:10px; background:none; border:none; cursor:pointer; font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--text-dim); letter-spacing:.12em; text-transform:uppercase; padding:16px 10px 4px; transition:color .2s; }
  .vmore:hover{ color:var(--c); }
  .vmore .plus{ display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border:1px solid var(--c); border-radius:50%; color:var(--c); font-size:15px; line-height:1; transition:background .2s,color .2s; }
  .vmore:hover .plus{ background:var(--c); color:var(--bg); }
  @media (max-width:600px){
    .veins-wrap{ padding:32px 14px 96px; }
    .vhead{ flex-wrap:wrap; gap:8px 12px; padding:16px 4px; }
    .vname{ font-size:21px; flex:1 1 auto; min-width:0; }
    .vct{ min-width:auto; font-size:21px; }
    .vchev{ order:4; }
    .vein{ order:5; flex-basis:100%; min-width:0; margin-top:2px; }
    .vitem .t{ font-size:14px; }
  }
`;

export default function SparksVeins({ domains }: { domains: Domain[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="veins-wrap">
        <div className="veins-hd">
          <h1>Veins of Thought</h1>
          <p>eight currents · open one to follow it</p>
        </div>
        {domains.map((d, i) => {
          const isOpen = open === d.key;
          const showAll = !!expanded[d.key];
          const list = showAll ? d.sparks : d.sparks.slice(0, INITIAL);
          const hasMore = d.sparks.length > INITIAL;
          const dur = (4 + i * 0.6).toFixed(1) + "s";
          return (
            <div key={d.key} className={"vrow" + (isOpen ? " open" : "")} style={{ ["--c" as string]: d.color } as React.CSSProperties}>
              <button className="vhead" onClick={() => setOpen(isOpen ? null : d.key)} aria-expanded={isOpen}>
                <span className="vname">{d.label}</span>
                <span className="vein"><i style={{ ["--d" as string]: dur } as React.CSSProperties} /><i className="b" style={{ ["--d" as string]: dur } as React.CSSProperties} /></span>
                <span className="vct">{d.count}</span>
                <span className="vchev">›</span>
              </button>
              {isOpen && (
                <div className="vbody">
                  <div className="vinner">
                    {list.map((s, j) => (
                      <Link key={s.id} href={`/spark/${s.id}`} className="vitem">
                        <span className="n">{String(j + 1).padStart(2, "0")}</span>
                        <span className="t">{s.title}</span>
                      </Link>
                    ))}
                    {!showAll && hasMore && (
                      <button
                        className="vmore"
                        onClick={(e) => { e.stopPropagation(); setExpanded((x) => ({ ...x, [d.key]: true })); }}
                      >
                        <span className="plus">+</span> show all {d.count} sparks
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
