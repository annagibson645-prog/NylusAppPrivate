"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NavG from "./NavG";

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
      </div>
      {hub.excerpt && (
        <p style={{
          fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: 20, color: "var(--h-text2)", lineHeight: 1.65,
          fontStyle: "italic", margin: "0 0 16px",
        }}>
          {hub.excerpt.length > 160 ? hub.excerpt.slice(0, 160) + "\u2026" : hub.excerpt}
        </p>
      )}
      {hub.covers > 0 && (
        <div style={{
          fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
          fontSize: 12, color: "var(--h-text3)", letterSpacing: "0.14em",
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
  const [hovered,       setHovered]       = useState<string | null>(null);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

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

  const activeKey        = hovered ?? selected;
  const activeDomain     = DOMAIN_META.find(d => d.key === activeKey) ?? null;
  const activeColor      = activeDomain?.color ?? null;
  const listDomain       = DOMAIN_META.find(d => d.key === selected) ?? null;
  const activeHubs       = selected ? (byDomain[selected] ?? []) : [];
  const activeUngrouped  = selected ? (ungroupedByDomain[selected] ?? []) : [];

  return (
    <div className="hubs-page" style={{ minHeight: "100vh", background: "var(--h-bg)", display: "flex", flexDirection: "column" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <NavG active="Hubs" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>

        <header style={{ padding: "32px 0 4px", textAlign: "center" }}>
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
        </header>

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
                  fill={isOn ? "#0e0c09" : d.color}
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

        <section style={{ width: "100%", maxWidth: 720, padding: "0 24px 80px" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                borderTop: `1px solid ${listDomain.color}`, paddingTop: 22, marginBottom: 20 }}>
                <h2 style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',Georgia,serif)",
                  fontSize: 24, fontWeight: 400, fontStyle: "italic",
                  color: "var(--h-text)", letterSpacing: "0.05em", margin: 0 }}>
                  {listDomain.label}
                </h2>
                <span style={{ fontFamily: "var(--font-jetbrains,'JetBrains Mono',monospace)",
                  fontSize: 9, color: "var(--h-text3)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  {activeHubs.length} hubs
                </span>
              </div>
              <div className="h-hub-grid" style={{ display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
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
