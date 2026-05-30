"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Domain config — mirrors vault domain keys ──────────────────────────────
const DOMAIN_CONFIG = [
  { key: "eastern-spirituality", short: "east-spirit", color: "#dc2626", name: "Eastern Spirituality" },
  { key: "history",              short: "history",      color: "#e6c068", name: "History"             },
  { key: "cross-domain",         short: "cross-domain", color: "#38bdf8", name: "Cross-Domain"        },
  { key: "psychology",           short: "psychology",   color: "#f59e0b", name: "Psychology"          },
  { key: "behavioral-mechanics", short: "beh-mech",     color: "#a78bfa", name: "Behavioral"          },
  { key: "creative-practice",    short: "creative",     color: "#14b8a6", name: "Creative Practice"   },
  { key: "african-spirituality", short: "african",      color: "#34d399", name: "African Spirituality"},
  { key: "business",             short: "business",     color: "#e879a0", name: "Business"            },
];

// ── Anti-bloat constant ────────────────────────────────────────────────────
// The Loom shows at most this many columns. As the corpus grows, older reports
// fall off the grid but remain in the searchable list below. Keep the grid
// readable — don't raise this above 16.
const LOOM_WINDOW = 12;

// ── SVG layout ────────────────────────────────────────────────────────────
const LW = 148; // domain label column width
const RH = 90;  // report header row height
const CW = 70;  // cell width per report column
const CH = 44;  // cell height per domain row

// ── Types ──────────────────────────────────────────────────────────────────
type ResearchNode = {
  id: string;
  title: string;
  domain: string;
  research_domains?: Record<string, number>;
  created: string;
  word_count?: number;
  excerpt?: string;
  status: string;
};

interface Tooltip {
  x: number;
  y: number;
  domainColor: string;
  domainName: string;
  reportTitle: string;
  score: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getDomainScores(r: ResearchNode): Record<string, number> {
  if (r.research_domains && Object.keys(r.research_domains).length > 0) {
    return r.research_domains;
  }
  return r.domain && r.domain !== "unknown" ? { [r.domain]: 5 } : {};
}

// Only render rows for domains that at least one report touches.
function usedDomains(reports: ResearchNode[]) {
  return DOMAIN_CONFIG.filter((d) =>
    reports.some((r) => (getDomainScores(r)[d.key] || 0) > 0)
  );
}

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function readMins(wc?: number) {
  return wc ? Math.max(1, Math.round(wc / 220)) : null;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ResearchLoom({ reports }: { reports: ResearchNode[] }) {
  const router = useRouter();
  const [filterRow, setFilterRow] = useState(-1);
  const [filterCol, setFilterCol] = useState(-1);
  const [hovered,   setHovered]   = useState<string | null>(null);
  const [tooltip,   setTooltip]   = useState<Tooltip | null>(null);

  const loomReports = reports.slice(0, LOOM_WINDOW);
  const domains     = usedDomains(reports);
  const NR = loomReports.length;
  const ND = domains.length;

  const SVG_W = LW + NR * CW;
  const SVG_H = RH + ND * CH + 14;

  const rowOp = (di: number) => filterRow === -1 ? 1 : filterRow === di ? 1 : 0.12;

  function toggleRow(di: number) {
    setFilterRow((fr) => fr === di ? -1 : di);
    setFilterCol(-1);
  }
  function toggleCol(ri: number) {
    setFilterCol((fc) => fc === ri ? -1 : ri);
    setFilterRow(-1);
  }
  function reset() { setFilterRow(-1); setFilterCol(-1); }

  // The list below mirrors the domain filter from the Loom
  const listDomainKey = filterRow !== -1 ? domains[filterRow]?.key : null;
  const filteredList  = listDomainKey
    ? reports.filter((r) => (getDomainScores(r)[listDomainKey] || 0) > 0)
    : reports;

  if (reports.length === 0) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: "#494456", letterSpacing: "0.1em" }}>
        no research reports yet — run a VRC session and save output to The Platform/Research
      </div>
    );
  }

  return (
    <>
      {/* ── Loom SVG ────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", background: "#15131c", padding: "24px 24px 16px" }}>
        <svg
          width={SVG_W} height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ display: "block", overflow: "visible" }}
          onClick={reset}
        >
          {/* Warp lines — horizontal domain threads */}
          {domains.map((d, di) => (
            <line key={`warp-${di}`}
              x1={LW} y1={RH + di * CH + CH / 2}
              x2={SVG_W} y2={RH + di * CH + CH / 2}
              stroke={d.color} strokeWidth={0.8}
              opacity={rowOp(di) * 0.25}
            />
          ))}

          {/* Column separators — between each report */}
          {Array.from({ length: NR + 1 }, (_, ri) => (
            <line key={`csep-${ri}`}
              x1={LW + ri * CW} y1={RH}
              x2={LW + ri * CW} y2={RH + ND * CH}
              stroke="rgba(255,255,255,0.07)" strokeWidth={1}
            />
          ))}

          {/* Row separators — between each domain */}
          {Array.from({ length: ND + 1 }, (_, di) => (
            <line key={`rsep-${di}`}
              x1={LW} y1={RH + di * CH}
              x2={SVG_W} y2={RH + di * CH}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1}
            />
          ))}

          {/* Cell hover targets — invisible rects capturing mouse events */}
          {domains.map((d, di) =>
            loomReports.map((r, ri) => {
              const s = getDomainScores(r)[d.key] || 0;
              return (
                <rect key={`cell-${di}-${ri}`}
                  x={LW + ri * CW + 1} y={RH + di * CH + 1}
                  width={CW - 2} height={CH - 2}
                  fill="transparent" rx={1}
                  style={{ cursor: s > 0 ? (filterRow === di && filterCol === ri ? "pointer" : "crosshair") : "default" }}
                  onMouseEnter={(e) => {
                    if (s > 0) setTooltip({ x: e.clientX, y: e.clientY, domainColor: d.color, domainName: d.name, reportTitle: r.title, score: s });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onMouseMove={(e) => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!s) return;
                    const alreadyActive = filterRow === di && filterCol === ri;
                    if (alreadyActive) {
                      router.push(`/research/${r.id}`);
                    } else {
                      setFilterRow(di);
                      setFilterCol(ri);
                    }
                  }}
                />
              );
            })
          )}

          {/* Domain labels — left column, clickable */}
          {domains.map((d, di) => {
            const y       = RH + di * CH + CH / 2;
            const focused = filterRow === di;
            const op      = filterRow !== -1 ? (focused ? 1 : 0.18) : 0.72;
            return (
              <g key={`dlbl-${di}`} style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); toggleRow(di); }}>
                <rect x={LW - 12} y={y - 5} width={3} height={10} fill={d.color} rx={1} opacity={op} />
                <text x={LW - 18} y={y + 4} textAnchor="end"
                  fill={focused ? "#eae6f5" : d.color}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={10} letterSpacing="0.05em" opacity={op}>
                  {d.short}
                </text>
              </g>
            );
          })}

          {/* Report labels — top row, rotated 44°, clickable */}
          {loomReports.map((r, ri) => {
            const x       = LW + ri * CW + CW / 2;
            const focused = filterCol === ri;
            const op      = filterCol !== -1 ? (focused ? 1 : 0.15) : 1;
            const label   = r.title.length > 26 ? r.title.slice(0, 26) + "…" : r.title;
            return (
              <g key={`rlbl-${ri}`} transform={`translate(${x},${RH - 6})`}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); toggleCol(ri); }}>
                <text transform="rotate(-44)" textAnchor="start"
                  fill={focused ? "#eae6f5" : "#8a849a"}
                  fontFamily="Newsreader, serif"
                  fontSize={11} fontStyle="italic" opacity={op}>
                  {label}
                </text>
              </g>
            );
          })}

          {/* Knots — Filter variant */}
          {domains.map((d, di) =>
            loomReports.map((r, ri) => {
              const s = getDomainScores(r)[d.key] || 0;
              if (!s) return null;
              const cx        = LW + ri * CW + CW / 2;
              const cy        = RH + di * CH + CH / 2;
              const rowFade   = filterRow !== -1 && filterRow !== di;
              const colFade   = filterCol !== -1 && filterCol !== ri;
              const intersect = filterRow === di && filterCol === ri && filterRow !== -1;
              const op        = rowFade || colFade ? 0.06 : intersect ? 1 : 0.75;
              const rad       = intersect ? 11 : 7;
              return (
                <g key={`knot-${di}-${ri}`} style={{ pointerEvents: "none" }}>
                  {intersect && (
                    <>
                      <circle cx={cx} cy={cy} r={18} fill="none" stroke={d.color} strokeWidth={0.8} opacity={0.25} />
                      <circle cx={cx} cy={cy} r={13} fill="none" stroke={d.color} strokeWidth={0.5} opacity={0.4} />
                    </>
                  )}
                  <circle cx={cx} cy={cy} r={rad} fill={d.color} opacity={op} />
                </g>
              );
            })
          )}

          {/* Column index labels at bottom */}
          {loomReports.map((_, ri) => (
            <text key={`idx-${ri}`}
              x={LW + ri * CW + CW / 2} y={RH + ND * CH + 12}
              textAnchor="middle"
              fill={filterCol === ri ? "#8a849a" : "#2a2535"}
              fontFamily="JetBrains Mono, monospace"
              fontSize={8} letterSpacing="0.08em">
              {String(ri + 1).padStart(2, "0")}
            </text>
          ))}

          {/* Interaction hint — shown when nothing is filtered */}
          {filterRow === -1 && filterCol === -1 && NR > 0 && (
            <text x={LW + (NR * CW) / 2} y={RH + ND * CH + 12}
              textAnchor="middle" fill="#2a2535"
              fontFamily="JetBrains Mono, monospace"
              fontSize={8} letterSpacing="0.12em">
              CLICK A DOMAIN OR REPORT TO ISOLATE
            </text>
          )}
        </svg>
      </div>

      {/* ── Domain legend / filter chips ──────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", marginBottom: "16px", maxWidth: "820px" }}>
        {domains.map((d, di) => {
          const isActive = filterRow === di;
          return (
            <button key={d.key}
              onClick={() => toggleRow(di)}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                background: "transparent", border: "none", cursor: "pointer", padding: 0,
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase",
                color: isActive ? "#eae6f5" : d.color,
                opacity: filterRow !== -1 && !isActive ? 0.3 : 1,
                transition: "opacity 0.15s, color 0.15s",
              }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
              {d.short}
            </button>
          );
        })}
        {filterRow !== -1 && (
          <button onClick={reset}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-jetbrains), monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#494456" }}>
            × clear
          </button>
        )}
      </div>

      {/* Loom window note — only appears once corpus exceeds LOOM_WINDOW */}
      {reports.length > LOOM_WINDOW && (
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#494456", letterSpacing: "0.06em", marginBottom: "24px" }}>
          loom shows {LOOM_WINDOW} most recent — {reports.length - LOOM_WINDOW} older {reports.length - LOOM_WINDOW === 1 ? "report" : "reports"} in the archive below
        </p>
      )}

      {/* ── Ornament ──────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "56px 0 40px" }}>
        <div style={{ flex: 1, height: "1px", background: "#1c1828" }} />
        <span style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "18px", color: "#e8b86a", opacity: 0.5, fontStyle: "italic" }}>✦</span>
        <div style={{ flex: 1, height: "1px", background: "#1c1828" }} />
      </div>

      {/* ── Report list ───────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid #1c1828" }}>
        <span style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "20px", fontStyle: "italic", color: "#eae6f5" }}>
          {listDomainKey
            ? `${domains.find((d) => d.key === listDomainKey)?.name ?? listDomainKey} Research`
            : "All Research"}
        </span>
        <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "9px", color: "#494456", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {filteredList.length} {filteredList.length === 1 ? "report" : "reports"}
        </span>
      </div>

      {filteredList.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: "#494456", letterSpacing: "0.08em" }}>
          no reports in this domain yet
        </div>
      ) : (
        filteredList.map((r) => {
          const scores     = getDomainScores(r);
          const domainTags = DOMAIN_CONFIG.filter((d) => (scores[d.key] || 0) > 0);
          const mins       = readMins(r.word_count);
          const isHovered  = hovered === r.id;
          const globalIdx  = reports.indexOf(r) + 1;
          return (
            <Link key={r.id} href={`/research/${r.id}`}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex", alignItems: "flex-start", gap: "16px",
                padding: `16px 0 16px ${isHovered ? "6px" : "0"}`,
                borderBottom: "1px solid #1c1828",
                textDecoration: "none",
                transition: "padding-left 0.15s",
              }}>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "9px", color: "#494456", paddingTop: "4px", width: "28px", flexShrink: 0, letterSpacing: "0.06em" }}>
                {String(globalIdx).padStart(2, "0")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: "16px", fontStyle: "italic", color: isHovered ? "#c4bcd8" : "#9890b0", marginBottom: "8px", lineHeight: 1.4, transition: "color 0.15s" }}>
                  {r.title}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {domainTags.map((d) => (
                    <span key={d.key} style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "2px 7px", borderRadius: "2px",
                      color: d.color, background: `${d.color}18`, border: `0.5px solid ${d.color}30`,
                    }}>
                      {d.short}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#494456", paddingTop: "4px", flexShrink: 0, textAlign: "right" }}>
                {fmtDate(r.created)}
                {mins && <><br /><span style={{ color: "#2a2535" }}>{mins} min</span></>}
              </div>
            </Link>
          );
        })
      )}

      {/* ── Tooltip ───────────────────────────────────────────── */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: Math.min(tooltip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1400) - 250) + "px",
          top:  tooltip.y + 14 + "px",
          background: "#1c1a26",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "4px",
          padding: "8px 12px",
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: "10px", color: "#eae6f5",
          pointerEvents: "none", zIndex: 200,
          maxWidth: "220px", lineHeight: 1.6,
        }}>
          <div style={{ color: tooltip.domainColor, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
            {tooltip.domainName}
          </div>
          <div style={{ color: "#ccc4dc", fontFamily: "var(--font-newsreader), serif", fontStyle: "italic", marginBottom: "5px", fontSize: "11px" }}>
            {tooltip.reportTitle.length > 60 ? tooltip.reportTitle.slice(0, 60) + "…" : tooltip.reportTitle}
          </div>
          <div>
            depth: <span style={{ color: "#e8b86a" }}>{tooltip.score}/5</span>
            {" — "}
            {(["—", "light touch", "moderate", "strong", "deep", "primary"] as const)[tooltip.score]}
            {filterRow !== -1 && filterCol !== -1 && (
              <div style={{ marginTop: "6px", color: "#494456", fontSize: "9px", letterSpacing: "0.1em" }}>
                click again to open →
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
