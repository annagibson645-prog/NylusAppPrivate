"use client";
// components/CraftLedger.tsx — the /craft landing experience: a single
// vertical spine of coaching-session reports, newest first. Deliberately not
// a card grid or a domain-drilldown cabinet (see ResearchLoom / EssaysCabinet)
// — Craft is one lane, not eight domains, and the collection starts small, so
// the layout has to read as intentional at 1 entry and still hold at 50.
// Reuses the site's global theme tokens (--text, --border, etc. from
// app/globals.css) rather than a manual sepia hook, since plain var() swaps
// are all this needs.
import Link from "next/link";

export type CraftNode = {
  id: string;
  title: string;
  excerpt: string;
  source_material?: string;
  techniques?: string[];
  created: string;
  word_count?: number;
  status: string;
};

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function readMins(wc?: number) {
  return wc ? Math.max(1, Math.round(wc / 220)) : null;
}
function techniqueLabel(t: string) {
  return t.replace(/-/g, " ");
}

export default function CraftLedger({ reports }: { reports: CraftNode[] }) {
  if (reports.length === 0) {
    return (
      <div className="cl-empty">
        no craft reports yet — run a Craft coaching session and save findings to The Platform/Craft
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="cl-spine">
        {reports.map((r, i) => {
          const mins = readMins(r.word_count);
          return (
            <Link
              key={r.id}
              href={`/craft/${r.id}`}
              className="cl-entry"
              style={{ ["--i" as string]: i }}
            >
              <span className="cl-dot" aria-hidden="true" />

              <div className="cl-meta">
                <span>{fmtDate(r.created)}</span>
                {mins && <><span className="cl-sep">·</span><span>{mins} min</span></>}
                {r.status === "draft" && <><span className="cl-sep">·</span><span className="cl-draft">draft</span></>}
              </div>

              <h3 className="cl-title">{r.title}</h3>

              {r.excerpt && <p className="cl-excerpt">{r.excerpt}</p>}

              <div className="cl-foot">
                {r.source_material && <span className="cl-source">from {r.source_material}</span>}
                {r.techniques && r.techniques.length > 0 && (
                  <div className="cl-chips">
                    {r.techniques.map((t) => (
                      <span key={t} className="cl-chip">{techniqueLabel(t)}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

const CSS = `
.cl-empty{
  padding:80px 0; text-align:center;
  font-family:var(--font-jetbrains),monospace;
  font-size:11px; color:var(--text-dim); letter-spacing:0.1em;
}

.cl-spine{
  position:relative;
  max-width:680px;
  padding-left:28px;
}
.cl-spine::before{
  content:"";
  position:absolute; left:3px; top:6px; bottom:6px;
  width:1px;
  background:linear-gradient(to bottom, color-mix(in srgb, #14b8a6 55%, transparent), var(--border) 85%);
  transform-origin:top;
  animation:cl-draw 0.9s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes cl-draw{ from{ transform:scaleY(0); } to{ transform:scaleY(1); } }

.cl-entry{
  position:relative;
  display:block;
  text-decoration:none;
  color:inherit;
  padding:0 0 40px;
  animation:cl-rise 0.5s cubic-bezier(0.16,1,0.3,1) both;
  animation-delay:calc(var(--i,0) * 90ms);
}
.cl-entry:last-child{ padding-bottom:4px; }
@keyframes cl-rise{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:translateY(0); } }

.cl-dot{
  position:absolute; left:-28px; top:6px;
  width:7px; height:7px; border-radius:50%;
  background:#14b8a6;
  box-shadow:0 0 0 3px color-mix(in srgb, #14b8a6 18%, transparent);
  transition:box-shadow 0.2s, transform 0.2s;
}
.cl-entry:hover .cl-dot{
  box-shadow:0 0 0 5px color-mix(in srgb, #14b8a6 28%, transparent);
  transform:scale(1.15);
}

.cl-meta{
  font-family:var(--font-jetbrains),monospace;
  font-size:10px; letter-spacing:0.08em;
  color:var(--text-dim);
  margin-bottom:10px;
  display:flex; align-items:center; gap:6px;
}
.cl-sep{ opacity:0.5; }
.cl-draft{ color:#14b8a6; text-transform:uppercase; letter-spacing:0.12em; }

.cl-title{
  font-family:var(--font-fraunces),Georgia,serif;
  font-style:italic; font-weight:500;
  font-size:clamp(20px,2.6vw,26px);
  line-height:1.2;
  color:var(--text);
  margin:0 0 10px;
  transition:color 0.2s;
}
.cl-entry:hover .cl-title{ color:#14b8a6; }

.cl-excerpt{
  font-family:var(--font-newsreader),serif;
  font-weight:300; font-size:15px; line-height:1.65;
  color:var(--text-muted);
  margin:0 0 14px;
  max-width:58ch;
}

.cl-foot{
  display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px;
}
.cl-source{
  font-family:var(--font-newsreader),serif;
  font-style:italic; font-size:12.5px;
  color:var(--text-dim);
}
.cl-chips{ display:flex; flex-wrap:wrap; gap:6px; }
.cl-chip{
  font-family:var(--font-jetbrains),monospace;
  font-size:8.5px; letter-spacing:0.08em; text-transform:uppercase;
  color:#14b8a6;
  border:1px solid color-mix(in srgb, #14b8a6 35%, transparent);
  border-radius:3px;
  padding:3px 8px;
  background:color-mix(in srgb, #14b8a6 6%, transparent);
}

@media (prefers-reduced-motion:reduce){
  .cl-entry, .cl-spine::before{ animation:none; }
}
`;
