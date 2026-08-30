"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DomainIcon, DOMAIN_ICON_KEYFRAMES } from "@/components/DomainIcon";

// ─── The Strata ──────────────────────────────────────────────────────────────
// Worldview archaeology reports as core samples, not cards.
//
// Direction: industrial / utilitarian — a field log. Where The Loom orbits and
// The Corpus stacks cards, this measures. Depth gutter on the left in Roman,
// then a sediment column: one layer per section, deposited top-down. Solid
// layers are sourced to the text; hatched layers sit below the line, where the
// reading turns speculative on purpose.
//
// Signature motion: the layers deposit on load — each segment grows from its
// upper edge on a staggered delay, the way sediment settles. Nothing else on
// the site moves this way.

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
};

// ── Theme hook (matches ThreadsLoom / ResearchLoom) ──────────────────────────
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
    wash:      sepia ? "rgba(178,102,74,0.05)"  : "rgba(201,131,106,0.035)",
    washOpen:  sepia ? "rgba(178,102,74,0.075)" : "rgba(201,131,106,0.05)",
    accent:    sepia ? "#a8552f"                : "#c9836a",
  };
}

const DOMAIN_CONFIG = [
  { key: "eastern-spirituality", short: "EAST", color: "#dc2626" },
  { key: "history",              short: "HIST", color: "#e6c068" },
  { key: "cross-domain",         short: "XDOM", color: "#38bdf8" },
  { key: "psychology",           short: "PSYC", color: "#f59e0b" },
  { key: "behavioral-mechanics", short: "MECH", color: "#a78bfa" },
  { key: "creative-practice",    short: "CRTV", color: "#14b8a6" },
  { key: "african-spirituality", short: "AFRC", color: "#34d399" },
  { key: "business",             short: "BSNS", color: "#e879a0" },
];

const ROMAN = [
  "I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII",
  "XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII","XXIV",
];

const FALLBACK = "#c9836a";

const domColor = (d: string) => DOMAIN_CONFIG.find((x) => x.key === d)?.color ?? FALLBACK;
const domShort = (d: string) => DOMAIN_CONFIG.find((x) => x.key === d)?.short ?? "—";

// The section already says worldview archaeology; the suffix is noise here.
export function stripSuffix(title: string) {
  return title.replace(/\s*[—–-]\s*Worldview Archaeology\s*$/i, "").trim();
}

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function StrataColumn({ reports }: { reports: StrataReport[] }) {
  const sepia = useTheme();
  const t = T(sepia);
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);

  if (!reports.length) {
    return (
      <div style={{
        fontFamily: "var(--font-jetbrains), monospace",
        fontSize: "12px", color: t.dim, padding: "48px 0", letterSpacing: "0.08em",
      }}>
        No cores logged yet. Run worldview archaeology on a source to open this section.
      </div>
    );
  }

  return (
    <>
      <style>{`
        ${DOMAIN_ICON_KEYFRAMES}

        @keyframes strataDeposit {
          from { transform: scaleY(0); opacity: 0; }
          to   { transform: scaleY(1); opacity: var(--seg-op); }
        }
        @keyframes strataLogIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: none; }
        }

        .st-core {
          position: relative;
          display: grid;
          grid-template-columns: 70px 46px 1fr;
          width: 100%;
          text-align: left;
          background: transparent;
          border: 0;
          border-top: 1px solid var(--st-rule);
          font: inherit;
          color: inherit;
          cursor: pointer;
          transition: background 260ms cubic-bezier(0.16,1,0.3,1);
        }
        .st-core:last-of-type { border-bottom: 1px solid var(--st-rule); }
        .st-core:hover  { background: var(--st-wash); }
        .st-core.is-open { background: var(--st-wash-open); }
        .st-core:focus-visible {
          outline: none;
          background: var(--st-wash-open);
          box-shadow: inset 3px 0 0 var(--st-accent);
        }
        .st-core::before {
          content: '';
          position: absolute; left: 0; top: -1px; bottom: -1px; width: 2px;
          background: var(--core-color);
          transform: scaleY(0); transform-origin: top;
          transition: transform 320ms cubic-bezier(0.16,1,0.3,1);
        }
        .st-core:hover::before, .st-core.is-open::before { transform: scaleY(1); }

        /* ── depth gutter ── */
        .st-gutter {
          display: flex; flex-direction: column; gap: 6px;
          padding: 28px 0 28px 16px;
          border-right: 1px solid var(--st-rule-soft);
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px; letter-spacing: 0.14em;
          font-variant-numeric: tabular-nums;
          color: var(--st-dim);
          user-select: none;
        }
        .st-depth {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic; font-size: 19px; font-weight: 400;
          letter-spacing: 0; line-height: 1;
          color: var(--core-color); opacity: 0.55;
          transition: opacity 240ms ease;
        }
        .st-core:hover .st-depth { opacity: 1; }

        /* ── body ── */
        .st-body { padding: 26px clamp(16px, 3vw, 32px) 28px; min-width: 0; }
        .st-head { display: flex; align-items: flex-start; gap: 16px; }

        .st-title {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic; font-weight: 300;
          font-size: clamp(20px, 2.5vw, 27px);
          line-height: 1.22; letter-spacing: -0.012em;
          color: var(--st-text); margin: 0 0 8px;
          text-wrap: balance;
          transition: color 240ms ease;
        }
        .st-core:hover .st-title { color: var(--st-text-hover); }

        .st-source {
          font-family: var(--font-newsreader), Georgia, serif;
          font-size: 14.5px; font-style: italic; line-height: 1.55;
          color: var(--st-body); margin: 0 0 20px; max-width: 62ch;
          text-wrap: pretty;
        }

        /* ── the core: a narrow drill column, not a bar chart ── */
        .st-column {
          display: flex; flex-direction: column; gap: 1px;
          margin: 26px 0 26px; padding: 0 11px;
          min-height: 104px;
          border-left: 1px solid var(--st-rule-soft);
          border-right: 1px solid var(--st-rule-soft);
        }
        .st-seg {
          flex: 1 1 0; min-height: 3px; border-radius: 1px;
          transform-origin: top;
          animation: strataDeposit 520ms cubic-bezier(0.16,1,0.3,1) both;
          transition: opacity 240ms ease;
        }
        .st-core:hover .st-seg { opacity: 1; }
        .st-seg.deep {
          background-image: repeating-linear-gradient(
            135deg, transparent 0 2px, var(--st-hatch) 2px 4px
          );
        }
        /* cap + shoe, so the column reads as a extracted core */
        .st-column::before, .st-column::after {
          content: ''; display: block; height: 1px; flex: 0 0 1px;
          background: var(--core-color); opacity: 0.5;
        }

        .st-meta {
          display: flex; flex-wrap: wrap; gap: 18px; align-items: center;
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px; letter-spacing: 0.12em;
          font-variant-numeric: tabular-nums;
          color: var(--st-dim);
        }
        .st-short {
          color: var(--core-color); letter-spacing: 0.2em; font-weight: 500;
        }

        /* ── log ── */
        .st-log {
          margin-top: 22px; padding-top: 20px;
          border-top: 1px dashed var(--st-rule);
          display: grid; gap: 10px;
        }
        .st-row {
          display: grid; grid-template-columns: 40px 1fr auto;
          gap: 14px; align-items: baseline;
          font-family: var(--font-newsreader), Georgia, serif;
          font-size: 15px; color: var(--st-log);
          animation: strataLogIn 320ms cubic-bezier(0.16,1,0.3,1) both;
        }
        .st-idx {
          font-family: var(--font-jetbrains), monospace;
          font-size: 9.5px; letter-spacing: 0.1em;
          font-variant-numeric: tabular-nums;
          color: var(--st-dim);
        }
        .st-tag {
          font-family: var(--font-jetbrains), monospace;
          font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--st-accent); opacity: 0.72; white-space: nowrap;
        }
        .st-open {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 24px;
          font-family: var(--font-jetbrains), monospace;
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--st-accent); background: none; border: 0;
          border-bottom: 1px solid transparent; padding: 0 0 4px; cursor: pointer;
          transition: border-color 200ms ease, letter-spacing 200ms ease;
        }
        .st-open:hover, .st-open:focus-visible {
          border-bottom-color: var(--st-accent); letter-spacing: 0.22em; outline: none;
        }
        .st-open:active { transform: translateY(1px); }

        @media (max-width: 640px) {
          .st-core   { grid-template-columns: 46px 30px 1fr; }
          .st-column { padding: 0 6px; margin: 22px 0; }
          .st-gutter { padding-left: 12px; font-size: 9px; }
          .st-depth  { font-size: 16px; }
          .st-head   { gap: 12px; }
          .st-row    { grid-template-columns: 30px 1fr; }
          .st-tag    { grid-column: 2; }
        }

        @media (prefers-reduced-motion: reduce) {
          .st-seg, .st-row { animation: none !important; opacity: var(--seg-op, 1) !important; transform: none !important; }
          .st-core::before { transition: none; }
        }
      `}</style>

      <div
        style={{
          marginTop: "48px",
          ["--st-rule" as any]: t.rule,
          ["--st-rule-soft" as any]: t.ruleSoft,
          ["--st-text" as any]: t.text,
          ["--st-text-hover" as any]: t.textHover,
          ["--st-body" as any]: t.body,
          ["--st-dim" as any]: t.dim,
          ["--st-log" as any]: t.log,
          ["--st-hatch" as any]: t.hatch,
          ["--st-wash" as any]: t.wash,
          ["--st-wash-open" as any]: t.washOpen,
          ["--st-accent" as any]: t.accent,
        }}
      >
        {reports.map((r, i) => {
          const color = domColor(r.domain);
          const isOpen = open === r.id;
          return (
            <button
              key={r.id}
              type="button"
              aria-expanded={isOpen}
              className={`st-core${isOpen ? " is-open" : ""}`}
              style={{ ["--core-color" as any]: color }}
              onClick={() => setOpen(isOpen ? null : r.id)}
            >
              <div className="st-gutter">
                <span className="st-depth">{ROMAN[i] ?? i + 1}</span>
                <span>{String(r.strata.length).padStart(2, "0")} L</span>
                <span style={{ opacity: 0.6 }}>{domShort(r.domain)}</span>
              </div>

              <div className="st-column" aria-hidden>
                {r.strata.map((s, j) => (
                  <div
                    key={j}
                    className={`st-seg${s.deep ? " deep" : ""}`}
                    style={{
                      background: s.deep ? t.deepFill : color,
                      ["--seg-op" as any]: s.deep ? 0.42 : 0.58,
                      animationDelay: `${Math.min(j * 34, 600)}ms`,
                    }}
                    title={s.label}
                  />
                ))}
              </div>

              <div className="st-body">
                <div className="st-head">
                  <div style={{ position: "relative", width: 26, height: 26, flexShrink: 0, marginTop: 4 }}>
                    <DomainIcon
                      domainKey={r.domain}
                      color={color}
                      style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                    />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h2 className="st-title">{stripSuffix(r.title)}</h2>
                    {r.source_line && <p className="st-source">{r.source_line}</p>}
                  </div>
                </div>

                <div className="st-meta">
                  <span className="st-short">{domShort(r.domain)}</span>
                  <span>{r.depth} sourced</span>
                  <span>{r.deepCount} speculative</span>
                  {r.word_count ? <span>{r.word_count.toLocaleString()} words</span> : null}
                  {r.created ? <span>{fmtDate(r.created)}</span> : null}
                </div>

                {isOpen && (
                  <>
                    <div className="st-log">
                      {r.strata.map((s, j) => (
                        <div
                          className="st-row"
                          key={j}
                          style={{ animationDelay: `${Math.min(j * 26, 400)}ms` }}
                        >
                          <span className="st-idx">{String(j + 1).padStart(2, "0")}</span>
                          <span style={{ opacity: s.deep ? 0.74 : 1 }}>{s.label}</span>
                          {s.deep && <span className="st-tag">speculative</span>}
                        </div>
                      ))}
                    </div>
                    <span
                      role="link"
                      tabIndex={0}
                      className="st-open"
                      onClick={(e) => { e.stopPropagation(); router.push(`/strata/${r.id}`); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault(); e.stopPropagation();
                          router.push(`/strata/${r.id}`);
                        }
                      }}
                    >
                      Open the core ↗
                    </span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
