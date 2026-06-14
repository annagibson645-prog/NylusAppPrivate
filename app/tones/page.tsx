"use client";

// app/tones/page.tsx — "Tomes of Interest": the Kindle-highlights Ledger.
// Sortable, grep-searchable, tag-filterable table of books; click a row to
// expand its highlights inline. Reads /data/highlights.json (built by
// build-highlights.ts + classify-highlights.ts). Mirrors the /sparks pattern.
import { useEffect, useMemo, useState } from "react";
import NavG from "@/components/NavG";

type Highlight = { id: string; text: string; note: string; location: number; at: string };
type Book = {
  id: string; title: string; author: string; cover: string;
  numHighlights: number; lastHighlightedAt: string;
  kind: "domain" | "genre" | "unclassified";
  tag: string; color: string; activity: number[]; highlights: Highlight[];
};

type SortKey = "i" | "title" | "author" | "tag" | "numHighlights" | "lastHighlightedAt";
const PAGE_SIZE = 120;
const ACCENT = "#5dcca5";

export default function TonesPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [grep, setGrep] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortK, setSortK] = useState<SortKey>("numHighlights");
  const [asc, setAsc] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    let alive = true;
    fetch("/data/highlights.json")
      .then((r) => r.json())
      .then((raw: Book[]) => { if (alive) { setBooks(Array.isArray(raw) ? raw : []); setLoaded(true); } })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const totalHighlights = useMemo(() => books.reduce((s, b) => s + b.numHighlights, 0), [books]);
  const maxN = useMemo(() => books.reduce((m, b) => Math.max(m, b.numHighlights), 1), [books]);
  const tags = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of books) if (!seen.has(b.tag)) seen.set(b.tag, b.color);
    return [...seen.entries()];
  }, [books]);

  const filtered = useMemo(() => {
    const q = grep.trim().toLowerCase();
    const rows = books.filter((b) => {
      if (activeTag && b.tag !== activeTag) return false;
      if (q) {
        const hay = (b.title + " " + b.author + " " + b.highlights.map((h) => h.text).join(" ")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir = asc ? 1 : -1;
    rows.sort((a, b) => {
      switch (sortK) {
        case "title": return dir * a.title.localeCompare(b.title);
        case "author": return dir * a.author.localeCompare(b.author);
        case "tag": return dir * a.tag.localeCompare(b.tag);
        case "lastHighlightedAt": return dir * (a.lastHighlightedAt || "").localeCompare(b.lastHighlightedAt || "");
        default: return dir * (a.numHighlights - b.numHighlights);
      }
    });
    return rows;
  }, [books, grep, activeTag, sortK, asc]);

  const shown = filtered.slice(0, limit);

  function sortBy(k: SortKey) {
    if (sortK === k) setAsc((v) => !v);
    else { setSortK(k); setAsc(k === "title" || k === "author" || k === "tag"); }
  }
  function toggleRow(id: string) {
    setOpen((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  const arrow = (k: SortKey) => (sortK === k ? (asc ? " ▲" : " ▼") : "");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavG active="Tomes" count={{ value: books.length || "—", label: books.length ? "tomes" : "loading", color: ACCENT }} />

      <main className="tns-root">
        <div className="tns-glow" aria-hidden />
        <div className="tns-grain" aria-hidden />

        <div className="tns-inner">
          <header className="tns-head">
            <p className="tns-eyebrow">⌖ the margins, indexed</p>
            <h1 className="tns-title">Tomes of Interest</h1>
            <p className="tns-sub">
              {loaded ? <>{books.length} books · {totalHighlights.toLocaleString()} highlights from Kindle</> : "loading the ledger…"}
            </p>
          </header>

          <div className="tns-tools">
            <div className="tns-searchwrap">
              <span className="tns-searchicon" aria-hidden>⌕</span>
              <input className="tns-search" type="search" value={grep} placeholder="grep highlights…"
                aria-label="Search highlights" onChange={(e) => { setGrep(e.target.value); setLimit(PAGE_SIZE); }} />
            </div>
            <div className="tns-chips" role="group" aria-label="Filter by tag">
              <button className={`tns-chip${activeTag === null ? " on" : ""}`} onClick={() => setActiveTag(null)}>All</button>
              {tags.map(([t, c]) => (
                <button key={t} className={`tns-chip${activeTag === t ? " on" : ""}`} onClick={() => setActiveTag((v) => (v === t ? null : t))}>
                  <i style={{ background: c }} aria-hidden /> {t}
                </button>
              ))}
            </div>
          </div>

          <div className="tns-tablewrap">
            <table className="tns-table">
              <thead>
                <tr>
                  <th className="tns-num" style={{ width: 30 }}>#</th>
                  <th onClick={() => sortBy("title")}>Title{arrow("title")}</th>
                  <th onClick={() => sortBy("author")}>Author{arrow("author")}</th>
                  <th onClick={() => sortBy("tag")}>Tag{arrow("tag")}</th>
                  <th className="tns-num" onClick={() => sortBy("numHighlights")}>Highlights{arrow("numHighlights")}</th>
                  <th onClick={() => sortBy("lastHighlightedAt")}>Last seen{arrow("lastHighlightedAt")}</th>
                  <th>Density</th>
                </tr>
              </thead>
              <tbody>
                {loaded && filtered.length === 0 && (
                  <tr><td colSpan={7} className="tns-empty">No tomes match.</td></tr>
                )}
                {shown.map((b, i) => (
                  <BookRow key={b.id} b={b} i={i} isOpen={open.has(b.id)} maxN={maxN} onToggle={() => toggleRow(b.id)} />
                ))}
              </tbody>
            </table>
          </div>

          {loaded && filtered.length > limit && (
            <button className="tns-more" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              show {Math.min(PAGE_SIZE, filtered.length - limit)} more · {filtered.length - limit} remaining
            </button>
          )}
        </div>
      </main>
    </>
  );
}

function BookRow({ b, i, isOpen, maxN, onToggle }: {
  b: Book; i: number; isOpen: boolean; maxN: number; onToggle: () => void;
}) {
  return (
    <>
      <tr className={`tns-bk${isOpen ? " open" : ""}`} onClick={onToggle}>
        <td className="tns-num tns-dim">{String(i + 1).padStart(2, "0")}</td>
        <td><span className="tns-ti">{b.title}</span></td>
        <td className="tns-au">{b.author}</td>
        <td>
          <span className="tns-pill" style={{ color: b.color, borderColor: `${b.color}55`, background: `${b.color}14` }}>
            <i style={{ background: b.color }} aria-hidden /> {b.tag}
          </span>
        </td>
        <td className="tns-num" style={{ color: ACCENT }}>{b.numHighlights}</td>
        <td className="tns-date">{b.lastHighlightedAt || "—"}</td>
        <td><div className="tns-track"><div className="tns-fill" style={{ width: `${Math.round((b.numHighlights / maxN) * 100)}%`, background: b.color }} /></div></td>
      </tr>
      <tr className="tns-det">
        <td colSpan={7}>
          <div className={`tns-detin${isOpen ? " open" : ""}`}>
            <div className="tns-detpad">
              <div className="tns-detlbl" style={{ color: b.color }}>{b.tag} · {b.numHighlights} highlights</div>
              {b.highlights.slice(0, 12).map((h) => (
                <div key={h.id} className="tns-q" style={{ borderLeftColor: b.color }}>
                  {h.text}
                  {h.note && <div className="tns-note">— {h.note}</div>}
                  <div className="tns-loc">Location {h.location}{h.at ? ` · ${h.at.slice(0, 10)}` : ""}</div>
                </div>
              ))}
              {b.highlights.length > 12 && <div className="tns-loc" style={{ paddingLeft: 15 }}>+ {b.highlights.length - 12} more</div>}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

const CSS = `
  .tns-root{
    --ac:${ACCENT}; --ac-rgb:93,204,165;
    --ink:#eae6f5; --muted:#8a849a; --dim:#5a546b; --dim2:#494456;
    --hair:rgba(255,255,255,0.08); --panel:rgba(255,255,255,0.022); --bg3:#1c1a26;
    min-height:calc(100vh - 80px); background:#0e0d14; color:var(--ink);
    position:relative; overflow-x:hidden; font-family:var(--font-jetbrains),monospace;
  }
  html[data-theme="sepia"] .tns-root{
    --ac:#246a55; --ac-rgb:36,106,85; --ink:#2c1f0e; --muted:#6f6048; --dim:#a8997a; --dim2:#b8a988;
    --hair:rgba(44,31,14,0.13); --panel:rgba(44,31,14,0.03); --bg3:#e6dcc8; background:#f0ead8;
  }
  .tns-glow{ position:fixed; top:40px; left:50%; width:1000px; height:560px; transform:translateX(-50%);
    background:radial-gradient(ellipse at center, rgba(var(--ac-rgb),0.09), transparent 68%); pointer-events:none; z-index:0; }
  .tns-grain{ position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.04; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  .tns-inner{ position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:0 32px 96px; }
  .tns-head{ padding:44px 0 8px; }
  .tns-eyebrow{ font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:var(--ac); opacity:0.85; margin:0 0 14px; }
  .tns-title{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-weight:400;
    font-size:clamp(36px,5vw,52px); line-height:1; letter-spacing:-0.02em; margin:0; }
  .tns-sub{ font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:var(--muted); margin:12px 0 0; font-variant-numeric:tabular-nums; }

  .tns-tools{ display:flex; align-items:center; gap:12px; margin:24px 0 14px; flex-wrap:wrap; }
  .tns-searchwrap{ position:relative; display:flex; align-items:center; }
  .tns-searchicon{ position:absolute; left:12px; color:var(--dim); font-size:14px; pointer-events:none; }
  .tns-search{ width:180px; font-size:12px; background:var(--panel); border:1px solid var(--hair); border-radius:8px;
    padding:9px 12px 9px 32px; color:var(--ac); outline:none; transition:border-color .2s; }
  .tns-search::placeholder{ color:var(--dim); }
  .tns-search::-webkit-search-cancel-button{ display:none; }
  .tns-search:focus{ border-color:rgba(var(--ac-rgb),0.5); }
  .tns-chips{ display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; flex:1; }
  .tns-chips::-webkit-scrollbar{ display:none; }
  .tns-chip{ flex-shrink:0; background:transparent; border:1px solid var(--hair); color:var(--muted);
    font-family:inherit; font-size:9px; letter-spacing:0.08em; text-transform:uppercase; padding:6px 11px;
    border-radius:20px; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:6px; transition:all .2s; }
  .tns-chip:hover{ color:var(--ink); }
  .tns-chip.on{ color:var(--ink); background:var(--panel); border-color:var(--dim2); }
  .tns-chip i{ width:7px; height:7px; border-radius:50%; display:block; }

  .tns-tablewrap{ max-height:62vh; overflow-y:auto; border:1px solid var(--hair); border-radius:10px; }
  .tns-table{ width:100%; border-collapse:collapse; font-size:12px; }
  .tns-table th{ font-size:8.5px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); text-align:left;
    padding:11px 14px; border-bottom:1px solid var(--hair); cursor:pointer; user-select:none; white-space:nowrap;
    position:sticky; top:0; background:#15131c; }
  html[data-theme="sepia"] .tns-table th{ background:#ede6d4; }
  .tns-table th:hover{ color:var(--ac); }
  .tns-table td{ padding:11px 14px; border-bottom:1px solid var(--hair); vertical-align:middle; }
  .tns-num{ font-variant-numeric:tabular-nums; text-align:right; }
  .tns-dim{ color:var(--dim2); }
  .tns-bk{ cursor:pointer; transition:background .2s; }
  .tns-bk:hover td{ background:var(--panel); }
  .tns-bk.open td{ background:rgba(var(--ac-rgb),0.06); }
  .tns-ti{ font-family:var(--font-fraunces),Georgia,serif; font-style:italic; font-size:14.5px; color:var(--ink); }
  .tns-au{ color:var(--muted); font-size:10px; }
  .tns-date{ color:var(--dim); font-size:10px; font-variant-numeric:tabular-nums; }
  .tns-pill{ display:inline-flex; align-items:center; gap:6px; font-size:8.5px; letter-spacing:0.08em;
    text-transform:uppercase; padding:4px 9px; border-radius:20px; white-space:nowrap; border:1px solid; }
  .tns-pill i{ width:6px; height:6px; border-radius:50%; display:block; }
  .tns-track{ height:4px; background:var(--bg3); border-radius:2px; overflow:hidden; width:60px; }
  .tns-fill{ height:100%; border-radius:2px; }
  .tns-spark{ display:flex; gap:1.5px; align-items:flex-end; height:16px; }
  .tns-spark i{ width:2.5px; display:block; border-radius:1px; opacity:0.7; }

  .tns-det td{ padding:0; }
  .tns-detin{ max-height:0; overflow:hidden; transition:max-height .4s cubic-bezier(0.16,1,0.3,1); }
  .tns-detin.open{ max-height:420px; overflow-y:auto; }
  .tns-detpad{ padding:8px 24px 18px 56px; }
  .tns-detlbl{ font-size:9px; letter-spacing:0.16em; text-transform:uppercase; margin-bottom:6px; }
  .tns-q{ font-family:var(--font-newsreader),Georgia,serif; font-size:14px; line-height:1.55; color:var(--ink);
    padding:10px 0 10px 15px; border-left:2px solid; margin:9px 0; }
  .tns-note{ font-style:italic; color:var(--muted); font-size:13px; margin-top:4px; }
  .tns-loc{ font-family:var(--font-jetbrains),monospace; font-size:8px; color:var(--dim2); letter-spacing:0.12em;
    margin-top:6px; text-transform:uppercase; }
  .tns-empty{ text-align:center; color:var(--muted); font-style:italic; padding:40px 0; font-family:var(--font-newsreader),serif; }
  .tns-more{ display:block; margin:24px auto 0; padding:12px 26px; background:transparent; border:1px solid var(--hair);
    border-radius:6px; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:0.2em;
    text-transform:uppercase; color:var(--muted); cursor:pointer; transition:border-color .25s, color .25s; }
  .tns-more:hover{ border-color:rgba(var(--ac-rgb),0.5); color:var(--ac); }

  @media (max-width:767px){
    .tns-inner{ padding:0 16px 96px; }
    .tns-tablewrap{ overflow-x:auto; }
    .tns-table{ min-width:680px; }
  }
  @media (prefers-reduced-motion:reduce){ .tns-detin{ transition:none; } }
`;
