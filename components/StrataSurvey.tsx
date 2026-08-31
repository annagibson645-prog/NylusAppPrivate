"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DomainIcon, DOMAIN_ICON_KEYFRAMES } from "@/components/DomainIcon";

// ─── The Strata — survey rack ────────────────────────────────────────────────
// Worldview archaeology grouped the way it is actually made: by BUILD, not by
// file. Fifty-seven reports are fourteen cores; each core is a source read
// chapter by chapter, and its parts are the sections of one drill.
//
// Direction: industrial / utilitarian — the same field log the single-column
// version established, restructured from a stacked list into a survey. Domain
// bands run down the page like strata in an exposed face, each carrying its own
// colour; inside a band the cores sit in a rack rather than a column, so the
// eye reads across instead of falling down a 57-row drop.
//
// Signature motion: THE RE-DRILL. Changing a filter does not hide rows — it
// re-cuts the survey. Every visible column collapses to nothing and deposits
// again on a stagger, the way sediment settles into a fresh bore. Nothing else
// on the site re-runs its own load animation as a response to input.
//
// Bands are CAPPED BORES. As the build grows, an all-open survey becomes one
// long drop again — the thing the rack was built to avoid — so a band opens and
// closes, and a closed one still shows its seam profile: one tick per core,
// height by layer count. You can read the shape of a domain without cutting it.
// Default is the largest band open and the rest capped; filtering opens every
// band it matches, because a filter that hides its own results is a trap.

export type Stratum = { label: string; deep: boolean };

export type StrataReport = {
  id: string;
  title: string;
  domain: string;
  created: string;
  word_count?: number;
  source_line?: string;
  strata: Stratum[];
  depth: number;
  deepCount: number;
  family: string;
  familyLabel: string;
  kind: "part" | "synthesis" | "superseded" | "single";
  order: number;
};

export type Family = {
  key: string;
  label: string;
  domain: string;
  source_line?: string;
  reports: StrataReport[];
  layers: number;
  sourced: number;
  speculative: number;
  words: number;
  supersededCount: number;
  latest: string;
};

// ── Theme hook (matches StrataColumn / ThreadsLoom / ResearchLoom) ───────────
function useTheme() {
  const [sepia, setSepia] = useState(false);
  useEffect(() => {
    const read = () =>
      setSepia(document.documentElement.getAttribute("data-theme") === "sepia");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return sepia;
}

function T(sepia: boolean) {
  return {
    rule:      sepia ? "rgba(139,105,20,0.18)"  : "rgba(255,255,255,0.07)",
    ruleSoft:  sepia ? "rgba(139,105,20,0.10)"  : "rgba(255,255,255,0.045)",
    text:      sepia ? "#1e1408"                : "#eae6f5",
    textHover: sepia ? "#000"                   : "#fff",
    body:      sepia ? "#3c2e18"                : "#8a849a",
    dim:       sepia ? "#8b7355"                : "#494456",
    log:       sepia ? "#3c2e18"                : "#c8c0d8",
    deepFill:  sepia ? "#cbbfa6"                : "#4a4152",
    hatch:     sepia ? "rgba(60,46,24,0.22)"    : "rgba(255,255,255,0.16)",
    accent:    sepia ? "#a8552f"                : "#c9836a",
    chipBg:    sepia ? "rgba(139,105,20,0.05)"  : "rgba(255,255,255,0.022)",
    fieldBg:   sepia ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.028)",
    stickyBg:  sepia ? "rgba(240,234,216,0.93)" : "rgba(8,7,14,0.93)",
  };
}

const DOMAIN_CONFIG = [
  { key: "eastern-spirituality", short: "EAST", name: "Eastern Spirituality", color: "#dc2626" },
  { key: "history",              short: "HIST", name: "History",              color: "#e6c068" },
  { key: "cross-domain",         short: "XDOM", name: "Cross-Domain",         color: "#38bdf8" },
  { key: "psychology",           short: "PSYC", name: "Psychology",           color: "#f59e0b" },
  { key: "behavioral-mechanics", short: "MECH", name: "Behavioral Mechanics", color: "#a78bfa" },
  { key: "creative-practice",    short: "CRTV", name: "Creative Practice",    color: "#14b8a6" },
  { key: "african-spirituality", short: "AFRC", name: "African Spirituality", color: "#34d399" },
  { key: "business",             short: "BSNS", name: "Business",             color: "#e879a0" },
];

const FALLBACK = "#c9836a";
const domCfg   = (d: string) => DOMAIN_CONFIG.find((x) => x.key === d);
const domColor = (d: string) => domCfg(d)?.color ?? FALLBACK;
const domShort = (d: string) => domCfg(d)?.short ?? "—";
const domName  = (d: string) => domCfg(d)?.name  ?? d;
const domRank  = (d: string) => {
  const i = DOMAIN_CONFIG.findIndex((x) => x.key === d);
  return i === -1 ? 99 : i;
};

const ROMAN = [
  "I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV",
  "XV","XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII","XXIV","XXV","XXVI",
];

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// A part's own name, once the shared "What X Took For Granted — " stem is off.
function partLabel(r: StrataReport) {
  const t = r.title.replace(/\s*[—–-]\s*Worldview Archaeology\s*$/i, "").trim();
  const cut = t.split(/\s+[—–]\s+/);
  const tail = cut.length > 1 ? cut.slice(1).join(" — ") : t;
  return tail.replace(/\*/g, "").trim();
}

export default function StrataSurvey({ families }: { families: Family[] }) {
  const sepia = useTheme();
  const t = T(sepia);
  const router = useRouter();

  const [open, setOpen] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showSuperseded, setShowSuperseded] = useState(true);

  // ── the re-drill: bump a key whenever the survey changes shape ─────────────
  const [drill, setDrill] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setDrill((n) => n + 1);
    setOpen(null);
  }, [domain, query, showSuperseded]);

  const domainsPresent = useMemo(() => {
    const counts = new Map<string, number>();
    families.forEach((f) => counts.set(f.domain, (counts.get(f.domain) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => domRank(a[0]) - domRank(b[0]));
  }, [families]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return families
      .map((f) => {
        const reports = showSuperseded
          ? f.reports
          : f.reports.filter((r) => r.kind !== "superseded");
        return { ...f, reports };
      })
      .filter((f) => f.reports.length > 0)
      .filter((f) => (domain ? f.domain === domain : true))
      .filter((f) => {
        if (!q) return true;
        return (
          f.label.toLowerCase().includes(q) ||
          (f.source_line ?? "").toLowerCase().includes(q) ||
          domName(f.domain).toLowerCase().includes(q) ||
          f.reports.some((r) => r.title.toLowerCase().includes(q))
        );
      });
  }, [families, domain, query, showSuperseded]);

  const bands = useMemo(() => {
    const by = new Map<string, Family[]>();
    visible.forEach((f) => {
      if (!by.has(f.domain)) by.set(f.domain, []);
      by.get(f.domain)!.push(f);
    });
    return [...by.entries()]
      .sort((a, b) => domRank(a[0]) - domRank(b[0]))
      .map(([key, fams]) => ({
        key,
        families: fams.sort((x, y) => y.layers - x.layers),
        cores: fams.length,
        files: fams.reduce((n, f) => n + f.reports.length, 0),
        layers: fams.reduce((n, f) => n + f.layers, 0),
      }));
  }, [visible]);

  const totals = useMemo(() => ({
    cores: visible.length,
    files: visible.reduce((n, f) => n + f.reports.length, 0),
    layers: visible.reduce((n, f) => n + f.layers, 0),
  }), [visible]);

  const filtering = domain !== null || query.trim() !== "" || !showSuperseded;

  // ── capped bores ───────────────────────────────────────────────────────────
  // Which bands are cut open. Default is the largest one; a filter opens every
  // band that survived it, since a filter that hides its own results is a trap.
  const [openBands, setOpenBands] = useState<Set<string>>(new Set());
  const bandSig = bands.map((b) => b.key).join("|");
  const searching = domain !== null || query.trim() !== "";

  useEffect(() => {
    if (searching) {
      setOpenBands(new Set(bands.map((b) => b.key)));
      return;
    }
    const largest = [...bands].sort((a, b) => b.cores - a.cores)[0];
    setOpenBands(new Set(largest ? [largest.key] : []));
    // bandSig stands in for `bands`, which is a fresh array on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandSig, searching]);

  const toggleBand = (key: string) =>
    setOpenBands((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allOpen = bands.length > 0 && bands.every((b) => openBands.has(b.key));
  const maxLayers = Math.max(1, ...visible.map((f) => f.layers));

  return (
    <>
      <style>{`
        ${DOMAIN_ICON_KEYFRAMES}

        /* ── the re-drill ── */
        @keyframes svDeposit {
          from { transform: scaleY(0); opacity: 0; }
          to   { transform: scaleY(1); opacity: var(--seg-op); }
        }
        @keyframes svBandIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes svCoreIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes svRowIn {
          from { opacity: 0; transform: translateX(-5px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes svSweep {
          0%   { transform: translateY(-100%); opacity: 0; }
          40%  { opacity: 0.5; }
          100% { transform: translateY(100%); opacity: 0; }
        }

        /* ── filter rack — sticky under the 80px nav so the controls stay in
              reach however deep the survey runs ── */
        .sv-rack {
          position: sticky; top: 80px; z-index: 20;
          display: flex; flex-wrap: wrap; gap: 9px; align-items: center;
          margin: 26px -14px 0; padding: 13px 14px 12px;
          background: var(--sv-sticky-bg);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--sv-rule);
        }
        .sv-rack-tally {
          margin-left: auto;
          font-family: var(--font-jetbrains), monospace;
          font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase;
          font-variant-numeric: tabular-nums; color: var(--sv-dim);
          white-space: nowrap;
        }
        .sv-rack-tally b { color: var(--sv-accent); font-weight: 400; }
        .sv-rack-lbl {
          font-family: var(--font-jetbrains), monospace;
          font-size: 9.5px; letter-spacing: 0.24em; text-transform: uppercase;
          color: var(--sv-dim); margin-right: 4px; white-space: nowrap;
        }
        .sv-chip {
          position: relative; display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 13px 7px 11px;
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
          font-variant-numeric: tabular-nums;
          color: var(--sv-dim); background: var(--sv-chip-bg);
          border: 1px solid var(--sv-rule); border-radius: 2px;
          cursor: pointer; overflow: hidden;
          transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
        }
        .sv-chip::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
          background: var(--cc, var(--sv-accent));
          transform: scaleY(0); transform-origin: center;
          transition: transform 260ms cubic-bezier(0.16,1,0.3,1);
        }
        .sv-chip:hover, .sv-chip:focus-visible {
          color: var(--sv-text); border-color: color-mix(in srgb, var(--cc, var(--sv-accent)) 45%, transparent);
          outline: none;
        }
        .sv-chip:hover::before, .sv-chip:focus-visible::before { transform: scaleY(1); }
        .sv-chip.on {
          color: var(--sv-text);
          border-color: color-mix(in srgb, var(--cc, var(--sv-accent)) 60%, transparent);
          background: color-mix(in srgb, var(--cc, var(--sv-accent)) 9%, transparent);
        }
        .sv-chip.on::before { transform: scaleY(1); }
        .sv-chip:active { transform: translateY(1px); }
        .sv-dot { width: 7px; height: 7px; border-radius: 1px; background: var(--cc, var(--sv-accent)); opacity: 0.85; flex: 0 0 auto; }
        .sv-n { opacity: 0.55; }

        .sv-field {
          flex: 1 1 190px; min-width: 150px; max-width: 300px;
          display: flex; align-items: center; gap: 9px;
          padding: 7px 12px;
          background: var(--sv-field-bg);
          border: 1px solid var(--sv-rule); border-radius: 2px;
          transition: border-color 200ms ease;
        }
        .sv-field:focus-within { border-color: color-mix(in srgb, var(--sv-accent) 55%, transparent); }
        .sv-field input {
          flex: 1; min-width: 0; background: none; border: 0; outline: none;
          font-family: var(--font-jetbrains), monospace;
          font-size: 11px; letter-spacing: 0.06em; color: var(--sv-text);
        }
        .sv-field input::placeholder { color: var(--sv-dim); letter-spacing: 0.14em; text-transform: uppercase; font-size: 9.5px; }
        .sv-clear {
          background: none; border: 0; padding: 0; cursor: pointer; line-height: 1;
          font-family: var(--font-jetbrains), monospace; font-size: 12px;
          color: var(--sv-dim); transition: color 180ms ease;
        }
        .sv-clear:hover, .sv-clear:focus-visible { color: var(--sv-accent); outline: none; }

        /* ── domain band ── */
        .sv-band { margin-top: 30px; animation: svBandIn 460ms cubic-bezier(0.16,1,0.3,1) both; }
        .sv-band-head {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 6px 12px 0;
          border-bottom: 1px solid color-mix(in srgb, var(--bc) 26%, transparent);
          position: relative; cursor: pointer;
          transition: background 200ms ease;
        }
        .sv-band-head::after {
          content: ''; position: absolute; left: 0; bottom: -1px; height: 1px; width: 64px;
          background: var(--bc); opacity: 0.85;
        }
        .sv-band-head:hover { background: color-mix(in srgb, var(--bc) 6%, transparent); }
        .sv-band-head:focus-visible {
          outline: 1px solid color-mix(in srgb, var(--bc) 55%, transparent);
          outline-offset: 3px;
        }

        /* the cap: a cross that loses its upright when the bore is opened */
        .sv-band-mark { position: relative; width: 11px; height: 11px; flex: 0 0 auto; }
        .sv-band-mark::before, .sv-band-mark::after {
          content: ''; position: absolute; background: var(--bc); border-radius: 1px;
          transition: transform 280ms cubic-bezier(0.16,1,0.3,1);
        }
        .sv-band-mark::before { left: 0; right: 0; top: 5px; height: 1px; }
        .sv-band-mark::after  { top: 0; bottom: 0; left: 5px; width: 1px; }
        .sv-band.open .sv-band-mark::after { transform: scaleY(0); }

        .sv-band-sigil {
          position: relative; width: 28px; height: 28px; flex: 0 0 auto;
          display: grid; place-items: center;
        }

        /* ── seam profile: what a capped band still shows ──
           Deliberately unanimated. The cores carry the motion; this is a gauge,
           and a gauge that depends on an animation finishing is a gauge that can
           read empty. */
        .sv-seam {
          display: flex; align-items: flex-end; gap: 3px;
          min-height: 24px; padding: 14px 0 2px 23px; cursor: pointer;
        }
        .sv-seam i {
          display: block; width: 6px; border-radius: 1px; background: var(--bc);
          opacity: 0.34; transition: opacity 200ms ease;
        }
        .sv-seam:hover i { opacity: 0.62; }
        .sv-band-name {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic; font-weight: 300; font-size: clamp(19px, 2.2vw, 24px);
          letter-spacing: -0.01em; color: var(--bc); margin: 0; line-height: 1;
        }
        .sv-band-meta {
          margin-left: auto; display: flex; gap: 16px; flex-wrap: wrap;
          font-family: var(--font-jetbrains), monospace;
          font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase;
          font-variant-numeric: tabular-nums; color: var(--sv-dim);
        }

        /* ── the rack: cores across, not down ── */
        .sv-rack-grid {
          display: grid; gap: 1px; margin-top: 22px;
          grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
          background: var(--sv-rule-soft);
          border: 1px solid var(--sv-rule-soft);
        }
        .sv-core {
          position: relative; display: grid; grid-template-columns: 30px 1fr;
          gap: 13px; align-items: start;
          padding: 15px 14px 14px 12px; text-align: left;
          background: var(--sv-bg-core); border: 0; font: inherit; color: inherit;
          cursor: pointer; overflow: hidden;
          animation: svCoreIn 420ms cubic-bezier(0.16,1,0.3,1) both;
          transition: background 240ms cubic-bezier(0.16,1,0.3,1);
        }
        .sv-core::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
          background: var(--cc); transform: scaleY(0); transform-origin: top;
          transition: transform 320ms cubic-bezier(0.16,1,0.3,1);
        }
        .sv-core:hover, .sv-core:focus-visible {
          background: color-mix(in srgb, var(--cc) 6%, var(--sv-bg-core));
          outline: none;
        }
        .sv-core:hover::before, .sv-core:focus-visible::before, .sv-core.on::before { transform: scaleY(1); }
        .sv-core.on { background: color-mix(in srgb, var(--cc) 9%, var(--sv-bg-core)); }

        /* the drill column — a fixed bore, so a 9-log core and a 4-log core
           read as the same instrument at different resolutions */
        .sv-col {
          display: flex; flex-direction: column; gap: 1px;
          padding: 0 7px; height: 86px;
          border-left: 1px solid var(--sv-rule-soft);
          border-right: 1px solid var(--sv-rule-soft);
        }
        .sv-col::before, .sv-col::after {
          content: ''; display: block; height: 1px; flex: 0 0 1px;
          background: var(--cc); opacity: 0.5;
        }
        .sv-seg {
          flex: 1 1 0; min-height: 1px; border-radius: 1px;
          transform-origin: top;
          animation: svDeposit 560ms cubic-bezier(0.16,1,0.3,1) both;
          transition: opacity 240ms ease;
        }
        .sv-core:hover .sv-seg { opacity: 1; }
        .sv-seg.deep {
          background-image: repeating-linear-gradient(135deg, transparent 0 2px, var(--sv-hatch) 2px 4px);
        }

        .sv-num {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic; font-weight: 400; font-size: 13px; line-height: 1;
          color: var(--cc); opacity: 0.5; margin-bottom: 7px;
          transition: opacity 240ms ease;
        }
        .sv-core:hover .sv-num { opacity: 1; }

        .sv-title {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic; font-weight: 300;
          font-size: 16.5px; line-height: 1.2; letter-spacing: -0.01em;
          color: var(--sv-text); margin: 0 0 5px; text-wrap: balance;
          transition: color 240ms ease;
        }
        .sv-core:hover .sv-title { color: var(--sv-text-hover); }
        .sv-src {
          font-family: var(--font-newsreader), Georgia, serif;
          font-size: 12px; font-style: italic; line-height: 1.45;
          color: var(--sv-body); margin: 0 0 10px; text-wrap: pretty;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sv-meta {
          display: flex; flex-wrap: wrap; gap: 9px; align-items: center;
          font-family: var(--font-jetbrains), monospace;
          font-size: 9.5px; letter-spacing: 0.13em;
          font-variant-numeric: tabular-nums; color: var(--sv-dim);
          margin-top: 2px;
        }
        .sv-meta .sv-k { color: var(--cc); letter-spacing: 0.19em; }
        .sv-flag {
          padding: 2px 6px; border: 1px solid var(--sv-rule);
          border-radius: 2px; letter-spacing: 0.16em; opacity: 0.8;
        }

        /* parts log */
        .sv-parts {
          grid-column: 1 / -1; margin-top: 18px; padding-top: 15px;
          border-top: 1px dashed var(--sv-rule); display: grid; gap: 2px;
        }
        .sv-part {
          display: grid; grid-template-columns: 26px 1fr auto; gap: 11px;
          align-items: baseline; padding: 6px 8px 6px 4px;
          border-radius: 2px; background: none; border: 0; text-align: left;
          font: inherit; color: inherit; cursor: pointer; width: 100%;
          animation: svRowIn 300ms cubic-bezier(0.16,1,0.3,1) both;
          transition: background 180ms ease, padding-left 180ms ease;
        }
        .sv-part:hover, .sv-part:focus-visible {
          background: color-mix(in srgb, var(--cc) 10%, transparent);
          padding-left: 9px; outline: none;
        }
        .sv-part-i {
          font-family: var(--font-jetbrains), monospace; font-size: 9px;
          letter-spacing: 0.1em; font-variant-numeric: tabular-nums; color: var(--sv-dim);
        }
        .sv-part-t {
          font-family: var(--font-newsreader), Georgia, serif;
          font-size: 14px; line-height: 1.4; color: var(--sv-log); min-width: 0;
        }
        .sv-part:hover .sv-part-t { color: var(--sv-text-hover); }
        .sv-part-n {
          font-family: var(--font-jetbrains), monospace; font-size: 9px;
          letter-spacing: 0.13em; font-variant-numeric: tabular-nums;
          color: var(--cc); opacity: 0.7; white-space: nowrap;
        }
        .sv-part.sup .sv-part-t { opacity: 0.5; text-decoration: line-through; text-decoration-thickness: 1px; }

        .sv-empty {
          font-family: var(--font-jetbrains), monospace; font-size: 11px;
          letter-spacing: 0.1em; color: var(--sv-dim);
          padding: 56px 0; text-align: center; line-height: 1.9;
        }
        .sv-reset {
          display: inline-block; margin-top: 14px; background: none; border: 0;
          padding: 0 0 3px; cursor: pointer;
          font-family: var(--font-jetbrains), monospace; font-size: 10px;
          letter-spacing: 0.18em; text-transform: uppercase; color: var(--sv-accent);
          border-bottom: 1px solid transparent; transition: border-color 200ms ease, letter-spacing 200ms ease;
        }
        .sv-reset:hover, .sv-reset:focus-visible { border-bottom-color: var(--sv-accent); letter-spacing: 0.22em; outline: none; }

        @media (max-width: 720px) {
          /* The rack wraps to four rows on a phone. Pinned, it would eat a
             quarter of the viewport under an 80px nav — so it rides along. */
          .sv-rack {
            position: static; margin: 20px 0 0; padding: 12px 0 12px;
            backdrop-filter: none; -webkit-backdrop-filter: none; background: none;
          }
          .sv-rack-tally { margin-left: 0; width: 100%; padding-top: 2px; }
          .sv-rack-grid { grid-template-columns: 1fr; }
          .sv-band { margin-top: 34px; }
          .sv-band-meta { margin-left: 0; width: 100%; gap: 12px; }
          .sv-band-head { flex-wrap: wrap; gap: 10px; }
          .sv-core { grid-template-columns: 28px 1fr; gap: 12px; padding: 18px 14px 16px 12px; }
          .sv-title { font-size: 17.5px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sv-seg, .sv-band, .sv-core, .sv-part {
            animation: none !important; opacity: var(--seg-op, 1) !important; transform: none !important;
          }
          .sv-seam i { animation: none !important; opacity: 0.34 !important; transform: none !important; }
          .sv-band-mark::before, .sv-band-mark::after { transition: none !important; }
        }
      `}</style>

      <div
        style={{
          ["--sv-rule" as any]: t.rule,
          ["--sv-rule-soft" as any]: t.ruleSoft,
          ["--sv-text" as any]: t.text,
          ["--sv-text-hover" as any]: t.textHover,
          ["--sv-body" as any]: t.body,
          ["--sv-dim" as any]: t.dim,
          ["--sv-log" as any]: t.log,
          ["--sv-hatch" as any]: t.hatch,
          ["--sv-accent" as any]: t.accent,
          ["--sv-chip-bg" as any]: t.chipBg,
          ["--sv-field-bg" as any]: t.fieldBg,
          ["--sv-bg-core" as any]: sepia ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.014)",
          ["--sv-sticky-bg" as any]: t.stickyBg,
        }}
      >
        {/* ── filter rack ─────────────────────────────────────────────── */}
        <div className="sv-rack">
          <span className="sv-rack-lbl">Survey</span>

          <button
            type="button"
            className={`sv-chip${domain === null ? " on" : ""}`}
            style={{ ["--cc" as any]: t.accent }}
            aria-pressed={domain === null}
            onClick={() => setDomain(null)}
          >
            <span className="sv-dot" />
            All
            <span className="sv-n">{families.length}</span>
          </button>

          {domainsPresent.map(([key, n]) => (
            <button
              key={key}
              type="button"
              className={`sv-chip${domain === key ? " on" : ""}`}
              style={{ ["--cc" as any]: domColor(key) }}
              aria-pressed={domain === key}
              onClick={() => setDomain(domain === key ? null : key)}
              title={domName(key)}
            >
              <span className="sv-dot" />
              {domShort(key)}
              <span className="sv-n">{n}</span>
            </button>
          ))}

          <button
            type="button"
            className={`sv-chip${!showSuperseded ? " on" : ""}`}
            style={{ ["--cc" as any]: t.dim }}
            aria-pressed={!showSuperseded}
            onClick={() => setShowSuperseded((v) => !v)}
            title="Hide the whole-book reports that the by-chapter builds replaced"
          >
            {showSuperseded ? "Hide superseded" : "Superseded hidden"}
          </button>

          <div className="sv-field">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <circle cx="5" cy="5" r="3.6" stroke={t.dim} strokeWidth="1.2" />
              <line x1="7.8" y1="7.8" x2="11" y2="11" stroke={t.dim} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter cores"
              aria-label="Filter cores by name or source"
              spellCheck={false}
            />
            {query && (
              <button className="sv-clear" onClick={() => setQuery("")} aria-label="Clear filter">×</button>
            )}
          </div>

          {bands.length > 1 && (
            <button
              type="button"
              className="sv-chip"
              style={{ ["--cc" as any]: t.dim }}
              onClick={() =>
                setOpenBands(allOpen ? new Set() : new Set(bands.map((b) => b.key)))
              }
            >
              {allOpen ? "Cap all" : "Open all"}
            </button>
          )}

          <span className="sv-rack-tally">
            <b>{totals.cores}</b> {totals.cores === 1 ? "core" : "cores"} ·{" "}
            <b>{totals.files}</b> {totals.files === 1 ? "log" : "logs"} ·{" "}
            <b>{totals.layers}</b> layers{filtering ? " · filtered" : ""}
          </span>
        </div>

        {/* ── bands ───────────────────────────────────────────────────── */}
        {bands.length === 0 ? (
          <div className="sv-empty">
            Nothing in the survey matches that.
            <br />
            <button
              className="sv-reset"
              onClick={() => { setDomain(null); setQuery(""); setShowSuperseded(true); }}
            >
              Reset the survey
            </button>
          </div>
        ) : (
          bands.map((band, bi) => {
            const color = domColor(band.key);
            const bandOpen = openBands.has(band.key);
            return (
              <section
                key={`${drill}-${band.key}`}
                className={`sv-band${bandOpen ? " open" : ""}`}
                style={{
                  ["--bc" as any]: color,
                  animationDelay: `${bi * 70}ms`,
                }}
              >
                <header
                  className="sv-band-head"
                  role="button"
                  tabIndex={0}
                  aria-expanded={bandOpen}
                  aria-controls={`sv-band-${band.key}`}
                  onClick={() => toggleBand(band.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleBand(band.key);
                    }
                  }}
                >
                  <span className="sv-band-mark" aria-hidden />
                  <span className="sv-band-sigil">
                    <DomainIcon domainKey={band.key} color={color} style={{ width: 24, height: 24 }} />
                  </span>
                  <h2 className="sv-band-name">{domName(band.key)}</h2>
                  <div className="sv-band-meta">
                    <span>{band.cores} {band.cores === 1 ? "core" : "cores"}</span>
                    <span>{band.files} {band.files === 1 ? "log" : "logs"}</span>
                    <span>{band.layers} layers</span>
                  </div>
                </header>

                {/* capped: the seam still shows its profile — one tick per core */}
                {!bandOpen && (
                  <div
                    className="sv-seam"
                    onClick={() => toggleBand(band.key)}
                    title={`Open ${domName(band.key)}`}
                  >
                    {band.families.map((f) => (
                      <i
                        key={f.key}
                        style={{ height: `${Math.max(4, Math.round((f.layers / maxLayers) * 24))}px` }}
                        title={`${f.label} — ${f.layers} layers`}
                      />
                    ))}
                  </div>
                )}

                {bandOpen && (
                <div className="sv-rack-grid" id={`sv-band-${band.key}`}>
                  {band.families.map((f, fi) => {
                    const isOpen = open === f.key;
                    const segs = f.reports.flatMap((r) => r.strata);
                    const shown = segs.length > 46
                      ? segs.filter((_, i) => i % Math.ceil(segs.length / 46) === 0)
                      : segs;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        aria-expanded={isOpen}
                        className={`sv-core${isOpen ? " on" : ""}`}
                        style={{
                          ["--cc" as any]: color,
                          animationDelay: `${bi * 70 + fi * 45}ms`,
                        }}
                        onClick={() => setOpen(isOpen ? null : f.key)}
                      >
                        <div>
                          <div className="sv-num">{ROMAN[fi] ?? fi + 1}</div>
                          <div className="sv-col" aria-hidden>
                            {shown.map((s, j) => (
                              <span
                                key={j}
                                className={`sv-seg${s.deep ? " deep" : ""}`}
                                style={{
                                  background: s.deep ? t.deepFill : color,
                                  ["--seg-op" as any]: s.deep ? 0.42 : 0.6,
                                  animationDelay: `${bi * 70 + fi * 45 + Math.min(j * 22, 520)}ms`,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                          <h3 className="sv-title">{f.label}</h3>
                          {f.source_line && <p className="sv-src">{f.source_line}</p>}
                          <div className="sv-meta">
                            <span className="sv-k">{domShort(f.domain)}</span>
                            <span>{f.reports.length} {f.reports.length === 1 ? "log" : "logs"}</span>
                            <span>{f.sourced} sourced</span>
                            <span>{f.speculative} spec</span>
                            {f.words ? <span>{Math.round(f.words / 1000)}k words</span> : null}
                            {f.supersededCount > 0 && showSuperseded && (
                              <span className="sv-flag">superseded ×{f.supersededCount}</span>
                            )}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="sv-parts">
                            {f.reports.map((r, j) => (
                              <span
                                key={r.id}
                                role="link"
                                tabIndex={0}
                                className={`sv-part${r.kind === "superseded" ? " sup" : ""}`}
                                style={{ animationDelay: `${Math.min(j * 34, 400)}ms` }}
                                onClick={(e) => { e.stopPropagation(); router.push(`/strata/${r.id}`); }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault(); e.stopPropagation();
                                    router.push(`/strata/${r.id}`);
                                  }
                                }}
                              >
                                <span className="sv-part-i">{String(j + 1).padStart(2, "0")}</span>
                                <span className="sv-part-t">{partLabel(r)}</span>
                                <span className="sv-part-n">{r.strata.length}L ↗</span>
                              </span>
                            ))}
                            {f.latest && (
                              <div style={{
                                fontFamily: "var(--font-jetbrains), monospace",
                                fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase",
                                color: t.dim, marginTop: "10px", paddingLeft: "4px",
                              }}>
                                last cut {fmtDate(f.latest)}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
