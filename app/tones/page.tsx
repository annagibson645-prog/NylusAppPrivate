"use client";

// app/tones/page.tsx — "Tomes of Interest": the Kindle-highlights Index.
// Landing screen is a "cabinet" of the vault's domains (animated sigil per
// domain, shared with /research — see components/DomainIcon.tsx), sized by
// how much you've actually highlighted in each. Click one to drill into a
// per-domain reading ledger — sorted most-recent-first by default, with a
// real 12-month activity sparkline per book. A global search bar (always
// visible) searches every book/highlight in the library regardless of which
// screen you're on. Reads /data/highlights.json (built by build-highlights.ts
// + classify-highlights.ts). Theme-aware (void + sepia).
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import NavG from "@/components/NavG";
import { DomainIcon, DOMAIN_ICON_KEYFRAMES } from "@/components/DomainIcon";

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
// Same domains, keyed the way ResearchLoom/DomainIcon expect — keeps the
// sigil on this page identical to the one on /research.
const DOMAIN_ICON_KEY: Record<string, string> = {
  "Eastern Spirituality": "eastern-spirituality", History: "history", Psychology: "psychology",
  "Behavioral Mechanics": "behavioral-mechanics", Business: "business", "Creative Practice": "creative-practice",
  "Cross-Domain": "cross-domain", "African Spirituality": "african-spirituality",
};
const DOMAIN_ORDER = [
  "Eastern Spirituality", "History", "Psychology", "Behavioral Mechanics",
  "Business", "Creative Practice", "Cross-Domain", "African Spirituality",
];
const OTHER = "Other Genres";
const GENRE_COLOR = "var(--tm-genre)";
const GENRE_GLOW = "rgba(138,144,166,.55)"; // concrete fallback — GENRE_COLOR is a css var and can't be string-concatenated into a filter

type SortKey = "highlights" | "title" | "recent";
type Screen = "cabinet" | "domain";

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
  const [screen, setScreen] = useState<Screen>("cabinet");
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");

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
        setLoaded(true);
      })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const totalHighlights = useMemo(() => books.reduce((s, b) => s + b.numHighlights, 0), [books]);

  const groupCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of books) m.set(b.group, (m.get(b.group) || 0) + 1);
    return m;
  }, [books]);
  const groupHighlights = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of books) m.set(b.group, (m.get(b.group) || 0) + b.numHighlights);
    return m;
  }, [books]);
  const groupList = useMemo(
    () => [...DOMAIN_ORDER, OTHER].filter((g) => groupCounts.has(g)),
    [groupCounts],
  );
  const maxGroupHighlights = useMemo(
    () => Math.max(1, ...groupList.map((g) => groupHighlights.get(g) || 0)),
    [groupList, groupHighlights],
  );
  function groupColor(g: string) { return g === OTHER ? GENRE_COLOR : DOMAIN_COLORS[g]; }

  const sortBooks = useCallback((arr: Book[]) => {
    const a = arr.slice();
    if (sort === "title") a.sort((x, y) => sortKeyTitle(x.title).localeCompare(sortKeyTitle(y.title)));
    else if (sort === "recent") a.sort((x, y) => (y.lastHighlightedAt || "").localeCompare(x.lastHighlightedAt || ""));
    else a.sort((x, y) => y.numHighlights - x.numHighlights);
    return a;
  }, [sort]);

  const domainBooks = useMemo(() => {
    if (!activeDomain) return [];
    return sortBooks(books.filter((b) => b.group === activeDomain));
  }, [books, activeDomain, sortBooks]);

  // search — always runs over the full library, independent of which screen
  // (cabinet or a drilled-into domain) is currently showing.
  const search = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const ql = q.toLowerCase();
    const results: { b: Book; matches: Highlight[]; titleMatch: boolean }[] = [];
    for (const b of books) {
      const titleMatch = b.hay.includes(ql);
      const matches = b.highlights.filter(
        (h) => h.text.toLowerCase().includes(ql) || (h.note && h.note.toLowerCase().includes(ql)),
      );
      if (titleMatch || matches.length) results.push({ b, matches, titleMatch });
    }
    results.sort((a, b) => b.matches.length - a.matches.length || b.b.numHighlights - a.b.numHighlights);
    return { q, results, totalPassages: results.reduce((s, r) => s + r.matches.length, 0) };
  }, [query, books]);

  /* ---------- screen control ---------- */
  const openDomain = useCallback((g: string) => {
    setActiveDomain(g);
    setScreen("domain");
    setSort("recent");
  }, []);
  const backToCabinet = useCallback(() => {
    setScreen("cabinet");
    setActiveDomain(null);
  }, []);

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

  function clearSearch() { setQuery(""); }

  // reader passages filtered by within-book search
  const readerItems = useMemo(() => {
    if (!reader) return [];
    const ql = reader.q.trim().toLowerCase();
    if (!ql) return reader.book.highlights;
    return reader.book.highlights.filter((h) => h.text.toLowerCase().includes(ql) || (h.note && h.note.toLowerCase().includes(ql)));
  }, [reader]);

  const activeDomainColor = activeDomain ? groupColor(activeDomain) : ACCENT;

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

          {/* search — global, always available */}
          <div className="tm-searchbar">
            <label className="tm-search-lbl" htmlFor="tm-search">Search the library</label>
            <div className="tm-search-field">
              <input id="tm-search" type="search" autoComplete="off" spellCheck={false}
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="A title, an author, or a line you remember…" aria-describedby="tm-scope" />
              <button className={`tm-search-clear${query ? " show" : ""}`} type="button"
                onClick={clearSearch} aria-label="Clear search">Clear</button>
            </div>
            <p className="tm-search-scope" id="tm-scope">
              {search && search.results.length > 0 && (
                <><b>{search.results.length}</b> book{search.results.length > 1 ? "s" : ""}
                  {search.totalPassages > 0 && <> · <b>{search.totalPassages.toLocaleString()}</b> matching passage{search.totalPassages > 1 ? "s" : ""}</>}
                  {" "}across the whole library</>
              )}
            </p>
          </div>

          {/* ---- search results (overrides whichever screen is active) ---- */}
          {search && (
            search.results.length === 0 ? (
              <div className="tm-empty">
                <p>No book or passage matches “{search.q}”.</p>
                <button type="button" onClick={clearSearch}>Clear search</button>
              </div>
            ) : (
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
            )
          )}

          {/* ---- cabinet: the front door — one plate per domain ---- */}
          {!search && screen === "cabinet" && (
            !loaded ? (
              <div className="tm-empty"><p>loading the library…</p></div>
            ) : (
              <div className="tm-cab-grid">
                {groupList.map((g) => {
                  const color = groupColor(g);
                  const count = groupCounts.get(g) || 0;
                  const hCount = groupHighlights.get(g) || 0;
                  const orb = Math.round(56 + (hCount / maxGroupHighlights) * 38);
                  const iconKey = DOMAIN_ICON_KEY[g];
                  return (
                    <button key={g} type="button" className="tm-cab-plate"
                      style={{ ["--dc" as string]: color }}
                      onClick={() => openDomain(g)}
                      aria-label={`Browse ${g} — ${count} volumes, ${hCount.toLocaleString()} highlights`}>
                      <div className="tm-cab-orb" style={{ ["--orb" as string]: `${orb}px` }}>
                        {iconKey
                          ? <DomainIcon domainKey={iconKey} color={color} style={{ width: orb * 0.56, height: orb * 0.56 }} />
                          : <OtherIcon size={orb * 0.56} />}
                      </div>
                      <p className="tm-cab-name">{g}</p>
                      <p className="tm-cab-stat">{count} {count === 1 ? "volume" : "volumes"} · {hCount.toLocaleString()} highlights</p>
                      <p className="tm-cab-hint">tap to browse <span aria-hidden>→</span></p>
                    </button>
                  );
                })}
              </div>
            )
          )}

          {/* ---- domain ledger: books in one domain, sorted (recent by default) ---- */}
          {!search && screen === "domain" && activeDomain && (
            <>
              <div className="tm-dom-head">
                <button type="button" className="tm-back" onClick={backToCabinet}>← All Domains</button>
                <div className="tm-dom-id">
                  <div className="tm-dom-icon" style={{ ["--dc" as string]: activeDomainColor }}>
                    {DOMAIN_ICON_KEY[activeDomain]
                      ? <DomainIcon domainKey={DOMAIN_ICON_KEY[activeDomain]} color={activeDomainColor} style={{ width: 24, height: 24 }} />
                      : <OtherIcon size={24} />}
                  </div>
                  <div>
                    <h2 className="tm-dom-name">{activeDomain}</h2>
                    <p className="tm-dom-stat">
                      {(groupCounts.get(activeDomain) || 0).toLocaleString()} volumes · {(groupHighlights.get(activeDomain) || 0).toLocaleString()} highlights
                    </p>
                  </div>
                </div>
              </div>

              <div className="tm-tools">
                <div className="tm-toolgroup">
                  <span className="tm-tl">Order</span>
                  <div className="tm-seg" role="group" aria-label="Sort order">
                    <button type="button" aria-pressed={sort === "recent"} onClick={() => setSort("recent")}>Recently read</button>
                    <button type="button" aria-pressed={sort === "highlights"} onClick={() => setSort("highlights")}>Most highlighted</button>
                    <button type="button" aria-pressed={sort === "title"} onClick={() => setSort("title")}>Title</button>
                  </div>
                </div>
              </div>

              {domainBooks.length === 0 ? (
                <div className="tm-empty"><p>No volumes in {activeDomain} yet.</p></div>
              ) : (
                <div className="tm-ledger">
                  <div className="tm-ledger-head" aria-hidden="true">
                    <span>Title</span><span className="num">Highlights</span><span>Activity, 12mo</span><span className="num">Last read</span>
                  </div>
                  {domainBooks.map((b) => (
                    <LedgerRow key={b.id} b={b} onOpen={openReader} />
                  ))}
                </div>
              )}
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
  } as React.CSSProperties;
}

/** Fallback sigil for "Other Genres" — not one of the eight research domains,
 * so it gets a quiet generic mark instead of ResearchLoom's fallback icon
 * (which would otherwise misleadingly reuse the Cross-Domain glyph). */
function OtherIcon({ size = 24 }: { size?: number }) {
  return (
    <div className="cs-orb-sym" style={{
      width: size, height: size, color: "#8a90a6",
      display: "flex", alignItems: "center", justifyContent: "center",
      filter: `drop-shadow(0 0 6px ${GENRE_GLOW})`,
      animation: "corpusSymPulse 3.6s ease-in-out infinite",
    }}>
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" style={{ width: "100%", height: "100%" }}>
        <rect x="7" y="10" width="7" height="20" rx="1" />
        <rect x="16" y="7" width="7" height="23" rx="1" />
        <rect x="25" y="13" width="7" height="17" rx="1" />
      </svg>
    </div>
  );
}

function Sparkline({ activity }: { activity: number[] }) {
  const max = Math.max(1, ...activity);
  return (
    <span className="tm-spark" aria-hidden="true">
      {activity.map((v, i) => <i key={i} style={{ height: `${2 + (v / max) * 16}px` }} />)}
    </span>
  );
}

function LedgerRow({ b, onOpen }: { b: Book; onOpen: (b: Book, t: HTMLElement | null, q?: string) => void }) {
  return (
    <button type="button" className="tm-ledger-row" style={accentVars(b.color)}
      onClick={(e) => onOpen(b, e.currentTarget)}
      aria-label={`Open ${b.title} by ${b.author}, ${b.numHighlights} highlights`}>
      <span className="tm-l-title-wrap">
        <span className="tm-l-title">{b.title}</span>
        <span className="tm-l-author">{b.author}</span>
      </span>
      <span className="tm-l-count num">{b.numHighlights.toLocaleString()}</span>
      <Sparkline activity={b.activity || []} />
      <span className="tm-l-date num">{fmtDate(b.lastHighlightedAt)}</span>
    </button>
  );
}

const CSS = DOMAIN_ICON_KEYFRAMES + `
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

.tm-tools{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin:0 0 20px;}
.tm-toolgroup{display:flex;flex-direction:column;gap:9px;}
.tm-tl{font-family:var(--font-jetbrains),monospace;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--dim);}
.tm-seg{display:inline-flex;gap:4px;}
.tm-seg button{background:none;border:none;cursor:pointer;font-family:var(--font-jetbrains),monospace;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted);padding:7px 12px;border-radius:6px;transition:color .18s,background .18s;}
.tm-seg button:hover{color:var(--text);}
.tm-seg button:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--blue) 55%,transparent);}
.tm-seg button[aria-pressed="true"]{color:var(--text);background:color-mix(in srgb,var(--text) 6%,transparent);}

/* empty */
.tm-empty{padding:70px 10px;text-align:center;}
.tm-empty p{font-family:var(--font-newsreader),serif;font-style:italic;font-size:20px;color:var(--muted);margin:0 0 18px;}
.tm-empty button{font-family:var(--font-jetbrains),monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--blue);
  background:none;border:1px solid color-mix(in srgb,var(--blue) 40%,transparent);padding:11px 20px;border-radius:7px;cursor:pointer;transition:background .2s;}
.tm-empty button:hover{background:color-mix(in srgb,var(--blue) 10%,transparent);}

/* search results */
.tm-sr-book{border:1px solid var(--divider);border-radius:10px;padding:18px 20px;margin-bottom:12px;
  background:color-mix(in srgb,var(--surface) 55%,transparent);}
.tm-sr-head{display:flex;align-items:baseline;gap:14px;width:100%;background:none;border:none;cursor:pointer;text-align:left;padding:2px 0;}
.tm-sr-head:focus-visible{outline:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--blue) 60%,transparent);border-radius:6px;}
.tm-sr-title{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:21px;color:var(--rtint,var(--ink));}
.tm-sr-head:hover .tm-sr-title{filter:brightness(1.1);}
.tm-sr-author{font-family:var(--font-newsreader),serif;font-style:italic;font-size:13px;color:var(--muted);}
.tm-sr-pc{font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--rc,var(--blue));margin-left:auto;flex-shrink:0;font-variant-numeric:tabular-nums;}
.tm-sr-snips{margin:14px 0 2px;display:flex;flex-direction:column;gap:10px;}
.tm-sr-snip{font-family:var(--font-newsreader),serif;font-style:italic;font-weight:300;font-size:15px;line-height:1.6;color:var(--text);opacity:.85;
  background:color-mix(in srgb,var(--rc,var(--tm-genre)) 7%,transparent);border-radius:7px;padding:12px 14px;}
.tm-sr-snip .tm-cap{display:block;font-family:var(--font-jetbrains),monospace;font-style:normal;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-top:6px;font-variant-numeric:tabular-nums;opacity:1;}
.tm-sr-more{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);background:none;border:none;cursor:pointer;padding:8px 0 2px;transition:color .2s;}
.tm-sr-more:hover{color:var(--rc,var(--blue));}
.tm-sr-more:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--blue) 50%,transparent);border-radius:4px;}
mark{background:var(--mark);color:var(--text);border-radius:2px;padding:0 1px;}

/* cabinet */
.tm-cab-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:8px 0 4px;}
.tm-cab-plate{position:relative;text-align:left;cursor:pointer;border:1px solid var(--divider);border-radius:12px;
  padding:26px 22px 22px;overflow:hidden;background:color-mix(in srgb,var(--surface) 55%,transparent);
  transition:border-color .2s,transform .2s;}
.tm-cab-plate::before{content:"";position:absolute;inset:0;
  background:radial-gradient(120% 140% at 12% -10%, color-mix(in srgb,var(--dc) 12%,transparent), transparent 60%);
  pointer-events:none;}
.tm-cab-plate:hover{border-color:color-mix(in srgb,var(--dc) 45%,var(--divider));transform:translateY(-3px);}
.tm-cab-plate:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--blue) 55%,transparent);}
.tm-cab-orb{position:relative;width:var(--orb,64px);height:var(--orb,64px);margin:0 0 20px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 35% 30%, color-mix(in srgb,var(--dc) 28%,transparent), transparent 72%);}
.tm-cab-name{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:20px;color:var(--ink);margin:0 0 8px;position:relative;}
.tm-cab-stat{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 14px;font-variant-numeric:tabular-nums;position:relative;}
.tm-cab-hint{font-family:var(--font-jetbrains),monospace;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:0;position:relative;
  display:flex;align-items:center;gap:6px;transition:color .2s,gap .2s;}
.tm-cab-plate:hover .tm-cab-hint{color:var(--dc);gap:9px;}

/* domain header */
.tm-dom-head{display:flex;align-items:center;gap:18px;margin:30px 0 24px;flex-wrap:wrap;}
.tm-back{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);
  background:none;border:1px solid var(--hair);border-radius:7px;padding:9px 13px;cursor:pointer;transition:color .18s,border-color .18s;flex-shrink:0;}
.tm-back:hover{color:var(--text);border-color:var(--dim);}
.tm-back:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--blue) 55%,transparent);}
.tm-dom-id{display:flex;align-items:center;gap:14px;min-width:0;}
.tm-dom-icon{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;
  background:radial-gradient(circle at 35% 30%, color-mix(in srgb,var(--dc) 28%,transparent), transparent 72%);}
.tm-dom-name{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:clamp(24px,4vw,32px);color:var(--ink);margin:0;line-height:1.05;}
.tm-dom-stat{font-family:var(--font-jetbrains),monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:6px 0 0;font-variant-numeric:tabular-nums;}

/* ledger */
.tm-ledger{margin-top:2px;}
.tm-ledger-head,.tm-ledger-row{display:grid;grid-template-columns:1fr 78px minmax(84px,150px) 66px;align-items:center;gap:16px;}
.tm-ledger-head{padding:0 6px 12px;border-bottom:1px solid var(--divider);
  font-family:var(--font-jetbrains),monospace;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);}
.tm-ledger-head .num{text-align:right;}
.tm-ledger-row{width:100%;background:none;border:none;border-bottom:1px solid var(--faint);cursor:pointer;text-align:left;
  padding:15px 6px;color:var(--text);transition:background .18s,padding-left .18s;}
.tm-ledger-row:last-child{border-bottom:none;}
.tm-ledger-row:hover{background:color-mix(in srgb,var(--rc,var(--tm-genre)) 5%,transparent);padding-left:10px;}
.tm-ledger-row:focus-visible{outline:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--blue) 60%,transparent);border-radius:6px;}
.tm-l-title-wrap{display:flex;flex-direction:column;gap:4px;min-width:0;}
.tm-l-title{font-family:var(--font-fraunces),serif;font-style:italic;font-weight:500;font-size:16.5px;color:var(--rtint,var(--ink));
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tm-l-author{font-family:var(--font-newsreader),serif;font-style:italic;font-weight:300;font-size:12px;color:var(--muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tm-l-count.num{font-family:var(--font-jetbrains),monospace;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;text-align:right;}
.tm-l-date.num{font-family:var(--font-jetbrains),monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);font-variant-numeric:tabular-nums;text-align:right;}
.tm-spark{display:inline-flex;align-items:flex-end;gap:2px;height:18px;}
.tm-spark i{display:block;width:3px;border-radius:1px 1px 0 0;background:color-mix(in srgb,var(--rc,var(--tm-genre)) 55%,var(--faint));}

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
.tm-reader-top{padding:30px 30px 18px;border-bottom:1px solid color-mix(in srgb,var(--rc,var(--tm-genre)) 25%,var(--divider));flex-shrink:0;position:relative;}
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
.tm-hl-note{font-family:var(--font-newsreader),serif;font-style:italic;font-size:14px;color:var(--muted);margin-top:10px;
  background:color-mix(in srgb,var(--rc,var(--tm-genre)) 8%,transparent);border-radius:7px;padding:9px 13px;}
.tm-hl-cap{font-family:var(--font-jetbrains),monospace;font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:10px;font-variant-numeric:tabular-nums;}
.tm-hl-cap .d{margin:0 6px;color:var(--faint);}
.tm-reader-empty{font-family:var(--font-newsreader),serif;font-style:italic;color:var(--muted);padding:40px 0;text-align:center;}

@media (max-width:760px){
  .tm-wrap{padding:0 18px 120px;}
  .tm-head{padding:36px 0 20px;}
  .tm-reader{width:100%;border-left:none;border-top:1px solid var(--hair);transform:translateY(102%);}
  .tm-reader.show{transform:translateY(0);}
}
@media (max-width:640px){
  .tm-ledger-head{display:none;}
  .tm-ledger-row{display:flex;flex-wrap:wrap;gap:6px 16px;padding:14px 4px;}
  .tm-l-title-wrap{flex:1 1 100%;}
  .tm-spark{display:none;}
}
@media (prefers-reduced-motion:reduce){
  .tm-reader{transition:opacity .2s;transform:none;opacity:0;pointer-events:none;}
  .tm-reader.show{opacity:1;pointer-events:auto;}
}
`;
