"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavG from "@/components/NavG";
import type { VaultNode } from "@/lib/types";

const DOMAIN_COLOR: Record<string, string> = {
  "cross-domain": "#38bdf8", "psychology": "#3b82f6", "eastern-spirituality": "#dc2626",
  "behavioral-mechanics": "#f97316", "creative-practice": "#14b8a6", "history": "#f59e0b",
  "african-spirituality": "#10b981", "business": "#e879a0", "occult": "#d95ae8",
};
const DOMAIN_SHORT: Record<string, string> = {
  "cross-domain": "cross", "psychology": "psych", "eastern-spirituality": "eastern",
  "behavioral-mechanics": "behavioral", "creative-practice": "creative", "history": "history",
  "african-spirituality": "african", "business": "business", "occult": "occult",
};
const DOMAIN_LABEL: Record<string, string> = {
  "cross-domain": "Cross-Domain", "psychology": "Psychology", "eastern-spirituality": "Eastern Spirituality",
  "behavioral-mechanics": "Behavioral Mechanics", "creative-practice": "Creative Practice", "history": "History",
  "african-spirituality": "African Spirituality", "business": "Business", "occult": "Occult",
};
const DOMAINS = Object.keys(DOMAIN_COLOR);
const cleanTitle = (t: string) => t.replace(/^Collision:\s*/i, "");

const CSS = `
  .clx{
    --bg:#0e0d14; --ink:#eae6f5; --muted:#8a849a; --dim:#5a546b;
    --hair:rgba(255,255,255,0.08); --panel:rgba(255,255,255,0.022); --panel-hover:rgba(255,255,255,0.045);
    --ac:#e8b86a; --ac-rgb:232,184,106; --counter:120,160,235;
    position:relative; min-height:100vh; background:#0e0d14; color:var(--ink);
    font-family:var(--font-newsreader),Georgia,serif; line-height:1.5; overflow-x:hidden;
  }
  html[data-theme="sepia"] .clx{
    --bg:#f0ead8; --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a;
    --hair:rgba(44,31,14,0.13); --panel:rgba(44,31,14,0.03); --panel-hover:rgba(44,31,14,0.06);
    --ac:#6f4e0b; --ac-rgb:111,78,11; --counter:150,120,70;
    background:#f0ead8;
  }

  /* two currents colliding — ambient */
  .clx-bg{ position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
  .clx-cur{ position:absolute; width:80vw; height:80vw; max-width:1000px; max-height:1000px; border-radius:50%; filter:blur(10px); }
  .clx-a{ top:-24vw; left:-20vw; background:radial-gradient(circle, rgba(var(--ac-rgb),0.16), transparent 64%);
    animation:clxA 1.6s cubic-bezier(0.16,1,0.3,1) both, clxDA 21s ease-in-out 1.6s infinite alternate; }
  .clx-b{ bottom:-24vw; right:-20vw; background:radial-gradient(circle, rgba(var(--counter),0.13), transparent 64%);
    animation:clxB 1.8s cubic-bezier(0.16,1,0.3,1) both, clxDB 25s ease-in-out 1.8s infinite alternate; }
  html[data-theme="sepia"] .clx-a{ background:radial-gradient(circle, rgba(var(--ac-rgb),0.14), transparent 64%); }
  html[data-theme="sepia"] .clx-b{ background:radial-gradient(circle, rgba(var(--counter),0.12), transparent 64%); }
  .clx-grain{ position:fixed; inset:0; z-index:1; pointer-events:none; opacity:0.04; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  @keyframes clxA{ from{opacity:0;transform:translate(-12vw,-8vw) scale(.7);} to{opacity:1;transform:none;} }
  @keyframes clxB{ from{opacity:0;transform:translate(12vw,8vw) scale(.7);} to{opacity:1;transform:none;} }
  @keyframes clxDA{ from{transform:translate(0,0);} to{transform:translate(5vw,3vw);} }
  @keyframes clxDB{ from{transform:translate(0,0);} to{transform:translate(-5vw,-3vw);} }

  .clx-page{ position:relative; z-index:2; max-width:880px; margin:0 auto; padding:clamp(40px,6vw,72px) clamp(20px,5vw,40px) 120px; }

  .clx-eyebrow{ font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.34em;
    text-transform:uppercase; color:var(--ac); margin-bottom:18px; }
  .clx-title{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400;
    font-size:clamp(44px,7vw,80px); line-height:1; letter-spacing:-0.02em; color:var(--ink); margin:0 0 16px; text-wrap:balance; }
  .clx-lede{ font-family:var(--font-newsreader),serif; font-size:clamp(17px,2vw,20px); line-height:1.5;
    color:var(--muted); max-width:54ch; margin:0 0 36px; text-wrap:pretty; }

  /* controls */
  .clx-controls{ display:flex; flex-wrap:wrap; align-items:center; gap:14px; margin-bottom:22px; }
  .clx-search{ flex:1 1 200px; min-width:160px; font-family:var(--font-jetbrains),monospace; font-size:12px;
    background:var(--panel); border:1px solid var(--hair); border-radius:8px; padding:10px 14px; color:var(--ink);
    outline:none; transition:border-color .2s, background .2s; }
  .clx-search::placeholder{ color:var(--dim); }
  .clx-search:focus{ border-color:rgba(var(--ac-rgb),0.55); background:var(--panel-hover); }
  .clx-sorts{ display:flex; gap:4px; }
  .clx-sort{ font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:0.12em; text-transform:uppercase;
    padding:8px 12px; border-radius:6px; border:1px solid var(--hair); background:transparent; color:var(--muted);
    cursor:pointer; transition:all .18s; }
  .clx-sort:hover{ color:var(--ink); border-color:rgba(var(--ac-rgb),0.4); }
  .clx-sort:focus-visible{ outline:1px solid var(--ac); outline-offset:2px; }
  .clx-sort.on{ color:var(--bg); background:var(--ac); border-color:var(--ac); }
  html[data-theme="sepia"] .clx-sort.on{ color:#f0ead8; }

  /* domain filter chips */
  .clx-chips{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
  .clx-chip{ display:inline-flex; align-items:center; gap:8px; font-family:var(--font-jetbrains),monospace;
    font-size:11px; letter-spacing:0.06em; padding:7px 13px; border-radius:999px; border:1px solid var(--hair);
    background:transparent; color:var(--muted); cursor:pointer; transition:all .18s; }
  .clx-chip:hover{ color:var(--ink); border-color:var(--hair); background:var(--panel); }
  .clx-chip:focus-visible{ outline:1px solid var(--cc); outline-offset:2px; }
  .clx-chip[data-on="true"]{ color:var(--ink); border-color:color-mix(in srgb, var(--cc) 55%, transparent);
    background:color-mix(in srgb, var(--cc) 12%, transparent); }
  .clx-dia{ width:9px; height:9px; flex-shrink:0; transform:rotate(45deg); border-radius:1.5px; }

  .clx-count{ font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--dim);
    letter-spacing:0.04em; margin:26px 0 14px; }
  .clx-count b{ color:var(--ac); font-weight:500; }

  /* rows */
  .clx-list{ display:flex; flex-direction:column; }
  .clx-row{ position:relative; display:grid; grid-template-columns:auto 1fr auto; align-items:start; gap:clamp(14px,2.4vw,28px);
    padding:clamp(20px,2.6vw,28px) 0 clamp(20px,2.6vw,28px) clamp(12px,1.6vw,20px);
    border-top:1px solid var(--hair); text-decoration:none; color:inherit;
    border-left:2px solid transparent; transition:transform .4s cubic-bezier(0.16,1,0.3,1), border-color .3s, background .3s; }
  .clx-row:last-child{ border-bottom:1px solid var(--hair); }
  .clx-row:hover{ transform:translateX(5px); border-left-color:var(--cc); background:var(--panel); }
  .clx-row:focus-visible{ outline:1px solid var(--cc); outline-offset:3px; border-radius:3px; }
  .clx-num{ font-family:var(--font-fraunces),serif; font-style:italic; font-size:clamp(24px,3vw,34px); line-height:1;
    color:var(--dim); font-variant-numeric:tabular-nums; padding-top:4px; transition:color .3s; }
  .clx-row:hover .clx-num{ color:var(--cc); }
  .clx-mid{ min-width:0; }
  .clx-kick{ font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:0.14em; text-transform:uppercase;
    color:var(--muted); margin-bottom:8px; display:flex; align-items:center; gap:8px; }
  .clx-kick .clx-dia{ width:7px; height:7px; }
  .clx-rowtitle{ font-family:var(--font-fraunces),serif; font-style:italic; font-weight:400;
    font-size:clamp(20px,2.4vw,27px); line-height:1.16; color:var(--ink); margin:0 0 8px; text-wrap:balance; }
  .clx-ex{ font-family:var(--font-newsreader),serif; font-size:15.5px; line-height:1.6; color:var(--muted);
    text-wrap:pretty; max-width:60ch;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .clx-right{ display:flex; flex-direction:column; align-items:flex-end; gap:8px; padding-top:6px; }
  .clx-press{ font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--muted); font-variant-numeric:tabular-nums; }
  .clx-meter{ display:flex; gap:2.5px; }
  .clx-seg{ width:5px; height:5px; border-radius:1px; background:var(--hair); }
  .clx-seg.on{ background:var(--cc); }
  .clx-arrow{ color:var(--dim); font-size:13px; transition:transform .3s, color .3s; }
  .clx-row:hover .clx-arrow{ color:var(--cc); transform:translateX(3px); }

  .clx-empty{ text-align:center; padding:90px 0; font-family:var(--font-fraunces),serif; font-style:italic;
    font-size:19px; color:var(--dim); }

  /* load stagger (first paint only) */
  .clx-head{ opacity:0; transform:translateY(16px); animation:clxRise .8s cubic-bezier(0.16,1,0.3,1) .1s forwards; }
  @keyframes clxRise{ to{opacity:1;transform:none;} }

  @media (max-width:620px){
    .clx-row{ grid-template-columns:auto 1fr; }
    .clx-right{ grid-column:1 / -1; flex-direction:row; align-items:center; justify-content:flex-start; gap:12px; padding-top:4px; }
    .clx-num{ font-size:22px; }
  }
  @media (prefers-reduced-motion:reduce){
    .clx-cur,.clx-head{ animation:none !important; }
    .clx-head{ opacity:1; transform:none; }
    .clx-cur{ opacity:1; } .clx-a,.clx-b{ transform:none; }
    .clx-row{ transition:none; }
  }
`;

export default function CollisionsPage() {
  const [allNodes, setAllNodes] = useState<VaultNode[]>([]);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"pressure" | "date" | "alpha">("pressure");

  useEffect(() => {
    fetch("/data/collisions.json")
      .then((r) => r.json())
      .then((data: VaultNode[]) => setAllNodes(data.filter((n) => n.type === "collision")));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    DOMAINS.forEach((d) => { c[d] = allNodes.filter((n) => n.domain === d).length; });
    return c;
  }, [allNodes]);

  const filtered = useMemo(() => {
    let list = [...allNodes];
    if (activeDomain) list = list.filter((n) => n.domain === activeDomain);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || (n.excerpt || "").toLowerCase().includes(q));
    }
    if (sortBy === "pressure") list.sort((a, b) => (b.pressure_score ?? 0) - (a.pressure_score ?? 0));
    else if (sortBy === "alpha") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
    return list;
  }, [allNodes, activeDomain, search, sortBy]);

  return (
    <div className="clx">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavG
        active="Collisions"
        count={{ value: allNodes.length ? filtered.length : "—", label: allNodes.length ? `of ${allNodes.length}` : "loading", color: "#e8b86a" }}
      />

      <div className="clx-bg" aria-hidden>
        <div className="clx-cur clx-a" />
        <div className="clx-cur clx-b" />
      </div>
      <div className="clx-grain" aria-hidden />

      <main className="clx-page">
        <div className="clx-head">
          <div className="clx-eyebrow">⊹ ideas at the fault lines</div>
          <h1 className="clx-title">Collisions</h1>
          <p className="clx-lede">
            Where two sources pull in different directions, a third idea is forced into being. Ranked by the pressure
            between them.
          </p>

          <div className="clx-controls">
            <input
              className="clx-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="filter collisions…"
              aria-label="Filter collisions"
            />
            <div className="clx-sorts">
              {(["pressure", "date", "alpha"] as const).map((s) => (
                <button key={s} className={`clx-sort${sortBy === s ? " on" : ""}`} onClick={() => setSortBy(s)}>
                  {s === "alpha" ? "a→z" : s}
                </button>
              ))}
            </div>
          </div>

          <div className="clx-chips">
            <button
              className="clx-chip"
              data-on={activeDomain === null}
              style={{ ["--cc" as string]: "#e8b86a" }}
              onClick={() => setActiveDomain(null)}
            >
              <span className="clx-dia" style={{ background: "#e8b86a" }} /> all
            </button>
            {DOMAINS.map((d) => (
              <button
                key={d}
                className="clx-chip"
                data-on={activeDomain === d}
                style={{ ["--cc" as string]: DOMAIN_COLOR[d] }}
                onClick={() => setActiveDomain(activeDomain === d ? null : d)}
              >
                <span className="clx-dia" style={{ background: DOMAIN_COLOR[d] }} />
                {DOMAIN_SHORT[d]}
                <span style={{ color: "var(--dim)" }}>{counts[d] || 0}</span>
              </button>
            ))}
          </div>

          <div className="clx-count">
            <b>{filtered.length}</b> {filtered.length === 1 ? "collision" : "collisions"}
            {activeDomain ? ` · ${DOMAIN_LABEL[activeDomain]}` : ""}
          </div>
        </div>

        <div className="clx-list">
          {allNodes.length === 0 ? (
            <div className="clx-empty">gathering the fault lines…</div>
          ) : filtered.length === 0 ? (
            <div className="clx-empty">no collisions found</div>
          ) : (
            filtered.map((node, idx) => {
              const cc = DOMAIN_COLOR[node.domain] || "#8b5cf6";
              const score = node.pressure_score ?? 0;
              const charge = Math.min(Math.max(Math.round((score / 14) * 8), 1), 8);
              return (
                <Link
                  key={node.id}
                  href={`/collision/${node.id}`}
                  className="clx-row"
                  style={{ ["--cc" as string]: cc }}
                >
                  <span className="clx-num">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="clx-mid">
                    <span className="clx-kick">
                      <span className="clx-dia" style={{ background: cc }} />
                      {DOMAIN_SHORT[node.domain] || node.domain}
                    </span>
                    <h2 className="clx-rowtitle">{cleanTitle(node.title)}</h2>
                    {node.excerpt && <p className="clx-ex">{node.excerpt}</p>}
                  </span>
                  <span className="clx-right">
                    <span className="clx-press">{score.toFixed(1)}</span>
                    <span className="clx-meter">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <span key={i} className={`clx-seg${i < charge ? " on" : ""}`} />
                      ))}
                    </span>
                    <span className="clx-arrow">→</span>
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
