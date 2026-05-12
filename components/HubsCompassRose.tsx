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

// ─── Domain config: angle in degrees (0 = right/East, -90 = top/North) ───────

const DOMAIN_META = [
  { key: "psychology",            label: "Psychology",           short: "Psychology",    color: "#f59e0b", angle: -90  },
  { key: "history",               label: "History",              short: "History",       color: "#e6c068", angle: -45  },
  { key: "cross-domain",          label: "Cross-Domain",         short: "Cross-Domain",  color: "#5fc9a8", angle: 0    },
  { key: "behavioral-mechanics",  label: "Behavioral Mechanics", short: "Behavioral",    color: "#a78bfa", angle: 45   },
  { key: "eastern-spirituality",  label: "Eastern Spirituality", short: "Eastern",       color: "#7c8df0", angle: 90   },
  { key: "creative-practice",     label: "Creative Practice",    short: "Creative",      color: "#ef5a6f", angle: 135  },
  { key: "ai-collaboration",      label: "AI Collaboration",     short: "AI Collab.",    color: "#9ca3af", angle: 180  },
  { key: "african-spirituality",  label: "African Spirituality", short: "African",       color: "#34d399", angle: -135 },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function toRoman(n: number): string {
  const table: [number, string][] = [
    [20, "XX"], [19, "XIX"], [18, "XVIII"], [17, "XVII"], [16, "XVI"],
    [15, "XV"], [14, "XIV"], [13, "XIII"], [12, "XII"], [11, "XI"],
    [10, "X"],  [9, "IX"],  [8, "VIII"],  [7, "VII"],  [6, "VI"],
    [5, "V"],   [4, "IV"],  [3, "III"],   [2, "II"],   [1, "I"],
  ];
  for (const [v, s] of table) { if (n >= v) return s; }
  return String(n);
}

// ─── SVG constants ────────────────────────────────────────────────────────────

const CX      = 320;   // compass centre x
const CY      = 258;   // compass centre y
const ARM     = 175;   // arm length
const STONE_R = 11;    // domain stone default radius
const LABEL_R = ARM + 26; // label distance from centre

// ─── Sub-components ───────────────────────────────────────────────────────────

function HubCard({ hub, index, color }: { hub: SlimHub; index: number; color: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={`/hub/${hub.id}`}
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: hovered ? "#211c14" : "#161210",
        border: "1px solid #2a2218",
        borderLeft: `2px solid ${color}`,
        padding: "14px 16px",
        transition: "background 0.2s",
        height: "100%",
      }}>
        {/* Roman numeral + title */}
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
          <span style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: 10, color, opacity: 0.5,
            minWidth: 20, flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
          }}>
            {toRoman(index + 1)}.
          </span>
          <span style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: 15, color: "#e0d4c0", lineHeight: 1.35,
          }}>
            {hub.title}
          </span>
        </div>

        {/* Excerpt */}
        {hub.excerpt && (
          <p style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: 12, color: "#4a4038", lineHeight: 1.5,
            fontStyle: "italic", margin: "0 0 6px",
          }}>
            {hub.excerpt.length > 90 ? hub.excerpt.slice(0, 90) + "…" : hub.excerpt}
          </p>
        )}

        {/* Concept count */}
        {hub.covers > 0 && (
          <div style={{
            fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
            fontSize: 9, color: "#3a3028", letterSpacing: "0.12em",
          }}>
            {hub.covers} concepts
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HubsCompassRose({ hubs }: { hubs: SlimHub[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const byDomain = useMemo(() => {
    const map: Record<string, SlimHub[]> = {};
    for (const d of DOMAIN_META) map[d.key] = [];
    for (const h of hubs) {
      if (map[h.domain]) map[h.domain].push(h);
    }
    return map;
  }, [hubs]);

  const activeDomain = DOMAIN_META.find(d => d.key === selected) ?? null;
  const activeHubs   = selected ? (byDomain[selected] ?? []) : [];

  function toggle(key: string) {
    setSelected(prev => (prev === key ? null : key));
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0e0c09",
      display: "flex",
      flexDirection: "column",
    }}>
      <NavG active="Hubs" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* ── Page header ── */}
        <header style={{ padding: "28px 0 0", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
            fontSize: 9, letterSpacing: "0.3em", color: "#3a3028",
            textTransform: "uppercase", margin: "0 0 6px",
          }}>
            Maps of Content
          </p>
          <h1 style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: 26, fontWeight: 300, fontStyle: "italic",
            color: "#e8dcc8", letterSpacing: "0.08em", margin: 0,
          }}>
            The Hubs
          </h1>
        </header>

        {/* ── Compass SVG ── */}
        <svg
          viewBox="0 0 640 520"
          style={{ width: "100%", maxWidth: 700, display: "block" }}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Compass rose map of 8 knowledge domains"
        >
          <defs>
            {/* Raked-sand background */}
            <pattern id="h-rake" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(22)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="#1a1510" strokeWidth="0.8" />
            </pattern>
          </defs>

          <rect width="640" height="520" fill="url(#h-rake)" />

          {/* Decorative centre rings */}
          <circle cx={CX} cy={CY} r={32} fill="none" stroke="#231e15" strokeWidth="0.6" />
          <circle cx={CX} cy={CY} r={22} fill="none" stroke="#231e15" strokeWidth="0.5" />
          <circle cx={CX} cy={CY} r={11} fill="#161210" stroke="#c8a040" strokeWidth="1" />
          <text
            x={CX} y={CY + 4}
            textAnchor="middle"
            fontFamily="var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)"
            fontSize={8}
            fill="#c8a040"
            letterSpacing="0.22em"
          >
            NYL
          </text>

          {DOMAIN_META.map((d) => {
            const tip      = polar(CX, CY, ARM, d.angle);
            const labelPos = polar(CX, CY, LABEL_R, d.angle);
            const isOn     = selected === d.key;
            const isDimmed = !!selected && !isOn;
            const cosA     = Math.cos((d.angle * Math.PI) / 180);
            const anchor   = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
            const domHubs  = byDomain[d.key] ?? [];

            return (
              <g
                key={d.key}
                onClick={() => toggle(d.key)}
                style={{
                  cursor: "pointer",
                  opacity: isDimmed ? 0.1 : 1,
                  transition: "opacity 0.35s cubic-bezier(0.65,0,0.35,1)",
                }}
                role="button"
                aria-label={`${d.label} — ${domHubs.length} hubs`}
              >
                {/* Arm line */}
                <line
                  x1={CX} y1={CY}
                  x2={tip.x} y2={tip.y}
                  stroke={isOn ? d.color : "#2c2418"}
                  strokeWidth={isOn ? 0.9 : 0.6}
                  style={{ transition: "stroke 0.3s" }}
                />

                {/* Hub dots along arm when active */}
                {isOn && domHubs.map((h, i) => {
                  const frac = (i + 1) / (domHubs.length + 1);
                  const pos  = polar(CX, CY, 36 + frac * (ARM - 50), d.angle);
                  return (
                    <circle
                      key={h.id}
                      cx={pos.x} cy={pos.y} r={3}
                      fill={d.color} opacity={0.55}
                    />
                  );
                })}

                {/* Domain stone */}
                <circle
                  cx={tip.x} cy={tip.y}
                  r={isOn ? 14 : STONE_R}
                  fill={isOn ? d.color : "#161210"}
                  stroke={d.color}
                  strokeWidth={1.2}
                  style={{ transition: "r 0.25s, fill 0.25s" }}
                />

                {/* Hub count badge when not active */}
                {!isOn && (
                  <text
                    x={tip.x} y={tip.y + 4}
                    textAnchor="middle"
                    fontFamily="var(--font-jetbrains, 'JetBrains Mono', monospace)"
                    fontSize={7}
                    fill={d.color}
                    opacity={0.6}
                  >
                    {domHubs.length}
                  </text>
                )}

                {/* Domain label */}
                <text
                  x={labelPos.x}
                  y={labelPos.y + 4}
                  textAnchor={anchor}
                  fontFamily="var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)"
                  fontSize={11}
                  fill={isOn ? d.color : "#6a5e50"}
                  letterSpacing="0.06em"
                  style={{ transition: "fill 0.25s" }}
                >
                  {d.short}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Hub codex list ── */}
        <section style={{ width: "100%", maxWidth: 700, padding: "0 24px 64px" }}>

          {/* Idle hint */}
          {!selected && (
            <p style={{
              textAlign: "center",
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontStyle: "italic", fontSize: 14,
              color: "#3a3028", padding: "4px 0 48px",
            }}>
              Select a domain arm to reveal its hubs
            </p>
          )}

          {/* Active domain hub list */}
          {activeDomain && activeHubs.length > 0 && (
            <div>
              {/* Domain heading */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderTop: `1px solid ${activeDomain.color}`,
                paddingTop: 20,
                marginBottom: 18,
              }}>
                <h2 style={{
                  fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: 22, fontWeight: 400, fontStyle: "italic",
                  color: "#e8dcc8", letterSpacing: "0.05em", margin: 0,
                }}>
                  {activeDomain.label}
                </h2>
                <span style={{
                  fontFamily: "var(--font-jetbrains, 'JetBrains Mono', monospace)",
                  fontSize: 9, color: "#5a5048", letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}>
                  {activeHubs.length} hubs
                </span>
              </div>

              {/* Hub cards grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 10,
              }}>
                {activeHubs.map((h, i) => (
                  <HubCard key={h.id} hub={h} index={i} color={activeDomain.color} />
                ))}
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
