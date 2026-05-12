"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import NavG from "./NavG";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlimHub {
  id: string;
  title: string;
  domain: string;
  color: string;
  excerpt: string;
  covers: number;
}

// ─── Domain config ────────────────────────────────────────────────────────────

const DOMAIN_META = [
  { key: "psychology",            label: "Psychology",           short: "Psychology",   color: "#f59e0b", angle: -90  },
  { key: "history",               label: "History",              short: "History",      color: "#e6c068", angle: -45  },
  { key: "cross-domain",          label: "Cross-Domain",         short: "Cross-Domain", color: "#5fc9a8", angle: 0    },
  { key: "behavioral-mechanics",  label: "Behavioral Mechanics", short: "Behavioral",   color: "#a78bfa", angle: 45   },
  { key: "eastern-spirituality",  label: "Eastern Spirituality", short: "Eastern",      color: "#7c8df0", angle: 90   },
  { key: "creative-practice",     label: "Creative Practice",    short: "Creative",     color: "#ef5a6f", angle: 135  },
  { key: "ai-collaboration",      label: "AI Collaboration",     short: "AI Collab.",   color: "#9ca3af", angle: 180  },
  { key: "african-spirituality",  label: "African Spirituality", short: "African",      color: "#34d399", angle: -135 },
] as const;

// ─── SVG constants ────────────────────────────────────────────────────────────

const CX      = 320;
const CY      = 260;
const ARM     = 175;
const STONE_R = 13;   // slightly larger for mobile touch targets
const LABEL_R = ARM + 32;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function toRoman(n: number): string {
  const table: [number, string][] = [
    [20,"XX"],[19,"XIX"],[18,"XVIII"],[17,"XVII"],[16,"XVI"],
    [15,"XV"],[14,"XIV"],[13,"XIII"],[12,"XII"],[11,"XI"],
    [10,"X"],[9,"IX"],[8,"VIII"],[7,"VII"],[6,"VI"],
    [5,"V"],[4,"IV"],[3,"III"],[2,"II"],[1,"I"],
  ];
  for (const [v, s] of table) { if (n >= v) return s; }
  return String(n);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  .hubs-page {
    --h-bg:          #0e0c09;
    --h-bg2:         #1a1510;
    --h-bg3:         #221d15;
    --h-border:      #2e2818;
    --h-text:        #f0e8d4;
    --h-text2:       #9a8a78;
    --h-text3:       #6a5e50;
    --h-gold:        #c8a040;
    --h-rake:        #191410;
    --h-arm:         #2e2818;
    --h-stone-bg:    #1a1510;
    --h-label:       #9a8e7e;
    --h-center-ring: #231e15;
  }
  [data-theme="sepia"] .hubs-page {
    --h-bg:          #f2ece0;
    --h-bg2:         #e8e0cc;
    --h-bg3:         #ddd6c0;
    --h-border:      #c8bca0;
    --h-text:        #2c1f0e;
    --h-text2:       #6a5040;
    --h-text3:       #8a7860;
    --h-gold:        #8b6914;
    --h-rake:        #dcd4b8;
    --h-arm:         #c0b498;
    --h-stone-bg:    #e8e0cc;
    --h-label:       #7a6850;
    --h-center-ring: #c8c0a8;
  }

  @keyframes dharmaRotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* The dharma wheel spins continuously */
  .h-dharma {
    transform-box:    view-box;
    transform-origin: ${CX}px ${CY}px;
    animation:        dharmaRotate 38s linear infinite;
  }

  /* Hub cards */
  .h-card {
    background: var(--h-bg2);
    border-top:    1px solid var(--h-border);
    border-right:  1px solid var(--h-border);
    border-bottom: 1px solid var(--h-border);
    border-left-width: 2px;
    border-left-style: solid;
    padding: 18px 20px;
    transition: background 0.2s;
    text-decoration: none;
    display: block;
    height: 100%;
  }
  .h-card:hover  { background: var(--h-bg3); }
  .h-card:active { background: var(--h-bg3); }

  /* Mobile */
  @media (max-width: 600px) {
    .h-card { padding: 14px 16px; }
    .h-hub-grid { grid-template-columns: 1fr !important; }
  }
`;

// ─── Dharmachakra (Dharma Wheel) background ───────────────────────────────────
//
// 8 spokes, hub lotus, double rim, 24 tick marks.
// Color follows the active domain; opacity lifts when a domain is active.
// All children use stroke/fill="currentColor" so a single CSS `color` transition
// on the wrapper drives every element at once.

function DharmaBackground({ activeColor }: { activeColor: string | null }) {
  const RIM         = 210;
  const OUTER_SPOKE = 198;
  const INNER_SPOKE = 44;
  const HUB_R       = 44;
  const HUB_INNER   = 30;

  // base opacity (no selection) vs active opacity
  const opacity = activeColor ? 0.52 : 0.22;
  // resolved color: domain hex when active, CSS var otherwise
  const wheelColor = activeColor ?? "var(--h-gold)";

  return (
    <g style={{ opacity, transition: "opacity 0.45s ease" }}>
      {/* Inner g carries the spin animation AND the color transition */}
      <g
        className="h-dharma"
        style={{ color: wheelColor, transition: "color 0.45s ease" }}
      >
        {/* ── Outer double rim ── */}
        <circle cx={CX} cy={CY} r={RIM}
          fill="none" stroke="currentColor" strokeWidth={1.3} />
        <circle cx={CX} cy={CY} r={RIM - 16}
          fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.7} />

        {/* ── 24 rim tick marks ── */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const r1 = RIM - 16, r2 = RIM;
          return (
            <line key={i}
              x1={CX + Math.cos(a) * r1} y1={CY + Math.sin(a) * r1}
              x2={CX + Math.cos(a) * r2} y2={CY + Math.sin(a) * r2}
              stroke="currentColor" strokeWidth={0.6}
            />
          );
        })}

        {/* ── 8 spokes ── */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line key={i}
              x1={CX + Math.cos(a) * INNER_SPOKE} y1={CY + Math.sin(a) * INNER_SPOKE}
              x2={CX + Math.cos(a) * OUTER_SPOKE} y2={CY + Math.sin(a) * OUTER_SPOKE}
              stroke="currentColor" strokeWidth={1.0}
            />
          );
        })}

        {/* ── Diamond ornament at each spoke midpoint ── */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const mx = CX + Math.cos(a) * 130;
          const my = CY + Math.sin(a) * 130;
          const rot = (i / 8) * 360 + 45;
          return (
            <rect key={i}
              x={mx - 4.5} y={my - 4.5} width={9} height={9}
              fill="none" stroke="currentColor" strokeWidth={0.6}
              transform={`rotate(${rot} ${mx} ${my})`}
            />
          );
        })}

        {/* ── Spoke tip dots ── */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <circle key={i}
              cx={CX + Math.cos(a) * (OUTER_SPOKE - 5)}
              cy={CY + Math.sin(a) * (OUTER_SPOKE - 5)}
              r={2.8} fill="currentColor"
            />
          );
        })}

        {/* ── Hub outer + inner ring ── */}
        <circle cx={CX} cy={CY} r={HUB_R}
          fill="none" stroke="currentColor" strokeWidth={1.1} />
        <circle cx={CX} cy={CY} r={HUB_INNER}
          fill="none" stroke="currentColor" strokeWidth={0.6} />

        {/* ── Hub 8-petal lotus ──
            Each ellipse is placed at (CX, CY - orbitR) then rotated i*45°
            around the compass center — the long axis stays radial. */}
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i}
            cx={CX} cy={CY - (HUB_R - 8)}
            rx={5} ry={12}
            fill="none" stroke="currentColor" strokeWidth={0.7}
            transform={`rotate(${i * 45} ${CX} ${CY})`}
          />
        ))}

        {/* ── Centre bindu ── */}
        <circle cx={CX} cy={CY} r={3.5} fill="currentColor" opacity={0.75} />
      </g>
    </g>
  );
}

// ─── Hub card ─────────────────────────────────────────────────────────────────

function HubCard({ hub, index, color }: { hub: SlimHub; index: number; color: string }) {
  return (
    <Link href={`/hub/${hub.id}`} className="h-card" style={{ borderLeftColor: color }}>
      <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: 8 }}>
        <span style={{
          fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: 11, color, opacity: 0.6,
          minWidth: 24, flexShrink: 0, fontVariantNumeric: "tabular-nums",
        }}>
          {toRoman(index + 1)}.
        </span>
        <span style={{
          fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: 18, color: "var(--h-text)", lineHeight: 1.3,
        }}>
          {hub.title}
        </span>
      </div>

      {hub.excerpt && (
        <p style={{
          fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: 13, color: "var(--h-text2)", lineHeight: 1.6,
          fontStyle: "italic", margin: "0 0 8px",
        }}>
          {hub.excerpt.length > 100 ? hub.excerpt.slice(0, 100) + "…" : hub.excerpt}
        </p>
      )}

      {hub.covers > 0 && (
        <div style={{
          fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
          fontSize: 9, color: "var(--h-text3)", letterSpacing: "0.12em",
        }}>
          {hub.covers} concepts
        </div>
      )}
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HubsCompassRose({ hubs }: { hubs: SlimHub[] }) {
  // `selected` = locked by click/tap; `hovered` = desktop mouse preview
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered,  setHovered]  = useState<string | null>(null);

  const byDomain = useMemo(() => {
    const map: Record<string, SlimHub[]> = {};
    for (const d of DOMAIN_META) map[d.key] = [];
    for (const h of hubs) {
      if (map[h.domain]) map[h.domain].push(h);
    }
    return map;
  }, [hubs]);

  // Hover previews the wheel color without locking the hub list
  const activeKey    = hovered ?? selected;
  const activeDomain = DOMAIN_META.find(d => d.key === activeKey) ?? null;
  const activeColor  = activeDomain?.color ?? null;

  // Hub list follows the click selection only
  const listDomain = DOMAIN_META.find(d => d.key === selected) ?? null;
  const activeHubs = selected ? (byDomain[selected] ?? []) : [];

  return (
    <div className="hubs-page" style={{
      minHeight: "100vh",
      background: "var(--h-bg)",
      display: "flex",
      flexDirection: "column",
    }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <NavG active="Hubs" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* ── Header ── */}
        <header style={{ padding: "32px 0 4px", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
            fontSize: 9, letterSpacing: "0.3em", color: "var(--h-text3)",
            textTransform: "uppercase", margin: "0 0 6px",
          }}>
            Maps of Content
          </p>
          <h1 style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: 28, fontWeight: 300, fontStyle: "italic",
            color: "var(--h-text)", letterSpacing: "0.08em", margin: 0,
          }}>
            The Hubs
          </h1>
        </header>

        {/* ── Compass SVG ── */}
        <svg
          viewBox="0 0 640 520"
          style={{ width: "100%", maxWidth: 720, display: "block" }}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Compass rose — 8 knowledge domains"
        >
          <defs>
            <pattern id="h-rake" patternUnits="userSpaceOnUse" width="40" height="40"
              patternTransform="rotate(22)">
              <line x1="0" y1="0" x2="0" y2="40"
                stroke="var(--h-rake)" strokeWidth="0.8" />
         