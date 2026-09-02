"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NavG from "./NavG";
import VaultSearch from "./VaultSearch";
import { pickHubIcon } from "@/lib/hubIcons";
import { DomainEmblem } from "@/components/DomainEmblems";
import { hubCardDescription } from "@/lib/hubCardDescriptions";

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
  { key: "psychology",            label: "Psychology",           short: "Psychology",   color: "#f59e0b", angle: -80  },
  { key: "history",               label: "History",              short: "History",      color: "#e6c068", angle: -40  },
  { key: "cross-domain",          label: "Cross-Domain",         short: "Cross-Domain", color: "#38bdf8", angle: 0    },
  { key: "behavioral-mechanics",  label: "Behavioral Mechanics", short: "Behavioral",   color: "#a78bfa", angle: 40   },
  { key: "eastern-spirituality",  label: "Eastern Spirituality", short: "Eastern",      color: "#dc2626", angle: 80   },
  { key: "occult",                label: "Occult",               short: "Occult",       color: "#d95ae8", angle: 120  },
  { key: "creative-practice",     label: "Creative Practice",    short: "Creative",     color: "#14b8a6", angle: 160  },
  { key: "business",              label: "Business",             short: "Business",     color: "#e879a0", angle: -160 },
  { key: "african-spirituality",  label: "African Spirituality", short: "African",      color: "#34d399", angle: -120 },
] as const;

const DOMAIN_DESC: Record<string, string> = {
  "psychology":            "What's happening inside a person — drives, wounds, and the architecture of the self.",
  "history":                "How power, empires, and ideas actually rose and fell.",
  "cross-domain":           "Territory that cannot be understood through one domain alone.",
  "behavioral-mechanics":   "Tactics — influence, compliance, and the machinery of persuasion.",
  "eastern-spirituality":   "Practice, cosmology, and the traditions built to transform a person.",
  "creative-practice":      "Craft, voice, and the discipline of making things well.",
  "business":               "How work actually gets done — tools, systems, and operators.",
  "african-spirituality":   "Cosmology, healing, and spirit architecture across African traditions.",
  "occult":                 "Western esoteric practice — Qabalah, hermeticism, ceremonial magic, and the grimoires.",
};

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
    border: 1px solid var(--h-border);
    padding: 40px 28px 30px;
    transition: background 0.2s, border-color 0.2s;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    height: 100%;
  }
  .h-card:hover  { background: var(--h-bg3); border-color: var(--h-border2, var(--h-border)); }
  .h-card:active { background: var(--h-bg3); }
  .h-icon-halo { position: relative; width: 72px; height: 72px; flex-shrink: 0; margin: 2px 0 0; }
  @keyframes hHaloSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .h-icon-halo-ring {
    position: absolute; inset: -7px; border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--dc) 32%, transparent);
    animation: hHaloSpin 30s linear infinite;
    transition: border-color 0.3s ease;
  }
  .h-icon-halo-fill {
    position: absolute; inset: 0; border-radius: 50%;
    background: color-mix(in srgb, var(--dc) 15%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--dc) 50%, transparent);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; opacity: 0.9;
    transition: box-shadow 0.35s ease, opacity 0.25s ease, background 0.25s ease;
  }
  .h-card:hover .h-icon-halo-ring { border-color: color-mix(in srgb, var(--dc) 68%, transparent); animation-duration: 8s; }
  .h-card:hover .h-icon-halo-fill {
    opacity: 1;
    background: color-mix(in srgb, var(--dc) 22%, transparent);
    box-shadow: 0 0 16px color-mix(in srgb, var(--dc) 45%, transparent);
  }
  .h-wheel-wrap {
    width: 100%; display: flex; justify-content: center;
    overflow: hidden;
    max-height: 650px;
    opacity: 1;
    transform: translateY(0) scale(1);
    transition: max-height 0.65s cubic-bezier(.4,0,.2,1),
                opacity 0.4s ease,
                transform 0.5s cubic-bezier(.4,0,.2,1),
                margin 0.65s cubic-bezier(.4,0,.2,1);
  }
  .h-wheel-wrap.is-hidden {
    max-height: 0;
    opacity: 0;
    transform: translateY(-48px) scale(0.96);
    margin-top: -8px;
    pointer-events: none;
  }
  .h-domhero-wrap {
    width: 100%;
    overflow: hidden;
    max-height: 900px;
    opacity: 1;
    transform: translateY(0);
    transition: max-height 0.6s cubic-bezier(.4,0,.2,1) 0.12s,
                opacity 0.45s ease 0.15s,
                transform 0.55s cubic-bezier(.4,0,.2,1) 0.12s;
  }
  .h-domhero-wrap.is-hidden {
    max-height: 0;
    opacity: 0;
    transform: translateY(-28px);
    transition: max-height 0.5s cubic-bezier(.4,0,.2,1),
                opacity 0.3s ease,
                transform 0.4s cubic-bezier(.4,0,.2,1);
    pointer-events: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .h-wheel-wrap, .h-wheel-wrap.is-hidden, .h-domhero-wrap, .h-domhero-wrap.is-hidden { transition: opacity 0.2s ease; transform: none; }
  }
  .h-domhero {
    position: relative; min-height: 52vh; display: flex; flex-direction: column;
    justify-content: center; padding: 40px 24px 48px; overflow: hidden; width: 100%;
  }
  .h-domhero-glow {
    position: absolute; top: 42%; left: 68%; width: 60vw; height: 60vw;
    max-width: 760px; max-height: 760px; transform: translate(-50%, -50%);
    background: radial-gradient(circle, color-mix(in srgb, var(--dc) 22%, transparent) 0%, color-mix(in srgb, var(--dc) 6%, transparent) 40%, transparent 70%);
    pointer-events: none; z-index: 1;
    animation: hDomGlowIn 1.8s cubic-bezier(.16,1,.3,1) both;
  }
  .h-domhero-emblem {
    position: absolute; top: 50%; right: -4vw; transform: translateY(-50%);
    color: var(--dc); opacity: 0.12; z-index: 1; pointer-events: none;
    animation: hDomEmblemIn 2s cubic-bezier(.16,1,.3,1) both;
  }
  .h-domhero-emblem svg { width: 40vh; height: 40vh; max-width: 380px; max-height: 380px; display: block; }
  .h-domhero-scrim {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background: linear-gradient(90deg, var(--h-bg) 14%, transparent 66%); opacity: 0.85;
  }
  .h-domhero-inner { position: relative; z-index: 3; max-width: 720px; margin: 0 auto; width: 100%; }
  .h-domhero-back {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-jetbrains, 'JetBrains Mono', monospace); font-size: 11px; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--h-text3); background: none; border: none; cursor: pointer;
    padding: 0; margin-bottom: 28px; transition: color 0.2s, transform 0.2s;
    animation: hDomRise 0.7s cubic-bezier(.16,1,.3,1) both; animation-delay: .03s;
  }
  .h-domhero-back:hover { color: var(--dc); transform: translateX(-3px); }
  .h-domhero-kicker {
    font-family: var(--font-jetbrains, 'JetBrains Mono', monospace); font-size: 11px; letter-spacing: 0.26em;
    text-transform: uppercase; color: var(--dc); margin-bottom: 18px;
    animation: hDomRise 0.8s cubic-bezier(.16,1,.3,1) both; animation-delay: .1s;
  }
  .h-domhero-title {
    font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-style: italic; font-weight: 500;
    font-size: clamp(38px, 6vw, 64px); line-height: 1; color: var(--h-text); margin: 0 0 18px;
    animation: hDomRise 0.9s cubic-bezier(.16,1,.3,1) both; animation-delay: .18s;
  }
  .h-domhero-desc {
    font-family: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif); font-style: italic;
    font-size: clamp(16px, 1.8vw, 19px); color: var(--h-text2); line-height: 1.6; max-width: 520px; margin: 0 0 26px;
    animation: hDomRise 0.95s cubic-bezier(.16,1,.3,1) both; animation-delay: .28s;
  }
  .h-domhero-meta {
    font-family: var(--font-jetbrains, 'JetBrains Mono', monospace); font-size: 11px; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--h-text3);
    animation: hDomRise 1s cubic-bezier(.16,1,.3,1) both; animation-delay: .38s;
  }
  .h-domhero-meta b { color: var(--dc); }
  @keyframes hDomRise    { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes hDomGlowIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes hDomEmblemIn{ from { opacity: 0; transform: translateY(-50%) scale(0.88); } to { opacity: 0.12; transform: translateY(-50%) scale(1); } }
  @media (max-width: 700px) {
    .h-domhero { min-height: 40vh; padding: 28px 20px 36px; }
    .h-domhero-emblem svg { width: 60vw; height: 60vw; }
  }
  @media (max-width: 1080px) {
    .h-hub-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
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
  const glyph = pickHubIcon(hub.title, hub.domain, index);
  const description = hubCardDescription(hub.id, hub.excerpt);
  return (
    <Link href={`/hub/${hub.id}`} className="h-card">
      <span style={{
        fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
        fontSize: 11, color, opacity: 0.7, letterSpacing: "0.2em",
        marginBottom: 16, fontVariantNumeric: "tabular-nums",
      }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 style={{
        fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
        fontSize: 26, color: "var(--h-text)", lineHeight: 1.28, fontWeight: 400,
        margin: "0 0 22px", maxWidth: 260,
      }}>
        {hub.title}
      </h3>
      <div className="h-icon-halo" style={{ "--dc": color } as React.CSSProperties}>
        <div className="h-icon-halo-ring" />
        <div className="h-icon-halo-fill"><span>{glyph}</span></div>
      </div>
      {description && (
        <p style={{
          fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: 17, color: "var(--h-text2)", lineHeight: 1.6,
          fontStyle: "italic", margin: "20px 0 22px", maxWidth: 280,
        }}>
          {description}
        </p>
      )}
      {hub.covers > 0 && (
        <div style={{
          fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
          fontSize: 11, color: "var(--h-text3)", letterSpacing: "0.16em", marginTop: "auto", paddingTop: 6,
        }}>
          {hub.covers} concepts
        </div>
      )}
    </Link>
  );
}

export default function HubsCompassRose({ hubs, ungrouped = [] }: { hubs: SlimHub[]; ungrouped?: UngroupedConcept[] }) {
  const searchParams = useSearchParams();
  const [selected,      setSelected]      = useState<string | null>(null);
  const [lastDomain,    setLastDomain]    = useState<string | null>(null);
  const [hovered,       setHovered]       = useState<string | null>(null);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [paletteKey,    setPaletteKey]    = useState<PaletteKey>("ember");
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Sync palette from data-theme + localStorage; watch data-theme changes
  useEffect(() => {
    const sync = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      if (theme === "sepia") { setPaletteKey("sepia"); return; }
      try {
        const saved = localStorage.getItem("nylus-hub-palette") as PaletteKey | null;
        if (saved && saved in HUB_PALETTES && saved !== "sepia") setPaletteKey(saved);
        else setPaletteKey("ember");
      } catch { setPaletteKey("ember"); }
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  function cyclePalette() {
    const next = PALETTE_ORDER[(PALETTE_ORDER.indexOf(paletteKey) + 1) % PALETTE_ORDER.length];
    setPaletteKey(next);
    localStorage.setItem("nylus-hub-palette", next);
  }

  const P = HUB_PALETTES[paletteKey];

  // Pre-select domain from ?domain= URL param on mount
  useEffect(() => {
    const domainParam = searchParams.get("domain");
    if (domainParam && DOMAIN_META.some(d => d.key === domainParam)) {
      setSelected(domainParam);
    }
  }, [searchParams]);

  const byDomain = useMemo(() => {
    const map: Record<string, SlimHub[]> = {};
    for (const d of DOMAIN_META) map[d.key] = [];
    for (const h of hubs) { if (map[h.domain]) map[h.domain].push(h); }
    return map;
  }, [hubs]);

  const ungroupedByDomain = useMemo(() => {
    const map: Record<string, UngroupedConcept[]> = {};
    for (const c of ungrouped) {
      if (!map[c.domain]) map[c.domain] = [];
      map[c.domain].push(c);
    }
    return map;
  }, [ungrouped]);

  // Keep the last-selected domain around after deselect so the hero can play
  // its exit transition instead of unmounting instantly.
  useEffect(() => {
    if (selected) setLastDomain(selected);
  }, [selected]);
  const heroKey           = selected ?? lastDomain;

  const activeKey        = hovered ?? selected;
  const activeDomain     = DOMAIN_META.find(d => d.key === activeKey) ?? null;
  const activeColor      = activeDomain?.color ?? null;
  const listDomain       = DOMAIN_META.find(d => d.key === heroKey) ?? null;
  const activeHubs       = heroKey ? (byDomain[heroKey] ?? []) : [];
  const activeUngrouped  = heroKey ? (ungroupedByDomain[heroKey] ?? []) : [];

  return (
    <div className="hubs-page" style={{
      minHeight: "100vh", background: P.bg, display: "flex", flexDirection: "column",
      // Inject palette as CSS vars so all children using var(--h-*) pick them up
      ["--h-bg" as string]:          P.bg,
      ["--h-bg2" as string]:         P.bg2,
      ["--h-bg3" as string]:         P.bg3,
      ["--h-border" as string]:      P.border,
      ["--h-text" as string]:        P.text,
      ["--h-text2" as string]:       P.text2,
      ["--h-text3" as string]:       P.text3,
      ["--h-gold" as string]:        P.gold,
      ["--h-rake" as string]:        P.rake,
      ["--h-arm" as string]:         P.arm,
      ["--h-stone-bg" as string]:    P.stoneBg,
      ["--h-center-ring" as string]: P.centerRing,
      ["--h-label" as string]:       P.text2,
    }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <NavG active="Hubs" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>

        <header style={{ padding: "32px 0 4px", textAlign: "center", position: "relative", width: "100%", maxWidth: 720 }}>
          <p style={{
            fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
            fontSize: 9, letterSpacing: "0.3em", color: "var(--h-text3)",
            textTransform: "uppercase", margin: "0 0 6px",
          }}>Maps of Content</p>
          <h1 style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: 28, fontWeight: 300, fontStyle: "italic",
            color: "var(--h-text)", letterSpacing: "0.08em", margin: 0,
          }}>The Hubs</h1>

          {/* Palette cycle button — hidden in sepia (sepia is set by NavG theme toggle) */}
          {paletteKey !== "sepia" && (
            <button
              onClick={cyclePalette}
              style={{
                position: "absolute", top: 28, right: 24,
                fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
                fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
                color: P.gold, background: "transparent",
                border: `0.5px solid ${P.gold}44`,
                borderRadius: 4, padding: "5px 10px",
                cursor: "pointer", transition: "border-color 0.2s, color 0.2s",
                opacity: 0.7,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
              title="Cycle palette"
            >
              {P.name}
            </button>
          )}
        </header>

        {/* Vault search */}
        <div style={{ width: "100%", maxWidth: 480, padding: "0 24px 8px", boxSizing: "border-box" }}>
          <VaultSearch
            placeholder="Search the vault…"
            showTypes={['concept', 'hub', 'collision', 'spark', 'source']}
            colors={{
              bg:      P.bg2,
              border:  P.border,
              ink:     P.text,
              ink2:    P.text2,
              card:    P.bg3,
              cardHov: P.stoneBg,
            }}
          />
        </div>

        <div className={`h-wheel-wrap${selected ? " is-hidden" : ""}`} aria-hidden={!!selected}>
        <svg viewBox="0 0 640 520" style={{ width: "100%", maxWidth: 720, display: "block" }}
          xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Compass rose — 8 knowledge domains">
          <defs>
            <pattern id="h-rake" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(22)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="var(--h-rake)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="640" height="520" fill="var(--h-bg)" />
          <rect width="640" height="520" fill="url(#h-rake)" />
          <DharmaBackground activeColor={activeColor} />
          <circle cx={CX} cy={CY} r={36} fill="none" stroke="var(--h-center-ring)" strokeWidth={0.6} />
          <circle cx={CX} cy={CY} r={24} fill="none" stroke="var(--h-center-ring)" strokeWidth={0.5} />
          <circle cx={CX} cy={CY} r={12} fill="var(--h-stone-bg)" stroke="var(--h-gold)" strokeWidth={1} />
          <text x={CX} y={CY + 4} textAnchor="middle"
            fontFamily="var(--font-cormorant,'Cormorant Garamond',Georgia,serif)"
            fontSize={8} fill="var(--h-gold)" letterSpacing="0.22em">NYL</text>

          {DOMAIN_META.map((d) => {
            const tip      = polar(CX, CY, ARM, d.angle);
            const labelPos = polar(CX, CY, LABEL_R, d.angle);
            const isOn     = selected === d.key;
            const isDimmed = !!selected && !isOn;
            const cosA     = Math.cos((d.angle * Math.PI) / 180);
            const anchor   = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
            const domHubs  = byDomain[d.key] ?? [];
            return (
              <g key={d.key}
                onClick={() => { setSelected(prev => prev === d.key ? null : d.key); setDrawerOpen(false); }}
                onMouseEnter={() => setHovered(d.key)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer", opacity: isDimmed ? 0.25 : 1,
                  transition: "opacity 0.35s cubic-bezier(0.65,0,0.35,1)", touchAction: "manipulation" }}
                role="button" aria-label={`${d.label} — ${domHubs.length} hubs`} aria-pressed={isOn}>

                {/* Arm line — always visible in domain color */}
                <line x1={CX} y1={CY} x2={tip.x} y2={tip.y}
                  stroke={d.color}
                  strokeOpacity={isOn ? 1 : 0.4}
                  strokeWidth={isOn ? 1.8 : 1.1}
                  style={{ transition: "stroke-opacity 0.3s, stroke-width 0.3s" }} />

                {/* Hub dots along the arm when selected */}
                {isOn && domHubs.map((h, i) => {
                  const frac = (i + 1) / (domHubs.length + 1);
                  const pos  = polar(CX, CY, 38 + frac * (ARM - 55), d.angle);
                  return <circle key={h.id} cx={pos.x} cy={pos.y} r={3.5} fill={d.color} opacity={0.75} />;
                })}

                {/* Orb — always filled with domain color */}
                <circle cx={tip.x} cy={tip.y} r={STONE_R}
                  fill={d.color}
                  fillOpacity={isOn ? 1 : 0.28}
                  stroke={d.color}
                  strokeOpacity={isOn ? 0 : 0.9}
                  strokeWidth={1.6}
                  style={{ transition: "fill-opacity 0.25s, stroke-opacity 0.25s" }} />

                {/* Hub count inside orb */}
                <text x={tip.x} y={tip.y + 4} textAnchor="middle"
                  fontFamily="var(--font-jetbrains,'JetBrains Mono',monospace)"
                  fontSize={9} fontWeight="600"
                  fill={isOn ? P.bg : d.color}
                  fillOpacity={isOn ? 1 : 1}
                  style={{ transition: "fill 0.25s" }}>{domHubs.length}</text>

                {/* Domain label outside orb — always bright */}
                <text x={labelPos.x} y={labelPos.y + 4} textAnchor={anchor}
                  fontFamily="var(--font-cormorant,'Cormorant Garamond',Georgia,serif)"
                  fontSize={14} fontWeight={isOn ? "600" : "400"}
                  fill={d.color}
                  fillOpacity={isOn ? 1 : 0.75}
                  letterSpacing="0.04em"
                  style={{ transition: "fill-opacity 0.25s, font-weight 0.25s" }}>{d.short}</text>
              </g>
            );
          })}
        </svg>
        </div>

        {listDomain && (
          <div className={`h-domhero-wrap${!selected ? " is-hidden" : ""}`} aria-hidden={!selected}>
            <div className="h-domhero" style={{ "--dc": listDomain.color } as React.CSSProperties}>
              <div className="h-domhero-glow" aria-hidden />
              <div className="h-domhero-emblem" aria-hidden><DomainEmblem domain={listDomain.key} /></div>
              <div className="h-domhero-scrim" aria-hidden />
              <div className="h-domhero-inner">
                <button className="h-domhero-back" onClick={() => setSelected(null)}>
                  ← All Domains
                </button>
                <div className="h-domhero-kicker">Maps of Content</div>
                <h1 className="h-domhero-title">{listDomain.label}</h1>
                {DOMAIN_DESC[listDomain.key] && (
                  <p className="h-domhero-desc">{DOMAIN_DESC[listDomain.key]}</p>
                )}
                <div className="h-domhero-meta"><b>{activeHubs.length}</b> hub{activeHubs.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
          </div>
        )}

        <section style={{ width: "100%", maxWidth: 1140, padding: "0 24px 80px" }}>
          {!selected && (
            <p style={{ textAlign: "center",
              fontFamily: "var(--font-cormorant,'Cormorant Garamond',Georgia,serif)",
              fontStyle: "italic", fontSize: 15,
              color: "var(--h-text3)", padding: "8px 0 48px" }}>
              Touch a domain arm to reveal its hubs
            </p>
          )}
          {listDomain && activeHubs.length > 0 && (
            <div>
              <div className="h-hub-grid" style={{ display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {activeHubs.map((h, i) => (
                  <HubCard key={h.id} hub={h} index={i} color={listDomain.color} />
                ))}
              </div>
            </div>
          )}

          {/* Ungrouped concepts — safety-net link */}
          {listDomain && (
            <div style={{
              marginTop: 28,
              paddingTop: 18,
              borderTop: `0.5px solid var(--h-border)`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: "none", border: "none", cursor: activeUngrouped.length > 0 ? "pointer" : "default",
                  padding: 0, textDecoration: "none",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)",
                  fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                  color: activeUngrouped.length > 0 ? "var(--h-text3)" : "var(--h-text3)",
                  opacity: activeUngrouped.length > 0 ? 1 : 0.4,
                  transition: "color 0.2s",
                }}>
                  {activeUngrouped.length > 0
                    ? `${activeUngrouped.length} ungrouped concept${activeUngrouped.length !== 1 ? "s" : ""}`
                    : "no ungrouped concepts"}
                </span>
                {activeUngrouped.length > 0 && (
                  <span style={{
                    fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)",
                    fontSize: 13, color: listDomain.color, opacity: 0.7,
                    transition: "transform 0.2s, opacity 0.2s",
                  }}>
                    →
                  </span>
                )}
              </button>

              {activeUngrouped.length === 0 && (
                <span style={{
                  fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)",
                  fontSize: 9, color: listDomain.color, opacity: 0.5,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                }}>
                  ✓ all assigned
                </span>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Orphan drawer */}
      <OrphanDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        domain={listDomain}
        concepts={activeUngrouped}
      />
    </div>
  );
}
