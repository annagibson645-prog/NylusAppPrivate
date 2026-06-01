"use client";
import React, { useState, useCallback, useEffect, useId } from "react";
import { useRouter } from "next/navigation";

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

// ── Orb Symbols ─────────────────────────────────────────────────────────────
// Each domain's orb center is a living sigil (gradient + glow + signature motion),
// drawn in the domain color via currentColor. `UID` is replaced per instance so
// gradient ids stay unique across cards. Animation classes (cs-*) live in the
// injected <style> at the bottom of this component.
const ORB_DEFS = `<linearGradient id="UID-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity="0.95"/><stop offset="100%" stop-color="currentColor" stop-opacity="0.35"/></linearGradient><radialGradient id="UID-rad" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#fff" stop-opacity="0.9"/><stop offset="35%" stop-color="currentColor" stop-opacity="0.9"/><stop offset="100%" stop-color="currentColor" stop-opacity="0.15"/></radialGradient>`;

const ORB_ICONS: Record<string, string> = {
  "eastern-spirituality": `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><defs>${ORB_DEFS}</defs>
    <path d="M3 20 Q20 6 37 20 Q20 34 3 20Z" stroke-width="2"/>
    <g class="cs-blink">
      <circle cx="20" cy="20" r="7.5" fill="url(#UID-rad)" stroke="none"/>
      <g class="cs-spinC" stroke="currentColor" stroke-width="0.9" opacity="0.85"><path d="M20 12.6V14M20 26v1.4M12.6 20H14M26 20h1.4M14.7 14.7l1 1M24.3 24.3l1 1M25.3 14.7l-1 1M14.7 25.3l1-1"/></g>
      <circle cx="20" cy="20" r="3" fill="#0b0a12" stroke="currentColor" stroke-width="1.2"/>
      <circle cx="18.7" cy="18.7" r="1" fill="#fff" stroke="none"/></g></svg>`,

  "history": `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><defs>${ORB_DEFS}<clipPath id="UID-cw"><path d="M5 29 L5 13 L13.5 21 L20 8 L26.5 21 L35 13 L35 29Z"/></clipPath></defs>
    <path d="M5 29 L5 13 L13.5 21 L20 8 L26.5 21 L35 13 L35 29Z" fill="url(#UID-grad)" fill-opacity="0.9"/>
    <rect x="3" y="29" width="34" height="3.4" rx="1.2" fill="url(#UID-grad)"/>
    <g clip-path="url(#UID-cw)"><rect class="cs-sheen" x="-6" y="6" width="6" height="26" fill="#fff" opacity="0"/></g>
    <circle class="cs-tw" cx="5" cy="13" r="1.7" fill="#fff"/><circle class="cs-tw2" cx="20" cy="8" r="2" fill="#fff"/><circle class="cs-tw3" cx="35" cy="13" r="1.7" fill="#fff"/></svg>`,

  "psychology": `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><defs>${ORB_DEFS}</defs>
    <path d="M11 25 C7 24 6 19 9 16 C7 12 11 9 15 11 C16 7 22 7 23 11 C28 8 32 13 29 17 C33 18 33 24 28 24 C28 27 24 27 23 24 C20 26 14 27 11 25 Z" fill="url(#UID-grad)" fill-opacity="0.18"/>
    <path d="M13 16 C16 16 16 21 13 22 M18.5 13 C21.5 14 20.5 20 17.5 21 M24 14 C27 15 26 21 23 22" opacity="0.6"/>
    <path d="M24 24 C25 27 24 30 22 31" opacity="0.7"/>
    <circle r="1.4" fill="#fff"><animateMotion dur="2.6s" repeatCount="indefinite" path="M13 19 C16 21 20 21 24 19"/><animate attributeName="opacity" dur="2.6s" repeatCount="indefinite" values="0;1;1;0"/></circle></svg>`,

  "business": `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><defs>${ORB_DEFS}</defs>
    <rect x="8" y="8" width="24" height="16" rx="2" fill="url(#UID-grad)" fill-opacity="0.14"/>
    <g stroke-width="1.6" stroke-linecap="round"><line class="cs-typ1" x1="11.5" y1="13" x2="20" y2="13"/><line class="cs-typ2" x1="11.5" y1="16" x2="25" y2="16"/><line class="cs-typ3" x1="11.5" y1="19" x2="17" y2="19"/></g>
    <rect class="cs-cursor" x="26.5" y="17.6" width="2.2" height="3" fill="currentColor" stroke="none"/>
    <path d="M4 28 L36 28 L38.2 31.4 Q38.5 32 37.7 32 H2.3 Q1.5 32 1.8 31.4 Z" fill="url(#UID-grad)" fill-opacity="0.22"/><line x1="16" y1="28" x2="24" y2="28" stroke-linecap="round"/></svg>`,

  "creative-practice": `<svg viewBox="0 0 40 40" fill="none"><defs>
      <linearGradient id="UID-fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="currentColor" stop-opacity="0.4"/><stop offset="55%" stop-color="currentColor" stop-opacity="0.92"/><stop offset="100%" stop-color="#fff" stop-opacity="0.95"/></linearGradient>
      <radialGradient id="UID-core" cx="50%" cy="74%" r="52%"><stop offset="0%" stop-color="#fff" stop-opacity="0.95"/><stop offset="55%" stop-color="currentColor" stop-opacity="0.75"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
    <path class="cs-flame" d="M20 37 C12 33 11 24 17 18 C18 21 20.5 20 19.5 16 C19 10 25 8 22 3 C24 7 28 9 28 14 C30.5 12 31 10 30.5 8 C33 15 31.5 25 26 29 C24 32 23 35 20 37 Z" fill="url(#UID-fl)" stroke="currentColor" stroke-width="1.1" stroke-opacity="0.5" stroke-linejoin="round"/>
    <path class="cs-flame2" d="M20 33 C15 30 15 24 19 20 C20 22 22 21.5 21 18 C24 21 24 27 22 30 C21 32 21 32 20 33 Z" fill="url(#UID-core)"/></svg>`,

  "african-spirituality": `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><defs>${ORB_DEFS}</defs>
    <g class="cs-beat">
      <path d="M11 12 C11.5 20 13 26 14.5 29 C16 31.5 24 31.5 25.5 29 C27 26 28.5 20 29 12 Z" fill="url(#UID-grad)" fill-opacity="0.14"/>
      <ellipse cx="20" cy="12" rx="9.4" ry="3.2" fill="url(#UID-grad)" fill-opacity="0.45"/>
      <path d="M12.6 14 L16 21 L19.7 14 L23.4 21 L27 14" opacity="0.85"/>
      <path d="M14.5 29 C13.5 31 12.8 32 12 33 M25.5 29 C26.5 31 27.2 32 28 33" opacity="0.7"/></g></svg>`,

  "cross-domain": `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2"><defs>${ORB_DEFS}<radialGradient id="UID-lens" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity="0.85"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
    <g class="cs-spinC">
      <circle cx="15.5" cy="20" r="8.5" fill="url(#UID-grad)" fill-opacity="0.1"/>
      <circle cx="24.5" cy="20" r="8.5" fill="url(#UID-grad)" fill-opacity="0.1"/>
      <ellipse class="cs-breathe" cx="20" cy="20" rx="2.6" ry="6.6" fill="url(#UID-lens)" stroke="none"/></g></svg>`,

  "behavioral-mechanics": `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><defs>${ORB_DEFS}</defs>
    <g class="cs-spinC">
      <path d="M9 15 A12 12 0 0 1 31 15" stroke="url(#UID-grad)"/>
      <path d="M31 25 A12 12 0 0 1 9 25" stroke="url(#UID-grad)"/>
      <path d="M31 9 L31 15 L25 15 M9 31 L9 25 L15 25"/>
    </g></svg>`,
};

function OrbSymbol({ domainKey, color }: { domainKey: string; color: string }) {
  const uid = "o" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const tpl = ORB_ICONS[domainKey] ?? ORB_ICONS["cross-domain"];
  const svg = tpl.replace(/UID/g, uid);
  return (
    <div
      className="cs-orb-sym"
      style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 56, height: 56, color,
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: `drop-shadow(0 0 9px ${color}99)`,
        animation: "corpusSymPulse 3.2s ease-in-out infinite",
        zIndex: 2,
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ── Spinning Orb ──────────────────────────────────────────────────────────────
// All 5 satellites use the domain color; dots vary in opacity for depth.
function SpinningOrb({ color, domain }: { color: string; domain: string }) {
  const DOT_COUNT = 5;
  // stagger: full rotation = 4s, 360° / 5 = 72° = 0.8s per step
  return (
    <div style={{
      position: "relative",
      width: 104, height: 104,
      flexShrink: 0,
    }}>
      {/* Outer glow ring */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: "50%",
        border: `1px solid ${color}`,
        opacity: 0.18,
      }} />

      {/* Central sigil — domain symbol, pulsing + animated */}
      <OrbSymbol domainKey={domain} color={color} />

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
            width: 5, height: 5,
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

  const handleClick = useCallback((e: React.MouseEvent) => {
    // If they clicked the open-overlay link itself, let router handle it
    if ((e.target as HTMLElement).closest("[data-open-link]")) return;

    if (cardState === 0) {
      setCardState(1);
    } else if (cardState === 1) {
      setCardState(2);
    } else {
      // state 2 → reset to front
      setCardState(0);
    }
  }, [cardState]);

  const isFlipped = cardState >= 1;
  const isOpen    = cardState === 2;

  return (
    <div
      onClick={handleClick}
      style={{
        perspective: "1100px",
        aspectRatio: "5/9",
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
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "28px 18px 18px", gap: 18, width: "100%",
          }}>
            <SpinningOrb color={color} domain={report.domain} />

            <div style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              fontSize: 17, fontWeight: 400, fontStyle: "italic",
              textAlign: "center", lineHeight: 1.3, color: th.text,
            }}>
              {report.title}
            </div>

            <div style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase",
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
            flex: 1, display: "flex", flexDirection: "column",
            padding: "22px 17px 12px", gap: 12,
            transition: "filter 0.3s, opacity 0.3s",
            filter: isOpen ? "blur(3px)" : "none",
            opacity: isOpen ? 0.2 : 1,
          }}>
            <div style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 7, letterSpacing: "0.25em", textTransform: "uppercase",
              color, opacity: 0.65,
            }}>
              {getDomainShort(report.domain)}
            </div>

            <div style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              fontSize: 15, fontStyle: "italic", fontWeight: 600,
              lineHeight: 1.2, color: th.text,
            }}>
              {report.title}
            </div>

            <div style={{ height: 1, background: color, opacity: 0.18 }} />

            <div style={{
              fontFamily: "var(--font-newsreader), Georgia, serif",
              fontSize: 12, fontWeight: 300, lineHeight: 1.72,
              color: th.textDim, flex: 1,
              overflow: "hidden",
            }}>
              {report.excerpt ?? "No excerpt available."}
            </div>

            <div style={{
              display: "flex", gap: 12,
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
        /* ── Orb sigil motion ── */
        .cs-orb-sym svg { width:100%; height:100%; display:block; overflow:visible; }
        @keyframes corpusSymPulse { 0%,100%{opacity:.96} 50%{opacity:.74} }
        @keyframes csSpin  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes csBlink { 0%,92%,100%{transform:scaleY(1)} 96%{transform:scaleY(.06)} }
        @keyframes csFlick { 0%{transform:scaleY(.92) skewX(-3deg)} 100%{transform:scaleY(1.08) skewX(4deg)} }
        @keyframes csTw    { 0%,100%{opacity:.35} 50%{opacity:1} }
        @keyframes csSheen { 0%,100%{opacity:0;transform:translateX(-10px)} 45%{opacity:.9} 60%{opacity:0;transform:translateX(12px)} }
        @keyframes csBeat  { 0%,100%{transform:scale(1)} 12%{transform:scale(1.07)} 24%{transform:scale(1)} 36%{transform:scale(1.05)} 48%{transform:scale(1)} }
        @keyframes csCur   { 0%,50%{opacity:1} 51%,100%{opacity:0} }
        @keyframes csTyp   { 0%{transform:scaleX(0)} 30%,80%{transform:scaleX(1)} 100%{transform:scaleX(0)} }
        .cs-spinC{transform-box:fill-box;transform-origin:center;animation:csSpin 16s linear infinite}
        .cs-gearA{transform-box:fill-box;transform-origin:center;animation:csSpin 7s linear infinite}
        .cs-gearB{transform-box:fill-box;transform-origin:center;animation:csSpin 5s linear infinite reverse}
        .cs-blink{transform-box:fill-box;transform-origin:center;animation:csBlink 5.5s ease-in-out infinite}
        .cs-flame{transform-box:fill-box;transform-origin:50% 100%;animation:csFlick .5s ease-in-out infinite alternate}
        .cs-flame2{transform-box:fill-box;transform-origin:50% 100%;animation:csFlick .38s ease-in-out infinite alternate-reverse}
        .cs-tw{animation:csTw 2.4s ease-in-out infinite}
        .cs-tw2{animation:csTw 2.4s ease-in-out infinite .8s}
        .cs-tw3{animation:csTw 2.4s ease-in-out infinite 1.6s}
        .cs-sheen{animation:csSheen 4.5s ease-in-out infinite}
        .cs-beat{transform-box:fill-box;transform-origin:center;animation:csBeat 1.9s ease-in-out infinite}
        .cs-cursor{animation:csCur 1.05s steps(1) infinite}
        .cs-typ1{transform-box:fill-box;transform-origin:left center;animation:csTyp 3s ease-in-out infinite}
        .cs-typ2{transform-box:fill-box;transform-origin:left center;animation:csTyp 3s ease-in-out infinite .6s}
        .cs-typ3{transform-box:fill-box;transform-origin:left center;animation:csTyp 3s ease-in-out infinite 1.2s}
        .cs-breathe{animation:corpusSymPulse 3s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){ [class^="cs-"],[class*=" cs-"]{animation:none !important} }
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
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 28,
      }}>
        {visible.map((r, i) => (
          <CorpusCard key={r.id} report={r} index={i} />
        ))}
      </div>
    </>
  );
}
