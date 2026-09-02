"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DomainIcon, DOMAIN_ICON_KEYFRAMES } from "@/components/DomainIcon";

// ── Theme hook ────────────────────────────────────────────────────────────────
function useTheme() {
  const [sepia, setSepia] = useState(false);
  useEffect(() => {
    const read = () => setSepia(document.documentElement.getAttribute("data-theme") === "sepia");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return sepia;
}

// ── Theme token helper ────────────────────────────────────────────────────────
function T(sepia: boolean) {
  return {
    cardBg:     sepia ? "#faf6ed"              : "#110e1a",
    cardBorder: sepia ? "rgba(139,105,20,0.18)": "rgba(255,255,255,0.08)",
    text:       sepia ? "#1e1408"              : "#e8e0d0",
    textDim:    sepia ? "#8b7355"              : "#a09080",
    dim2:       sepia ? "#c0aa80"              : "#3a342a",
    gold:       sepia ? "#8b6914"              : "#c9a84c",
    hintColor:  sepia ? "#c0aa80"              : "#3a342a",
    filterBg:   sepia ? "#ede7d9"              : "transparent",
    filterBorder: sepia ? "rgba(139,105,20,0.25)" : "rgba(255,255,255,0.1)",
    filterText: sepia ? "#8b7355"              : "#494456",
    filterActive: sepia ? "rgba(139,105,20,0.12)" : "rgba(0,0,0,0)",
  };
}

// ── Domain config ─────────────────────────────────────────────────────────────
const DOMAIN_CONFIG = [
  { key: "eastern-spirituality", short: "EAST",  color: "#dc2626", name: "Eastern Spirituality" },
  { key: "history",              short: "HIST",  color: "#e6c068", name: "History"              },
  { key: "cross-domain",         short: "XDOM",  color: "#38bdf8", name: "Cross-Domain"         },
  { key: "psychology",           short: "PSYC",  color: "#f59e0b", name: "Psychology"           },
  { key: "behavioral-mechanics", short: "MECH",  color: "#a78bfa", name: "Behavioral Mechanics" },
  { key: "creative-practice",    short: "CRTV",  color: "#14b8a6", name: "Creative Practice"    },
  { key: "african-spirituality", short: "AFRC",  color: "#34d399", name: "African Spirituality" },
  { key: "business",             short: "BSNS",  color: "#e879a0", name: "Business"             },
  { key: "occult",               short: "OCLT",  color: "#d95ae8", name: "Occult"               },
];

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDomainColor(domain: string): string {
  return DOMAIN_CONFIG.find(d => d.key === domain)?.color ?? "#8a849a";
}
function getDomainName(domain: string): string {
  return DOMAIN_CONFIG.find(d => d.key === domain)?.name ?? domain;
}
function getDomainShort(domain: string): string {
  return DOMAIN_CONFIG.find(d => d.key === domain)?.short ?? "—";
}
function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function readMins(wc?: number) {
  return wc ? Math.max(1, Math.round(wc / 220)) : null;
}

// ── Spinning Orb ──────────────────────────────────────────────────────────────
// The domain sigil at each orb's center (gradient + glow + signature motion) is
// shared with /tones — see components/DomainIcon.tsx.
// All 5 satellites use the domain color; dots vary in opacity for depth.
function SpinningOrb({ color, domain }: { color: string; domain: string }) {
  const DOT_COUNT = 5;
  // stagger: full rotation = 4s, 360° / 5 = 72° = 0.8s per step
  return (
    <div className="cs-orb">
      {/* Outer glow ring */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: "50%",
        border: `1px solid ${color}`,
        opacity: 0.18,
      }} />

      {/* Central sigil — domain symbol, pulsing + animated */}
      <DomainIcon domainKey={domain} color={color}
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2 }} />

      {/* Orbiting satellites — domain color, varying opacity for depth */}
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          top: 0, left: "50%",
          width: 1,
          height: "50%",
          transformOrigin: "bottom center",
          animation: "corpusOrbit 4s linear infinite",
          animationDelay: `${-(i * 0.8).toFixed(2)}s`,
          willChange: "transform",
        }}>
          <div style={{
            position: "absolute",
            top: 0, left: "50%",
            transform: "translate(-50%, -50%)",
            width: 4, height: 4,
            borderRadius: "50%",
            background: color,
            // vary opacity so dots don't all look identical
            opacity: 0.5 + (i % 3) * 0.17,
            boxShadow: `0 0 5px ${color}99`,
          }} />
        </div>
      ))}
    </div>
  );
}

// ── Corner SVG ornament ───────────────────────────────────────────────────────
function CardBorder({ color }: { color: string }) {
  return (
    <svg
      style={{ position: "absolute", inset: 5, pointerEvents: "none" }}
      viewBox="0 0 180 324" fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* corners */}
      <path d="M1 22 L1 1 L22 1"    stroke={color} strokeOpacity="0.55" strokeWidth="1" />
      <path d="M158 1 L179 1 L179 22"    stroke={color} strokeOpacity="0.55" strokeWidth="1" />
      <path d="M1 302 L1 323 L22 323"   stroke={color} strokeOpacity="0.55" strokeWidth="1" />
      <path d="M158 323 L179 323 L179 302" stroke={color} strokeOpacity="0.55" strokeWidth="1" />
      {/* inner dashed rect */}
      <rect x="2" y="2" width="176" height="320"
        stroke={color} strokeOpacity="0.07" strokeWidth="0.5" strokeDasharray="3 6" />
    </svg>
  );
}

// ── Single card ───────────────────────────────────────────────────────────────
// state: 0 = front, 1 = back (excerpt), 2 = open overlay
function CorpusCard({ report, index }: { report: ResearchNode; index: number }) {
  const [cardState, setCardState] = useState(0);
  const router = useRouter();
  const sepia = useTheme();
  const th = T(sepia);
  const color = getDomainColor(report.domain);
  const mins = readMins(report.word_count);

  const rootRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // If they clicked the open-overlay link itself, let router handle it
    if ((e.target as HTMLElement).closest("[data-open-link]")) return;

    if (cardState === 0) {
      setCardState(1);            // (touch) tap flips to the excerpt
    } else if (cardState === 1) {
      setCardState(2);            // tap → open
    } else {
      router.push(`/research/${report.id}`); // tap again → go to the full report
    }
  }, [cardState, router, report.id]);

  // Desktop (hover-capable devices): hover flips to the excerpt, leaving flips back.
  const hoverCapable = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const handleEnter = useCallback(() => { if (hoverCapable()) setCardState((s) => (s === 0 ? 1 : s)); }, []);
  const handleLeave = useCallback(() => { if (hoverCapable()) setCardState(0); }, []);

  // Click anywhere outside a flipped card → flip it back to the front.
  useEffect(() => {
    if (cardState === 0) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setCardState(0);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [cardState]);

  const isFlipped = cardState >= 1;
  const isOpen    = cardState === 2;

  return (
    <div
      ref={rootRef}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        perspective: "1100px",
        aspectRatio: "5/7",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* 3D wrapper */}
      <div style={{
        width: "100%", height: "100%",
        position: "relative",
        transformStyle: "preserve-3d",
        transition: "transform 0.85s cubic-bezier(0.55, 0.08, 0.28, 1.0)",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>

        {/* ── FRONT ─────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          background: th.cardBg,
          border: `1px solid ${color}30`,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
          transition: "background 0.3s",
        }}>
          <CardBorder color={color} />

          <div style={{
            flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "16px 12px 12px", gap: 10, width: "100%",
          }}>
            <SpinningOrb color={color} domain={report.domain} />

            <div className="cs-ftitle" style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              fontWeight: 400, fontStyle: "italic",
              textAlign: "center", lineHeight: 1.25, color: th.text,
              display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
              overflow: "hidden", maxWidth: "100%",
            }}>
              {report.title}
            </div>

            <div className="cs-fdomain" style={{
              fontFamily: "var(--font-jetbrains), monospace",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color, opacity: 0.65, textAlign: "center",
            }}>
              {getDomainName(report.domain)}
            </div>
          </div>

          <div style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 9, letterSpacing: "0.1em", color: th.gold,
            opacity: 0.45, paddingBottom: 12,
          }}>
            {ROMAN[index] ?? index + 1}
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: th.cardBg,
          border: `1px solid ${color}30`,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          transition: "background 0.3s",
        }}>
          <CardBorder color={color} />

          {/* Content — blurs when overlay is active */}
          <div style={{
            flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
            padding: "13px 12px 9px", gap: 8,
            transition: "filter 0.3s, opacity 0.3s",
            filter: isOpen ? "blur(3px)" : "none",
            opacity: isOpen ? 0.2 : 1,
          }}>
            <div className="cs-bdomain" style={{
              fontFamily: "var(--font-jetbrains), monospace",
              letterSpacing: "0.25em", textTransform: "uppercase",
              color, opacity: 0.65, flexShrink: 0,
            }}>
              {getDomainShort(report.domain)}
            </div>

            <div className="cs-btitle" style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              fontStyle: "italic", fontWeight: 600,
              lineHeight: 1.2, color: th.text, flexShrink: 0,
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {report.title}
            </div>

            <div style={{ height: 1, background: color, opacity: 0.18, flexShrink: 0 }} />

            <div className="cs-bexcerpt" style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              fontWeight: 300, lineHeight: 1.5,
              color: th.textDim, flex: 1, minHeight: 0,
              overflow: "hidden",
              display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 8,
            }}>
              {report.excerpt ?? "No excerpt available."}
            </div>

            <div style={{
              display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0,
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 7, opacity: 0.35, letterSpacing: "0.06em",
              color: th.text,
            }}>
              {report.word_count && <span>{report.word_count.toLocaleString()} words</span>}
              {mins && <span>{mins} min read</span>}
              {report.created && <span>{fmtDate(report.created)}</span>}
            </div>
          </div>

          {/* Tap-again hint */}
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase",
            color: th.hintColor, textAlign: "center",
            paddingBottom: 10, flexShrink: 0,
            transition: "opacity 0.3s",
            opacity: isOpen ? 0 : 0.6,
          }}>
            tap again to open
          </div>

          {/* ── Open overlay (state 2) ───────────────────────────── */}
          <div
            data-open-link="true"
            onClick={(e) => { e.stopPropagation(); router.push(`/research/${report.id}`); }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 12,
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? "auto" : "none",
              transition: "opacity 0.35s cubic-bezier(0.16,1,0.3,1)",
              cursor: "pointer",
              background: sepia ? `${color}18` : `${color}14`,
              backdropFilter: isOpen ? "blur(6px)" : "none",
            }}
          >
            <div style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              fontSize: 80, lineHeight: 1, fontStyle: "italic", fontWeight: 300,
              color,
              textShadow: `0 0 24px ${color}66`,
            }}>
              →
            </div>
            <div style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase",
              color: th.text, opacity: 0.7,
            }}>
              Open Report
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResearchLoom({ reports }: { reports: ResearchNode[] }) {
  const [filterDomain, setFilterDomain] = useState<string | null>(null);
  const sepia = useTheme();
  const th = T(sepia);

  const usedDomains = DOMAIN_CONFIG.filter(d =>
    reports.some(r => r.domain === d.key)
  );

  const visible = filterDomain
    ? reports.filter(r => r.domain === filterDomain)
    : reports;

  if (reports.length === 0) {
    return (
      <div style={{
        padding: "80px 0", textAlign: "center",
        fontFamily: "var(--font-jetbrains), monospace",
        fontSize: 11, color: "#494456", letterSpacing: "0.1em",
      }}>
        no research reports yet — run a VRC session and save output to The Platform/Research
      </div>
    );
  }

  return (
    <>
      {/* Inject CSS keyframes */}
      <style>{`
        @keyframes corpusOrbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes corpusOrbPulse {
          0%,100% { opacity: 0.9; }
          50%     { opacity: 0.65; box-shadow: 0 0 16px var(--pulse-color,currentColor); }
        }
        ${DOMAIN_ICON_KEYFRAMES}
        /* ── Research card grid: 2 across on mobile, smaller auto-fill on wider screens ── */
        .corpus-grid{ display:grid; gap:14px; grid-template-columns:repeat(2,minmax(0,1fr)); }
        @media (min-width:640px){ .corpus-grid{ gap:24px; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); } }
        @media (min-width:1100px){ .corpus-grid{ gap:28px; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); } }
        /* ── Card internals: scale up the orb + type on wider screens (card size unchanged) ── */
        .cs-orb{ position:relative; width:72px; height:72px; flex-shrink:0; }
        .cs-orb-sym{ width:40px; height:40px; }
        .cs-ftitle{ font-size:13px; }
        .cs-fdomain{ font-size:7px; }
        .cs-btitle{ font-size:12.5px; }
        .cs-bexcerpt{ font-size:10.5px; }
        .cs-bdomain{ font-size:7px; }
        @media (min-width:640px){
          .cs-orb{ width:90px; height:90px; }
          .cs-orb-sym{ width:52px; height:52px; }
          .cs-ftitle{ font-size:16px; }
          .cs-fdomain{ font-size:8px; }
          .cs-btitle{ font-size:15px; }
          .cs-bexcerpt{ font-size:12.5px; }
          .cs-bdomain{ font-size:8px; }
        }
        @media (min-width:1100px){
          .cs-orb{ width:108px; height:108px; }
          .cs-orb-sym{ width:62px; height:62px; }
          .cs-ftitle{ font-size:18px; }
          .cs-btitle{ font-size:16.5px; }
          .cs-bexcerpt{ font-size:13.5px; }
        }
      `}</style>

      {/* ── Domain filter pills ─────────────────────────────────── */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        gap: "8px 12px", marginBottom: 48,
        alignItems: "center",
      }}>
        <button
          onClick={() => setFilterDomain(null)}
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
            padding: "6px 14px",
            border: `1px solid ${filterDomain === null ? th.gold : th.filterBorder}`,
            background: filterDomain === null ? (sepia ? "rgba(139,105,20,0.1)" : "rgba(201,168,76,0.07)") : "transparent",
            color: filterDomain === null ? th.gold : th.filterText,
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          All Corpus
        </button>

        {usedDomains.map(d => (
          <button
            key={d.key}
            onClick={() => setFilterDomain(d.key === filterDomain ? null : d.key)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "6px 14px",
              border: `1px solid ${filterDomain === d.key ? d.color : th.filterBorder}`,
              background: filterDomain === d.key ? `${d.color}12` : "transparent",
              color: filterDomain === d.key ? d.color : th.filterText,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: d.color, flexShrink: 0,
            }} />
            {d.name}
          </button>
        ))}
      </div>

      {/* ── Card grid ───────────────────────────────────────────── */}
      <div className="corpus-grid">
        {visible.map((r, i) => (
          <CorpusCard key={r.id} report={r} index={i} />
        ))}
      </div>
    </>
  );
}
