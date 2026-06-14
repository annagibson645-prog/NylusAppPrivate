"use client";

// app/tones/page.tsx — "Tomes of Interest": the Kindle-highlights Index.
// Browse 200+ books by domain (collapsible) or A–Z, full-text search across
// every highlight (matching passages shown + term highlighted), and open any
// book into a focused, independently-scrolling reader with its own
// search-within-this-book box. Reads /data/highlights.json (built by
// build-highlights.ts + classify-highlights.ts). Theme-aware (void + sepia).
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import NavG from "@/components/NavG";

type Highlight = { id: string; text: string; note: string; location: number; at: string };
type RawBook = {
  id: string; title: string; author: string; cover: string;
  numHighlights: number; lastHighlightedAt: string;
  kind: "domain" | "genre" | "unclassified";
  tag: string; color: string; activity: number[]; highlights: Highlight[];
};
type Book = RawBook & { dom: boolean; group: string; hay: string };

const ACCENT = "#60a5fa";

// The eight canonical vault domains (label → vivid colour). Anything else is a
// genre and is given the single neutral colour so the domains stay distinct.
const DOMAIN_COLORS: Record<string, string> = {
  "Eastern Spirituality": "#dc2626", History: "#e6c068", Psychology: "#f59e0b",
  "Behavioral Mechanics": "#a78bfa", Business: "#e879a0", "Creative Practice": "#14b8a6",
  "Cross-Domain": "#38bdf8", "African Spirituality": "#34d399",
};
const DOMAIN_ORDER = [
  "Eastern Spirituality", "History", "Psychology", "Behavioral Mechanics",
  "Business", "Creative Practice", "Cross-Domain", "African Spirituality",
];
const OTHER = "Other Genres";
const GENRE_COLOR = "var(--tm-genre)";

type SortKey = "highlights" | "title" | "recent";
type View = "domain" | "az";

/* ---------- pure helpers ---------- */
function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function tint(hex: string): string {
  if (!hex.startsWith("#")) return "var(--tm-genre-tint)";
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c * 0.42 + 234 * 0.58);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function rgba(hex: string, a: number): string {
  if (!hex.startsWith("#")) return `rgba(138,144,166,${a})`;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function fmtDate(d: string): string {
  if (!d) return "—";
  const [y, m] = d.split("-");
  const mo = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][(+m || 1) - 1];
  return `${mo} ${(y || "").slice(2)}`;
}
function sortKeyTitle(t: string): string {
  return t.replace(/^(the|a|an)\s+/i, "").toLowerCase();
}
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}
function hi(text: string, q: string): string {
  if (!q) return esc(text);
  const re = new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
  return esc(text).replace(re, (m) => `<mark>${m}</mark>`);
}
function snippet(text: string, q: string, pad = 90): string {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return hi(text.slice(0, 180) + (text.length > 180 ? "…" : ""), q);
  const s = Math.max(0, i - pad), e = Math.min(text.length, i + q.length + pad);
  return (s > 0 ? "…" : "") + hi(text.slice(s, e), q) + (e < text.length ? "…" : "");
}

export default function TomesPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("domain");
  const [sort, setSort] = useState<SortKey>("highlights");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  // reader
  const [reader, setReader] = useState<{ book: Book; q: string } | null>(null);
  const [readerShown, setReaderShown] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/data/highlights.json")
      .then((r) => r.json())
      .then((raw: RawBook[]) => {
        if (!alive) return;
        const arr = Array.isArray(raw) ? raw : [];
        const norm: Book[] = arr.map((b) => {
          const dom = Object.prototype.hasOwnProperty.call(DOMAIN_COLORS, b.tag) && b.kind === "domain";
          return {
            ...b,
            color: dom ? DOMAIN_COLORS[b.tag] : GENRE_COLOR,
            dom,
            group: dom ? b.tag : OTHER,
            hay: (b.title + " " + b.author).toLowerCase(),
          };
        });
        setBooks(norm);
        // open the first non-empty domain group by default so the page isn't bare
        const firstGroup = [...DOMAIN_ORDER, OTHER].find((g) => norm.some((b) => b.group === g));
        if (firstGroup) setOpenGroups(new Set([firstGroup]));
        setLoaded(true);
      })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const totalHighlights = useMemo(() => books.reduce((s, b) => s + b.numHighlights, 0), [books]);

  // group → count (full catalog, ignores filters) for the filter chips
  const groupCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of books) m.set(b.group, (m.get(b.group) || 0) + 1);
    return m;
  }, [books]);
  const groupList = useMemo(
    () => [...DOMAIN_ORDER, OTHER].filter((g) => groupCounts.has(g)),
    [groupCounts],
  );
  function groupColor(g: string) { return g === OTHER ? GENRE_COLOR : DOMAIN_COLORS[g]; }

  const sortBooks = useCallback((arr: Book[]) => {
    const a = arr.slice();
    if (sort === "title") a.sort((x, y) => sortKeyTitle(x.title).localeCompare(sortKeyTitle(y.title)));
    else if (sort === "recent") a.sort((x, y) => (y.lastHighlightedAt || "").localeCompare(x.lastHighlightedAt || ""));
    else a.sort((x, y) => y.numHighlights - x.numHighlights);
    return a;
  }, [sort]);

  const visible = useMemo(
    () => books.filter((b) => filters.size === 0 || filters.has(b.group)),
    [books, filters],
  );

  // search results (only when query present)
  const search = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const ql = q.toLowerCase();
    const results: { b: Book; matches: Highlight[]; titleMatch: boolean }[] = [];
    for (const b of visible) {
      const titleMatch = b.hay.includes(ql);
      const matches = b.highlights.filter(
        (h) => h.text.toLowerCase().includes(ql) || (h.note && h.note.toLowerCase().includes(ql)),
      );
      if (titleMatch || matches.length) results.push({ b, matches, titleMatch });
    }
    results.sort((a, b) => b.matches.length - a.matches.length || b.b.numHighlights - a.b.numHighlights);
    return { q, results, totalPassages: results.reduce((s, r) => s + r.matches.length, 0) };
  }, [query, visible]);

  // domain-grouped view data
  const grouped = useMemo(() => {
    if (search) return null;
    const out: { g: string; color: string; items: Book[] }[] = [];
    for (const g of [...DOMAIN_ORDER, OTHER]) {
      const items = sortBooks(visible.filter((b) => b.group === g));
      if (items.length) out.push({ g, color: groupColor(g), items });
    }
    return out;
  }, [search, visible, sortBooks]);

  // a–z view data
  const az = useMemo(() => {
    if (search || view !== "az") return null;
    const sorted = visible.slice().sort((a, b) => sortKeyTitle(a.title).localeCompare(sortKeyTitle(b.title)));
    const present = new Set<string>();
    const rows: { letter?: string; book?: Book }[] = [];
    let last = "";
    for (const b of sorted) {
      const L0 = (sortKeyTitle(b.title)[0] || "#").toUpperCase();
      const L = /[A-Z]/.test(L0) ? L0 : "#";
      if (L !== last) { rows.push({ letter: L }); last = L; present.add(L); }
      rows.push({ book: b });
    }
    return { rows, present };
  }, [search, view, visible]);

  const shownCount = search ? search.results.length : visible.length;

  /* ---------- reader control ---------- */
  const openReader = useCallback((book: Book, trigger: HTMLElement | null, prefill = "") => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    lastFocus.current = trigger || (document.activeElement as HTMLElement);
    setReader({ book, q: prefill });
    setReaderShown(true);
    document.body.style.overflow = "hidden";
  }, []);
  const closeReader = useCallback(() => {
    setReaderShown(false);
    document.body.style.overflow = "";
    if (lastFocus.current?.focus) lastFocus.current.focus();
    closeTimer.current = setTimeout(() => setReader(null), 440);
  }, []);

  // Esc + focus trap while reader open
  useEffect(() => {
    if (!readerShown) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { closeReader(); return; }
      if (e.key === "Tab" && readerRef.current) {
        const list = [...readerRef.current.querySelectorAll<HTMLElement>('button,input,[tabindex]:not([tabindex="-1"])')]
          .filter((el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null);
        if (!list.length) return;
        const first = list[0], lastEl = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => readerRef.current?.querySelector<HTMLElement>(reader?.q ? "#tm-rsearch" : ".tm-reader-close")?.focus(), 130);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [readerShown, reader, closeReader]);

  function toggleGroup(g: string) {
    setOpenGroups((prev) => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; });
  }
  function toggleFilter(g: string) {
    setFilters((prev) => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; });
  }
  function clearAll() { setQuery(""); setFilters(new Set()); }

  // reader passages filtered by within-book search
  const readerItems = useMemo(() => {
    if (!reader) return [];
    const ql = reader.q.trim().toLowerCase();
    if (!ql) return reader.book.highlights;
    return reader.book.highlights.filter((h) => h.text.toLowerCase().includes(ql) || (h.note && h.note.toLowerCase().includes(ql)));
  }, [reader]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <NavG active="Tomes" count={{ value: loaded ? books.length : "—", label: loaded ? "tomes" : "loading", color: ACCENT }} />

      <main className="tm-root">
        <div className="tm-amb" aria-hidden />
        <div className="tm-wrap">
          <header className="tm-head">
            <p className="tm-eyebrow">Nylus Vault · Reading Index</p>
            <h1 className="tm-title">Tomes of Interest</h1>
            <p className="tm-scale">
              {loaded
                ? <><b>{books.length}</b> volumes · <b>{totalHighlights.toLocaleString()}</b> highlights from Kindle</>
                : "loading the library…"}
            </p>
          </header>

          {/* search */}
          <div className="tm-searchbar">
            <label className="tm-search-lbl" htmlFor="tm-search">Search the library</label>
            <div className="tm-search-field">
              <input id="tm-search" type="search" autoComplete="off" spellCheck={false}
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="A title, an author, or a line you remember…" aria-describedby="tm-scope" />
              <button className={`tm-search-clear${query ? " show" : ""}`} type="button"
                onClick={() => setQuery("")} aria-label="Clear search">Clear</button>
            </div>
            <p className="tm-search-scope" id="tm-scope">
              {search && search.results.length > 0 && (
                <><b>{search.results.length}</b> book{search.results.length > 1 ? "s" : ""}
                  {search.totalPassages > 0 && <> · <b>{search.totalPassages.toLocaleString()}</b> matching passage{search.totalPassages > 1 ? "s" : ""}</>}</>
              )}
            </p>
          </div>

          {/* toolbar */}
          <div className="tm-tools">
            <div className="tm-toolgroup">
              <span className="tm-tl">Browse</span>
              <div className="tm-seg" role="group" aria-label="Browse mode">
                <button type="button" aria-pressed={view === "domain"} onClick={() => setView("domain")}>By domain</button>
                <button type="button" aria-pressed={view === "az"} onClick={() => setView("az")}>A–Z</button>
              </div>
            </div>
            <div className="tm-toolgroup">
              <span className="tm-tl">Order</span>
              <div className="tm-seg" role="group" aria-label="Sort order">
                <button type="button" aria-pressed={sort === "highlights"} onClick={() => setSort("highlights")}>Most highlighted</button>
                <button type="button" aria-pressed={sort === "title"} onClick={() => setSort("title")}>Title</button>
                <button type="button" aria-pressed={sort === "recent"} onClick={() => setSort("recent")}>Recently read</button>
              </div>
            </div>
          </div>

          {/* domain filters */}
          <div className="tm-filters" role="group" aria-label="Filter by domain">
            {groupList.map((g) => {
              const on = filters.has(g);
              return (
                <button key={g} type="button" className="tm-dom-btn" aria-pressed={on}
                  style={{ ["--dc" as string]: groupColor(g) }} onClick={() => toggleFilter(g)}>
                  <span className="tm-sq" aria-hidden /> {g} <span className="tm-ct">{groupCounts.get(g)}</span>
                </button>
              );
            })}
          </div>

          <div className="tm-result-meta">
            <span>
              {query.trim()
                ? <><b>{shownCount.toLocaleString()}</b> book{shownCount === 1 ? "" : "s"} found</>
                : <><b>{shownCount.toLocaleString()}</b> of {books.length} volumes</>}
            </span>
            <span>{search ? (search.totalPassages ? `${search.totalPassages.toLocaleString()} passages` : "") : view === "az" ? "A–Z" : (grouped ? `${grouped.length} ${grouped.length === 1 ? "group" : "groups"}` : "")}</span>
          </div>

          {/* ---- body ---- */}
          {loaded && shownCount === 0 && (
            <div className="tm-empty">
              <p>{query.trim() ? `No book or passage matches “${query.trim()}”.` : "No volumes match these filters."}</p>
              <button type="button" onClick={clearAll}>Clear search &amp; filters</button>
            </div>
          )}

          {/* search results */}
          {search && search.results.length > 0 && (
            <div className="tm-list">
              {search.results.map(({ b, matches, titleMatch }) => (
                <div key={b.id} className="tm-sr-book" style={accentVars(b.color)}>
                  <button type="button" className="tm-sr-head" onClick={(e) => openReader(b, e.currentTarget, query.trim())}>
                    <span className="tm-sr-title" dangerouslySetInnerHTML={{ __html: hi(b.title, titleMatch ? query.trim() : "") }} />
                    <span className="tm-sr-author">{b.author}</span>
                    <span className="tm-sr-pc">{matches.length ? `${matches.length} passage${matches.length > 1 ? "s" : ""}` : "title match"}</span>
                  </button>
                  {matches.length > 0 && (
                    <div className="tm-sr-snips">
                      {matches.slice(0, 3).map((h) => (
                        <div key={h.id} className="tm-sr-snip">
                          <span dangerouslySetInnerHTML={{ __html: snippet(h.text, query.trim()) }} />
                          <span className="tm-cap">loc {h.location} · {fmtDate((h.at || "").slice(0, 10))}</span>
                        </div>
                      ))}
                      {matches.length > 3 && (
                        <button type="button" className="tm-sr-more" onClick={(e) => openReader(b, e.currentTarget, query.trim())}>
                          read all {matches.length} passages →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* domain groups */}
          {!search && view === "domain" && grouped && (
            <div className="tm-list">
              {grouped.map(({ g, color, items }) => {
                const isOpen = openGroups.has(g);
                return (
                  <section key={g} className="tm-group" data-open={isOpen} style={{ ["--gc" as string]: color }}>
                    <button type="button" className="tm-group-head" aria-expanded={isOpen} onClick={() => toggleGroup(g)}>
                      <span className="tm-group-chev" aria-hidden>›</span>
                      <span className="tm-group-sq" aria-hidden />
                      <span className="tm-group-name">{g}</span>
                      <span className="tm-group-count">{items.length} {items.length === 1 ? "volume" : "volumes"}</span>
                    </button>
                    {isOpen && (
                      <div className="tm-group-body">
                        <div className="tm-group-inner">
                          {items.map((b) => <Row key={b.id} b={b} compact onOpen={openReader} />)}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          {/* a–z */}
          {!search && view === "az" && az && (
            <>
              <div className="tm-list">
                {az.rows.map((r, i) =>
                  r.letter
                    ? <div key={"L" + r.letter} className="tm-az-letter" id={"tm-az-" + r.letter}>{r.letter}</div>
                    : <Row key={r.book!.id} b={r.book!} onOpen={openReader} />,
                )}
              </div>
              <nav className="tm-az-rail" aria-label="Jump to letter">
                {"#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((L) => (
                  <button key={L} type="button" disabled={!az.present.has(L)}
                    onClick={() => document.getElementById("tm-az-" + L)?.scrollIntoView({ behavior: "smooth", block: "start" })}>{L}</button>
                ))}
              </nav>
            </>
          )}
        </div>
      </main>

      {/* reader */}
      <div className={`tm-scrim${readerShown ? " show" : ""}`} onClick={closeReader} aria-hidden />
      <aside ref={readerRef} className={`tm-reader${readerShown ? " show" : ""}`} role="dialog" aria-modal="true"
        aria-labelledby="tm-rtitle" aria-hidden={!readerShown} style={reader ? accentVars(reader.book.color) : undefined}>
        {reader && (
          <>
            <div className="tm-reader-top">
              <span className="tm-reader-accent" aria-hidden />
              <button className="tm-reader-close" type="button" onClick={closeReader} aria-label="Close reader">✕</button>
              <span className="tm-reader-domain"><span className="tm-sq" aria-hidden />{reader.book.tag}</span>
              <h2 className="tm-reader-title" id="tm-rtitle">{reader.book.title}</h2>
              <p className="tm-reader-author">{reader.book.author}</p>
              <p className="tm-reader-stat"><b>{reader.book.numHighlights.toLocaleString()}</b> highlights · last read {fmtDate(reader.book.lastHighlightedAt)}</p>
            </div>
            <div className="tm-reader-search">
              <input id="tm-rsearch" type="search" autoComplete="off" spellCheck={false}
                value={reader.q} onChange={(e) => setReader((r) => (r ? { ...r, q: e.target.value } : r))}
                placeholder="Search within this book…" aria-label="Search within this book" />
              <span className="tm-rs-n">{reader.q.trim() ? `${readerItems.length}/${reader.book.numHighlights}` : reader.book.numHighlights}</span>
            </div>
            <div className="tm-reader-body" tabIndex={-1}>
              {readerItems.length === 0 ? (
                <div className="tm-reader-empty">No passage here contains “{reader.q.trim()}”.</div>
              ) : readerItems.map((h) => (
                <div key={h.id} className="tm-hl">
                  <div className="tm-hl-text" dangerouslySetInnerHTML={{ __html: hi(h.text, reader.q.trim()) }} />
                  {h.note && <div className="tm-hl-note" dangerouslySetInnerHTML={{ __html: hi(h.note, reader.q.trim()) }} />}
                  <div className="tm-hl-cap">loc {h.location}<span className="d">·</span>{fmtDate((h.at || "").slice(0, 10))}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function accentVars(color: string): React.CSSProperties {
  return {
    ["--rc" as string]: color,
    ["--rtint" as string]: tint(color),
    ["--rglow" as string]: color.startsWith("#") ? rgba(color, 0.55) : "var(--tm-genre)",
    ["--vein-mid" as string]: color.startsWith("#") ? rgba(color, 0.4) : "var(--tm-genre)",
  } as React.CSSProperties;
}

function Row({ b, compact, onOpen }: { b: Book; compact?: boolean; onOpen: (b: Book, t: HTMLElement | null, q?: string) => void }) {
  const vdur = (6 + (b.numHighlights % 5) * 0.9).toFixed(1) + "s";
  return (
    <button type="button" className="tm-row" style={accentVars(b.color)}
      onClick={(e) => onOpen(b, e.currentTarget)}
      aria-label={`Open ${b.title} by ${b.author}, ${b.numHighlights} highlights`}>
      <span className="tm-rh-left">
        <span className="tm-rh-title">{b.title}</span>
        <span className="tm-rh-author">{b.author}</span>
        {!compact && <span className="tm-rh-domain"><span className="tm-sq" aria-hidden />{b.tag}</span>}
      </span>
      <span className="tm-vein" aria-hidden><span className="tm-dot" style={{ ["--vdur" as string]: vdur }} /></span>
      <span className="tm-rh-right">
        <span className="tm-rh-count">{b.numHighlights.toLocaleString()}<small>highlights</small></span>
        <span className="tm-rh-date">{fmtDate(b.lastHighlightedAt)}<span className="tm-rh-open" aria-hidden>read →</span></span>
      </span>
    </button>
  );
}

const CSS = `
.tm-root{
  --bg:#0e0d14; --deep:#08070e; --surface:#15131c;
  --hair:rgba(255,255,255,0.07); --divider:#1c1828; --faint:#2a2535;
  --text:#eae6f5; --muted:#8a849a; --dim:#494456; --ink:#ddd8ea;
  --tm-genre:#8a90a6; --tm-genre-tint:#c2c5d2; --blue:#60a5fa; --mark:rgba(96,165,250,.22);
  --ease-open:cubic-bezier(.32,.72,0,1); --ease-slide:cubic-bezier(.33,.9,.28,1);
  min-height:calc(100vh - 80px); background:var(--bg); color:var(--text);
  position:relative; overflow-x:hidden;
  font-family:var(--font-newsreader),Georgia,serif;
}
html[data-theme="sepia"] .tm-root{
  --bg:#f0ead8; --deep:#f5f0e8; --surface:#ede6d4;
  --hair:rgba(44,31,14,.13); --divider:#d8cdb8; --faint:#cabfa6;
  --text:#2c1f0e; --muted:#6f6048; --dim:#a8997a; --ink:#1e1408;
  --tm-genre:#9a8f78; --tm-genre-tint:#6f6048; --blue:#246a55; --mark:rgba(36,106,85,.20);
}
.tm-amb{position:fixed;top:-260px;right:-200px;width:680px;height:680px;border-radius:50%;
  background:radial-gradient(circle,rgba(96,165,250,.05),transparent 65%);pointer-events:none;z-index:0;}
html[data-theme="sepia"] .tm-amb{background:radial-gradient(circle,rgba(36,106,85,.05),transparent 65%);}
.tm-wrap{position:relative;z-index:1;max-width:1080px;margin:0 auto;padding:0 40px 160px;}

.tm-head{padding:60px 0 28px;}
.tm-eyebrow{font-family:var(--font-jetbrains),monospace;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--dim);margin:0 0 18px;}
.tm-title{font-family:var(--font-fraunces),Georgia,serif;font-style:italic;font-weight:400;font-size:clamp(44px,7vw,84px);
  line-height:.96;letter-spacing:-.02em;color:var(--ink);margin:0;}
.tm-scale{font-family:var(--font-jetbrains),monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:20px 0 0;font-variant-numeric:tabular-nums;}
.tm-scale b{color:var(--text);font-weight:500;}

.tm-searchbar{margin:32px 0 22px;}
.tm-search-lbl{display:block;font-family:var(--font-jetbrains),monospace;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--dim);margin-bottom:12px;}
.tm-search-field{display:flex;align-items:center;gap:14px;border-bottom:1px solid var(--hair);transition:border-color .25s;}
.tm-search-field:focus-within{border-color:color-mix(in srgb,var(--blue) 55%,transparent);}
#tm-search{flex:1;background:none;border:none;outline:none;color:var(--text);font-family:var(--font-newsreader),serif;font-style:italic;
  font-size:clamp(20px,3vw,28px);font-weight:300;padding:8px 0 14px;min-width:0;}
#tm-search::placeholder{color:var(--faint);}
#tm-search::-webkit-search-cancel-button{display:none;}
.tm-search-clear{background:none;border:none;color:var(--dim);font-family:var(--font-jetbrains),monospace;font-size:10px;letter-spacing:.18em;
  text-transform:uppercase;cursor:pointer;padding:8px 6px;opacity:0;transition:opacity .2s,color .2s;}
.tm-search-clear.show{opacity:1;}
.tm-search-clear:hover{color:var(--text);}
.tm-search-scope{font-family:var(--font-jetbrains),monospace;font-size:10px;letter-spacing:.14em;color:var(--dim);margin-top:10px;text-transform:uppercase;font-variant-numeric:tabular-nums;min-height:13px;}
.tm-search-scope b{color:var(--muted);}

.tm-tools{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:8px;}
.tm-toolgroup{display:flex;flex-direction:column;gap:9px;}
.tm-tl{font-family:var(--font-jetbrains),monospace;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--dim);}
.tm-seg{display:inline-flex;gap:4px;}
.tm-seg button{background:none;border:none;cursor:pointer;font-family:var(--font-jetbrains),monospace;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);padding:7px 12px;border-radius:6px;transition:color .18s,background .18s;}
.tm-seg button:hover{color:var(--text);}
.tm-seg button:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--blue) 55%,transparent);}
.tm-seg button[aria-pressed="true"]{color:var(--text);background:color-mix(in srgb,var(--text) 6%,transparent);}

.tm-filters{display:flex;flex-wrap:wrap;gap:7px 8px;margin:18px 0 6px;}
.tm-dom-btn{display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid var(--hair);color:var(--muted);
  font-family:var(--font-jetbrains),monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:8px 12px;border-radius:7px;
  cursor:pointer;transition:color .18s,border-color .18s,background .18s;min-height:34px;}
.tm-dom-btn .tm-sq{width:8px;height:8px;border-radius:2px;background:var(--dc,var(--tm-genre));flex-shrink:0;}
.tm-dom-btn:hover{color:var(--text);border-color:var(--dim);}
.tm-dom-btn:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--blue) 55%,transparent);}
.tm-dom-btn[aria-pressed="true"]{color:var(--text);border-color:color-mix(in srgb,var(--dc,var(--tm-genre)) 60%,transparent);
  background:color-mix(in srgb,var(--dc,var(--tm-genre)) 12%,transparent);}
.tm-dom-btn .tm-ct{color:var(--dim);font-variant-numeric:tabular-nums;}
.tm-dom-btn[aria-pressed="true"] .tm-ct{color:color-mix(in srgb,var(--text) 60%,transparent);}

.tm-result-meta{font-family:var(--font-jetbrains),monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);
  margin:26px 0 4px;font-variant-numeric:tabular-nums;display:flex;justify-content:space-between;align-items:center;gap:16px;}
.tm-result-meta b{color:var(--muted);}

/* rows */
.tm-row{display:flex;align-items:center;gap:20px;width:100%;background:none;border:none;cursor:pointer;text-align:left;
  color:var(--text);padding:18px 4px;border-bottom:1px solid var(--divider);transition:padding-left .18s;}
.tm-row:hover{padding-left:10px;}
.tm-row:focus-visible{outline:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--blue) 60%,transparent);border-radius:6px;}
.tm-rh-left{display:flex;flex-direction:column;gap:5px;min-width:0;flex:0 1 auto;}
.tm-rh-title{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:clamp(19px,2.4vw,25px);line-height:1.12;
  color:var(--rtint,var(--ink));transition:text-shadow .25s,filter .25s;}
.tm-row:hover .tm-rh-title{text-shadow:0 0 18px var(--rglow,transparent);filter:brightness(1.08);}
.tm-rh-author{font-family:var(--font-newsreader),serif;font-style:italic;font-weight:300;font-size:13.5px;color:var(--muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46ch;}
.tm-rh-domain{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--dim);margin-top:2px;}
.tm-rh-domain .tm-sq{width:7px;height:7px;border-radius:2px;background:var(--rc,var(--tm-genre));flex-shrink:0;}
.tm-vein{flex:1;position:relative;height:2px;min-width:30px;background:linear-gradient(90deg,transparent,var(--vein-mid,rgba(255,255,255,.2)),transparent);}
.tm-dot{position:absolute;top:50%;left:0;width:6px;height:6px;border-radius:50%;background:var(--rc,var(--tm-genre));
  transform:translate(-50%,-50%);box-shadow:0 0 8px var(--rc),0 0 16px var(--rc);animation:tmTravel var(--vdur,7s) linear infinite;}
@keyframes tmTravel{from{left:-2%}to{left:102%}}
.tm-rh-right{display:flex;align-items:center;gap:16px;flex-shrink:0;}
.tm-rh-count{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:24px;color:var(--ink);
  font-variant-numeric:tabular-nums;line-height:1;display:flex;flex-direction:column;align-items:flex-end;gap:3px;}
.tm-rh-count small{font-family:var(--font-jetbrains),monospace;font-style:normal;font-size:7.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);}
.tm-rh-date{font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);
  font-variant-numeric:tabular-nums;display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:54px;}
.tm-rh-open{font-family:var(--font-jetbrains),monospace;font-size:8px;letter-spacing:.1em;color:var(--faint);transition:color .2s,transform .2s;}
.tm-row:hover .tm-rh-open{color:var(--rc,var(--blue));transform:translateX(2px);}

/* groups */
.tm-group{border-bottom:1px solid var(--divider);}
.tm-group:first-of-type{border-top:1px solid var(--divider);}
.tm-group-head{display:flex;align-items:center;gap:16px;width:100%;background:none;border:none;cursor:pointer;text-align:left;color:var(--text);padding:20px 4px;}
.tm-group-head:focus-visible{outline:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--blue) 60%,transparent);border-radius:6px;}
.tm-group-chev{font-family:var(--font-jetbrains),monospace;font-size:14px;color:var(--dim);transition:transform .3s var(--ease-open);width:14px;flex-shrink:0;}
.tm-group[data-open="true"] .tm-group-chev{transform:rotate(90deg);}
.tm-group-sq{width:10px;height:10px;border-radius:3px;background:var(--gc,var(--tm-genre));flex-shrink:0;transition:box-shadow .3s;}
.tm-group-head:hover .tm-group-sq{box-shadow:0 0 12px color-mix(in srgb,var(--gc,var(--tm-genre)) 70%,transparent);}
.tm-group-name{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:23px;color:var(--ink);flex:1;}
.tm-group-head:hover .tm-group-name{filter:brightness(1.12);}
.tm-group-count{font-family:var(--font-jetbrains),monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);font-variant-numeric:tabular-nums;}
.tm-group-body{overflow:hidden;animation:tmReveal .34s var(--ease-open);}
@keyframes tmReveal{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.tm-group-inner{padding:0 0 10px 30px;}
.tm-group-inner .tm-row{border-bottom:1px solid var(--faint);}
.tm-group-inner .tm-row:last-child{border-bottom:none;}

/* a–z */
.tm-az-letter{position:sticky;top:0;background:linear-gradient(var(--bg),var(--bg) 70%,transparent);
  font-family:var(--font-fraunces),serif;font-style:italic;font-weight:600;font-size:18px;color:var(--blue);
  padding:18px 4px 8px;z-index:5;border-bottom:1px solid var(--divider);}
.tm-az-rail{position:fixed;right:max(10px,calc((100vw - 1080px)/2 - 24px));top:50%;transform:translateY(-50%);
  display:flex;flex-direction:column;gap:1px;z-index:30;}
.tm-az-rail button{background:none;border:none;cursor:pointer;font-family:var(--font-jetbrains),monospace;font-size:9px;color:var(--dim);
  padding:1px 5px;border-radius:3px;transition:color .15s,background .15s;line-height:1.3;}
.tm-az-rail button:hover,.tm-az-rail button:focus-visible{color:var(--text);background:color-mix(in srgb,var(--blue) 18%,transparent);outline:none;}
.tm-az-rail button:disabled{color:var(--faint);cursor:default;}

/* empty */
.tm-empty{padding:70px 10px;text-align:center;}
.tm-empty p{font-family:var(--font-newsreader),serif;font-style:italic;font-size:20px;color:var(--muted);margin:0 0 18px;}
.tm-empty button{font-family:var(--font-jetbrains),monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--blue);
  background:none;border:1px solid color-mix(in srgb,var(--blue) 40%,transparent);padding:11px 20px;border-radius:7px;cursor:pointer;transition:background .2s;}
.tm-empty button:hover{background:color-mix(in srgb,var(--blue) 10%,transparent);}

/* search results */
.tm-sr-book{border-bottom:1px solid var(--divider);padding:18px 4px;}
.tm-sr-head{display:flex;align-items:baseline;gap:14px;width:100%;background:none;border:none;cursor:pointer;text-align:left;padding:4px;}
.tm-sr-head:focus-visible{outline:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--blue) 60%,transparent);border-radius:6px;}
.tm-sr-title{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:21px;color:var(--rtint,var(--ink));}
.tm-sr-head:hover .tm-sr-title{filter:brightness(1.1);}
.tm-sr-author{font-family:var(--font-newsreader),serif;font-style:italic;font-size:13px;color:var(--muted);}
.tm-sr-pc{font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--rc,var(--blue));margin-left:auto;flex-shrink:0;font-variant-numeric:tabular-nums;}
.tm-sr-snips{margin:10px 0 2px;padding-left:18px;border-left:2px solid var(--rc,var(--tm-genre));display:flex;flex-direction:column;gap:12px;}
.tm-sr-snip{font-family:var(--font-newsreader),serif;font-style:italic;font-weight:300;font-size:15px;line-height:1.6;color:var(--text);opacity:.85;}
.tm-sr-snip .tm-cap{display:block;font-family:var(--font-jetbrains),monospace;font-style:normal;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-top:5px;font-variant-numeric:tabular-nums;opacity:1;}
.tm-sr-more{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);background:none;border:none;cursor:pointer;padding:8px 0 2px;transition:color .2s;}
.tm-sr-more:hover{color:var(--rc,var(--blue));}
.tm-sr-more:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--blue) 50%,transparent);border-radius:4px;}
mark{background:var(--mark);color:var(--text);border-radius:2px;padding:0 1px;}

/* reader */
.tm-scrim{position:fixed;inset:0;background:rgba(4,3,10,.62);opacity:0;pointer-events:none;z-index:150;transition:opacity .3s;}
html[data-theme="sepia"] .tm-scrim{background:rgba(60,46,24,.4);}
.tm-scrim.show{opacity:1;pointer-events:auto;}
.tm-reader{position:fixed;top:0;right:0;height:100%;width:min(560px,100%);background:var(--deep);z-index:160;
  border-left:1px solid var(--hair);transform:translateX(102%);transition:transform .42s var(--ease-slide);
  display:flex;flex-direction:column;box-shadow:-30px 0 80px rgba(0,0,0,.5);
  --bg:#0e0d14;--deep:#08070e;--surface:#15131c;--hair:rgba(255,255,255,0.07);--divider:#1c1828;--faint:#2a2535;
  --text:#eae6f5;--muted:#8a849a;--dim:#494456;--ink:#ddd8ea;--tm-genre:#8a90a6;--blue:#60a5fa;--mark:rgba(96,165,250,.22);}
html[data-theme="sepia"] .tm-reader{
  --bg:#f0ead8;--deep:#f5f0e8;--surface:#ede6d4;--hair:rgba(44,31,14,.13);--divider:#d8cdb8;--faint:#cabfa6;
  --text:#2c1f0e;--muted:#6f6048;--dim:#a8997a;--ink:#1e1408;--tm-genre:#9a8f78;--blue:#246a55;--mark:rgba(36,106,85,.20);
  color:var(--text);}
.tm-reader.show{transform:translateX(0);}
.tm-reader-top{padding:30px 30px 18px;border-bottom:1px solid var(--divider);flex-shrink:0;position:relative;}
.tm-reader-accent{position:absolute;top:0;left:0;width:3px;height:100%;background:var(--rc,var(--tm-genre));box-shadow:0 0 16px color-mix(in srgb,var(--rc,var(--tm-genre)) 70%,transparent);}
.tm-reader-domain{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--rc,var(--tm-genre));margin-bottom:14px;}
.tm-reader-domain .tm-sq{width:8px;height:8px;border-radius:2px;background:var(--rc,var(--tm-genre));}
.tm-reader-title{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:28px;line-height:1.1;color:var(--ink);margin:0 0 7px;padding-right:44px;}
.tm-reader-author{font-family:var(--font-newsreader),serif;font-style:italic;font-weight:300;font-size:15px;color:var(--muted);margin:0 0 16px;}
.tm-reader-stat{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);font-variant-numeric:tabular-nums;}
.tm-reader-stat b{color:var(--muted);}
.tm-reader-close{position:absolute;top:26px;right:24px;width:38px;height:38px;border-radius:8px;background:color-mix(in srgb,var(--text) 4%,transparent);
  border:1px solid var(--hair);color:var(--muted);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s,color .2s;line-height:1;}
.tm-reader-close:hover{background:color-mix(in srgb,var(--text) 9%,transparent);color:var(--text);}
.tm-reader-close:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--blue) 60%,transparent);}
.tm-reader-search{display:flex;align-items:center;gap:10px;padding:14px 30px;border-bottom:1px solid var(--divider);flex-shrink:0;}
.tm-reader-search input{flex:1;background:var(--surface);border:1px solid var(--hair);border-radius:8px;color:var(--text);font-family:var(--font-jetbrains),monospace;font-size:12px;padding:10px 12px;outline:none;transition:border-color .2s;min-width:0;}
.tm-reader-search input:focus{border-color:color-mix(in srgb,var(--blue) 50%,transparent);}
.tm-reader-search input::-webkit-search-cancel-button{display:none;}
.tm-rs-n{font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);font-variant-numeric:tabular-nums;white-space:nowrap;}
.tm-reader-body{flex:1;overflow-y:auto;padding:8px 30px 60px;overscroll-behavior:contain;}
.tm-hl{padding:18px 0;border-bottom:1px solid var(--faint);}
.tm-hl:last-child{border-bottom:none;}
.tm-hl-text{font-family:var(--font-newsreader),serif;font-weight:300;font-size:16px;line-height:1.66;color:var(--text);}
.tm-hl-note{font-family:var(--font-newsreader),serif;font-style:italic;font-size:14px;color:var(--muted);margin-top:8px;padding-left:13px;border-left:2px solid var(--rc,var(--tm-genre));}
.tm-hl-cap{font-family:var(--font-jetbrains),monospace;font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:10px;font-variant-numeric:tabular-nums;}
.tm-hl-cap .d{margin:0 6px;color:var(--faint);}
.tm-reader-empty{font-family:var(--font-newsreader),serif;font-style:italic;color:var(--muted);padding:40px 0;text-align:center;}

@media (max-width:760px){
  .tm-wrap{padding:0 18px 120px;}
  .tm-head{padding:36px 0 20px;}
  .tm-az-rail{display:none;}
  .tm-row{flex-wrap:wrap;gap:8px 14px;padding:16px 4px;}
  .tm-rh-left{flex:1 1 100%;}
  .tm-vein{order:5;flex-basis:100%;}
  .tm-rh-right{order:4;width:100%;justify-content:space-between;}
  .tm-group-inner{padding-left:14px;}
  .tm-reader{width:100%;border-left:none;border-top:1px solid var(--hair);transform:translateY(102%);}
  .tm-reader.show{transform:translateY(0);}
}
@media (prefers-reduced-motion:reduce){
  .tm-dot{animation:none;display:none;}
  .tm-group-body{animation:none;}
  .tm-reader{transition:opacity .2s;transform:none;opacity:0;pointer-events:none;}
  .tm-reader.show{opacity:1;pointer-events:auto;}
}
`;
