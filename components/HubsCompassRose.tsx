"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NavG from "./NavG";

// ─── Palettes (mirrors ConstellationV2 + collisions) ─────────────────────────
const HUB_PALETTES = {
  ember: {
    name:    "ember",
    bg:      "#0e0c09", bg2: "#1a1510", bg3: "#221d15",
    border:  "#2e2818",
    text:    "#f0e8d4", text2: "#9a8a78", text3: "#6a5e50",
    gold:    "#c8a040",
    rake:    "#191410",
    centerRing: "#231e15", stoneBg: "#1a1510", arm: "#2e2818",
  },
  aurora: {
    name:    "aurora",
    bg:      "#0a0e1a", bg2: "#101626", bg3: "#161e30",
    border:  "rgba(160,200,255,0.12)",
    text:    "#e8f0ff", text2: "#8898b8", text3: "#3a4a68",
    gold:    "#7dd3fc",
    rake:    "#0d1525",
    centerRing: "#1a2640", stoneBg: "#101626", arm: "#1e2e48",
  },
  monochrome: {
    name:    "monochrome",
    bg:      "#0a0a0a", bg2: "#111111", bg3: "#1a1a1a",
    border:  "rgba(255,255,255,0.08)",
    text:    "#f5f5f5", text2: "#888888", text3: "#444444",
    gold:    "#cccccc",
    rake:    "#0f0f0f",
    centerRing: "#222222", stoneBg: "#111111", arm: "#2a2a2a",
  },
  sepia: {
    name:    "sepia",
    bg:      "#f2ece0", bg2: "#e8e0cc", bg3: "#ddd6c0",
    border:  "rgba(139,105,20,0.18)",
    text:    "#2c1f0e", text2: "#6a5040", text3: "#8a7860",
    gold:    "#8b6914",
    rake:    "#dcd4b8",
    centerRing: "#c8c0a8", stoneBg: "#e8e0cc", arm: "#c0b498",
  },
} as const;

type PaletteKey = keyof typeof HUB_PALETTES;
const PALETTE_ORDER: PaletteKey[] = ["ember", "aurora", "monochrome"];

interface SlimHub {
  id: string;
  title: string;
  domain: string;
  color: string;
  excerpt: string;
  covers: number;
}

interface UngroupedConcept {
  id: string;
  title: string;
  domain: string;
  excerpt: string;
  status: string;
}

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

const CX      = 320;
const CY      = 260;
const ARM     = 175;
const STONE_R = 18;
const LABEL_R = ARM + 36;

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

/* ─── Orphan Drawer ──────────────────────────────────────────────────────── */
function OrphanDrawer({
  open,
  onClose,
  domain,
  concepts,
}: {
  open: boolean;
  onClose: () => void;
  domain: typeof DOMAIN_META[number] | null;
  concepts: UngroupedConcept[];
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const statusColor: Record<string, string> = {
    stub:       "#6a5e50",
    developing: "#c8a040",
    stable:     "#34d399",
    archived:   "#4a4468",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Drawer panel */}
      <aside
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(440px, 92vw)", zIndex: 50,
          background: "var(--h-bg)",
          borderLeft: `1px solid ${domain?.color ?? "var(--h-border)"}33`,
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.38s cubic-bezier(0.65,0,0.35,1)",
          boxShadow: open ? "-24px 0 80px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "28px 28px 20px",
          borderBottom: `0.5px solid var(--h-border)`,
          flexShrink: 0,
        }}>
          {/* Domain label */}
          <div style={{
            fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)",
            fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase",
            color: domain?.color ?? "var(--h-text3)",
            marginBottom: 8,
          }}>
            {domain?.label ?? "Domain"} — ungrouped
          </div>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant,'Cormorant Garamond',Georgia,serif)",
              fontSize: 26, fontWeight: 300, fontStyle: "italic",
              color: "var(--h-text)", margin: 0, letterSpacing: "0.04em",
            }}>
              {concepts.length} concept{concepts.length !== 1 ? "s" : ""} without a hub
            </h2>
            <button
              onClick={onClose}
              style={{
                fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)",
                fontSize: 10, letterSpacing: "0.12em", color: "var(--h-text3)",
                background: "none", border: "none", cursor: "pointer",
                padding: "4px 0", flexShrink: 0, transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--h-text2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--h-text3)")}
            >
              esc ✕
            </button>
          </div>

          {/* Subtext */}
          <p style={{
            fontFamily: "var(--font-cormorant,'Cormorant Garamond',Georgia,serif)",
            fontSize: 15, fontStyle: "italic", color: "var(--h-text3)",
            margin: "10px 0 0", lineHeight: 1.5,
          }}>
            These live in the vault but haven't been claimed by any hub yet.
          </p>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {concepts.length === 0 ? (
            <div style={{
              padding: "48px 28px", textAlign: "center",
              fontFamily: "var(--font-cormorant,'Cormorant Garamond',Georgia,serif)",
              fontSize: 19, fontStyle: "italic", color: "var(--h-text3)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 16, opacity: 0.35 }}>✦</div>
              All concepts in this domain are assigned to a hub.
            </div>
          ) : (
            concepts.map((c) => (
              <Link
                key={c.id}
                href={`/concept/${c.id}`}
                onClick={onClose}
                style={{ display: "block", textDecoration: "none", padding: "18px 28px",
                  borderBottom: `0.5px solid var(--h-border)`,
                  borderLeft: `3px solid ${domain?.color ?? "var(--h-border)"}30`,
                  transition: "background 0.15s, border-left-color 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--h-bg2)";
                  (e.currentTarget as HTMLAnchorElement).style.borderLeftColor = domain?.color ?? "var(--h-gold)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.borderLeftColor = `${domain?.color ?? "var(--h-border)"}30`;
                }}
              >
                {/* Concept title — large and clear */}
                <div style={{
                  fontFamily: "var(--font-cormorant,'Cormorant Garamond',Georgia,serif)",
                  fontSize: 22, fontWeight: 400, fontStyle: "italic",
                  color: "var(--h-text)", lineHeight: 1.25, marginBottom: 8,
                }}>
                  {c.title}
                </div>

                {/* Excerpt — readable body size */}
                {c.excerpt && (
                  <p style={{
                    fontFamily: "var(--font-cormorant,'Cormorant Garamond',Georgia,serif)",
                    fontSize: 16, color: "var(--h-text2)", lineHeight: 1.55,
                    margin: "0 0 10px", fontStyle: "italic",
                  }}>
                    {c.excerpt}
                  </p>
                )}

                {/* Status badge */}
                <span style={{
                  fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)",
                  fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
                  color: statusColor[c.status] ?? "var(--h-text3)",
                }}>
                  {c.status}
                </span>
              </Link>
            ))
          )}
        </div>

        {/* Footer note */}
        <div style={{
          padding: "16px 28px",
          borderTop: `0.5px solid var(--h-border)`,
          fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)",
          fontSize: 9, color: "var(--h-text3)", letterSpacing: "0.18em",
          textTransform: "uppercase", flexShrink: 0,
        }}>
          assign via build-vault.ts → hub field
        </div>
      </aside>
    </>
  );
}

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
  @keyframes dharmaRotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .h-dharma {
    transform-box:    view-box;
    transform-origin: 320px 260px;
    animation:        dharmaRotate 38s linear infinite;
  }
  .h-card {
    background: var(--h-bg2);
    border-top:    1px solid var(--h-border);
    border-right:  1px solid var(--h-border);
    border-bottom: 1px solid var(--h-border);
    border-left-width: 3px;
    border-left-style: solid;
    padding: 28px 28px;
    transition: background 0.2s;
    text-decoration: none;
    display: block;
    height: 100%;
  }
  .h-card:hover  { background: var(--h-bg3); }
  .h-card:active { background: var(--h-bg3); }
  @media (max-width: 700px) {
    .h-card { padding: 20px 20px; }
    .h-hub-grid { grid-template-columns: 1fr !important; }
  }
`;

function DharmaBackground({ activeColor }: { activeColor: string | null }) {
  const RIM         = 210;
  const OUTER_SPOKE = 198;
  const INNER_SPOKE = 44;
  const HUB_R       = 44;
  const HUB_INNER   = 30;
  const opacity     = activeColor ? 0.45 : 0.14;
  const wheelColor  = activeColor ?? "var(--h-gold)";

  return (
    <g style={{ opacity, transition: "opacity 0.45s ease" }}>
      <g className="h-dharma" style={{ color: wheelColor, transition: "color 0.45s ease" }}>
        <circle cx={CX} cy={CY} r={RIM} fill="none" stroke="currentColor" strokeWidth={1.3} />
        <circle cx={CX} cy={CY} r={RIM - 16} fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.7} />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <line key={i}
              x1={CX + Math.cos(a) * (RIM - 16)} y1={CY + Math.sin(a) * (RIM - 16)}
              x2={CX + Math.cos(a) * RIM}         y2={CY + Math.sin(a) * RIM}
              stroke="currentColor" strokeWidth={0.6}
            />
          );
        })}
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
        {Array.from({ length: 8 }, (_, i) => {
          const a   = (i / 8) * Math.PI * 2;
          const mx  = CX + Math.cos(a) * 130;
          const my  = CY + Math.sin(a) * 130;
          const rot = (i / 8) * 360 + 45;
          return (
            <rect key={i}
              x={mx - 4.5} y={my - 4.5} width={9} height={9}
              fill="none" stroke="currentColor" strokeWidth={0.6}
              transform={`rotate(${rot} ${mx} ${my})`}
            />
          );
        })}
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
        <circle cx={CX} cy={CY} r={HUB_R}    fill="none" stroke="currentColor" strokeWidth={1.1} />
        <circle cx={CX} cy={CY} r={HUB_INNER} fill="none" stroke="currentColor" strokeWidth={0.6} />
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i}
            cx={CX} cy={CY - (HUB_R - 8)}
            rx={5} ry={12}
            fill="none" stroke="currentColor" strokeWidth={0.7}
            transform={`rotate(${i * 45} ${CX} ${CY})`}
          />
        ))}
        <circle cx={CX} cy={CY} r={3.5} fill="currentColor" opacity={0.75} />
      </g>
    </g>
  );
}

function HubCard({ hub, index, color }: { hub: SlimHub; index: number; color: string }) {
  return (
    <Link href={`/hub/${hub.id}`} className="h-card" style={{ borderLeftColor: color }}>
      <div style={{ display: "flex", gap: 14, alignItems: "baseline", marginBottom: 12 }}>
        <span style={{
          fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: 18, color, opacity: 0.6,
          minWidth: 32, flexShrink: 0, fontVariantNumeric: "tabular-nums",
        }}>
          {toRoman(index + 1)}.
        </span>
        <span style={{
          fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: 32, color: "var(--h-text)", lineHeight: 1.2, fontWeight: 400,
        }}>
          {hub.title}
        </span>
    