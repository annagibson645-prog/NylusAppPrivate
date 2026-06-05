// components/council/EmblemPrototypes.tsx
// Three alternative emblem SETS (eye · crown · gears), each in a distinct style,
// for the user to compare and choose. All line-art inherits `currentColor`.
//   Set A — "Engraved Line"   : fine, precise, astrolabe-etched
//   Set B — "Filled Sigil"     : bold, solid, talismanic
//   Set C — "Sacred Geometry"  : constructed from circles & rays
// Gears are drawn clean in every set — bodies never overlap (centers spaced so
// the root circles stay apart; teeth only meet at the mesh point).

import type { SVGProps } from "react";

const base = {
  viewBox: "0 0 200 200",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
};

// Cog outline: alternating tooth-tip (rOuter) and valley (rInner) points.
function cog(cx: number, cy: number, rOuter: number, rInner: number, teeth: number, phase = 0) {
  const steps = teeth * 2;
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2 + phase;
    const r = i % 2 === 0 ? rOuter : rInner;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

function spokes(cx: number, cy: number, r1: number, r2: number, n: number, sw = 1.2, op = 0.5) {
  return (
    <g opacity={op}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <line key={i}
            x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
            strokeWidth={sw} />
        );
      })}
    </g>
  );
}

/* ══════════════════════ SET A — ENGRAVED LINE ══════════════════════ */

export function EyeA(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <g opacity={0.5}>
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return <line key={i}
            x1={100 + Math.cos(a) * 80} y1={100 + Math.sin(a) * 80}
            x2={100 + Math.cos(a) * (i % 2 ? 88 : 94)} y2={100 + Math.sin(a) * (i % 2 ? 88 : 94)}
            strokeWidth={1.3} />;
        })}
      </g>
      <path d="M26 100 Q100 48 174 100 Q100 152 26 100 Z" strokeWidth={2.2} />
      <circle cx="100" cy="100" r="32" strokeWidth={2} />
      <circle cx="100" cy="100" r="21" strokeWidth={1.3} opacity={0.55} />
      <circle cx="100" cy="100" r="10" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CrownA(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M38 140 L52 84 L75 114 L100 68 L125 114 L148 84 L162 140 Z" strokeWidth={2.2} />
      <path d="M46 140 L154 140 L150 160 L50 160 Z" strokeWidth={2.2} />
      <line x1="50" y1="150" x2="150" y2="150" strokeWidth={1.1} opacity={0.5} />
      <circle cx="52" cy="84" r="4.5" fill="currentColor" stroke="none" />
      <circle cx="100" cy="66" r="6" fill="currentColor" stroke="none" />
      <circle cx="148" cy="84" r="4.5" fill="currentColor" stroke="none" />
      <g opacity={0.75}>
        <path d="M100 40 L102 50 L100 60 L98 50 Z" fill="currentColor" stroke="none" />
        <path d="M90 50 L100 52 L110 50 L100 48 Z" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function GearsA(p: SVGProps<SVGSVGElement>) {
  // Two meshing cogs, centers far enough apart that the root circles never overlap.
  return (
    <svg {...base} {...p}>
      <g>
        <path d={cog(74, 84, 44, 36, 12)} strokeWidth={2.2} />
        <circle cx="74" cy="84" r="15" strokeWidth={1.8} />
        <circle cx="74" cy="84" r="4" fill="currentColor" stroke="none" />
        {spokes(74, 84, 6, 14, 6, 1.1, 0.45)}
      </g>
      <g>
        <path d={cog(135, 132, 30, 24, 9, 0.32)} strokeWidth={2} />
        <circle cx="135" cy="132" r="10" strokeWidth={1.6} />
        <circle cx="135" cy="132" r="3" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/* ══════════════════════ SET B — FILLED SIGIL ══════════════════════ */

export function EyeB(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      {/* sun rays — filled slivers */}
      <g>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const x = 100 + Math.cos(a), y = 100 + Math.sin(a);
          const ox = Math.cos(a), oy = Math.sin(a);
          const px = -oy, py = ox;
          const inr = 78, out = 94, w = 3;
          return <path key={i}
            d={`M${100 + ox * inr + px * w} ${100 + oy * inr + py * w}
                L${100 + ox * out} ${100 + oy * out}
                L${100 + ox * inr - px * w} ${100 + oy * inr - py * w} Z`}
            fill="currentColor" stroke="none" opacity={i % 2 ? 0.4 : 0.8} />;
        })}
      </g>
      <path d="M24 100 Q100 46 176 100 Q100 154 24 100 Z" strokeWidth={2.6}
        fill="currentColor" fillOpacity={0.12} />
      <circle cx="100" cy="100" r="30" strokeWidth={2.2} fill="currentColor" fillOpacity={0.10} />
      <circle cx="100" cy="100" r="13" fill="currentColor" stroke="none" />
      <circle cx="105" cy="94" r="3.4" fill="var(--emblem-bg, #0e0d14)" stroke="none" />
    </svg>
  );
}

export function CrownB(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M34 142 L50 78 L76 112 L100 60 L124 112 L150 78 L166 142 Z"
        strokeWidth={2.6} fill="currentColor" fillOpacity={0.16} />
      <path d="M42 142 L158 142 L154 166 L46 166 Z"
        strokeWidth={2.6} fill="currentColor" fillOpacity={0.16} />
      <circle cx="50" cy="78" r="6" fill="currentColor" stroke="none" />
      <circle cx="100" cy="58" r="8" fill="currentColor" stroke="none" />
      <circle cx="150" cy="78" r="6" fill="currentColor" stroke="none" />
      <circle cx="72" cy="154" r="4.5" fill="var(--emblem-bg, #0e0d14)" stroke="currentColor" strokeWidth={1.4} />
      <circle cx="100" cy="154" r="4.5" fill="var(--emblem-bg, #0e0d14)" stroke="currentColor" strokeWidth={1.4} />
      <circle cx="128" cy="154" r="4.5" fill="var(--emblem-bg, #0e0d14)" stroke="currentColor" strokeWidth={1.4} />
    </svg>
  );
}

export function GearsB(p: SVGProps<SVGSVGElement>) {
  // One bold cog — no overlap possible, maximally legible.
  return (
    <svg {...base} {...p}>
      <path d={cog(100, 100, 62, 50, 12)} strokeWidth={2.6} fill="currentColor" fillOpacity={0.12} />
      <circle cx="100" cy="100" r="30" strokeWidth={2.4} fill="currentColor" fillOpacity={0.08} />
      <circle cx="100" cy="100" r="9" fill="currentColor" stroke="none" />
      {spokes(100, 100, 12, 28, 6, 2, 0.6)}
    </svg>
  );
}

/* ══════════════════════ SET C — SACRED GEOMETRY ══════════════════════ */

export function EyeC(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M100 34 L170 154 L30 154 Z" strokeWidth={1.6} opacity={0.5} />
      <circle cx="100" cy="118" r="62" strokeWidth={1} opacity={0.18} />
      <path d="M44 116 Q100 80 156 116 Q100 152 44 116 Z" strokeWidth={2} />
      <circle cx="100" cy="116" r="20" strokeWidth={1.6} />
      <circle cx="100" cy="116" r="20" strokeWidth={1.1} strokeDasharray="2 4" opacity={0.6} />
      <circle cx="100" cy="116" r="7" fill="currentColor" stroke="none" />
      <g opacity={0.55}>
        <line x1="100" y1="34" x2="100" y2="58" strokeWidth={1.2} />
        <line x1="82" y1="40" x2="90" y2="60" strokeWidth={1.2} />
        <line x1="118" y1="40" x2="110" y2="60" strokeWidth={1.2} />
      </g>
    </svg>
  );
}

export function CrownC(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      {/* radiant burst */}
      <g opacity={0.6}>
        {Array.from({ length: 7 }).map((_, i) => {
          const a = -Math.PI / 2 + (i - 3) * 0.26;
          return <line key={i}
            x1={100 + Math.cos(a) * 30} y1={56 + Math.sin(a) * 30}
            x2={100 + Math.cos(a) * 44} y2={56 + Math.sin(a) * 44} strokeWidth={1.3} />;
        })}
      </g>
      {/* three ascending chevrons */}
      <path d="M60 138 L84 104 L108 138" strokeWidth={2} />
      <path d="M76 138 L100 92 L124 138" strokeWidth={2.2} />
      <path d="M92 138 L116 104 L140 138" strokeWidth={2} />
      <circle cx="84" cy="100" r="3.5" fill="currentColor" stroke="none" />
      <circle cx="100" cy="86" r="4.5" fill="currentColor" stroke="none" />
      <circle cx="116" cy="100" r="3.5" fill="currentColor" stroke="none" />
      {/* base arc */}
      <path d="M48 142 Q100 156 152 142" strokeWidth={2} />
      <path d="M52 150 Q100 162 148 150" strokeWidth={1.2} opacity={0.5} />
    </svg>
  );
}

export function GearsC(p: SVGProps<SVGSVGElement>) {
  // Astrolabe cog: a single ornate geometric gear — concentric rings, bolt dots,
  // an inner cog. A small satellite sits in the corner with a CLEAR gap (its tip
  // and the main gear's tip never meet). Nothing overlaps.
  return (
    <svg {...base} {...p}>
      {/* main astrolabe gear, centered */}
      <g>
        <path d={cog(94, 98, 52, 45, 18)} strokeWidth={1.8} />
        <circle cx="94" cy="98" r="37" strokeWidth={1.2} opacity={0.55} />
        <circle cx="94" cy="98" r="23" strokeWidth={1.6} />
        {/* inner toothed core */}
        <path d={cog(94, 98, 16, 11, 8)} strokeWidth={1.3} opacity={0.8} />
        <circle cx="94" cy="98" r="5" fill="currentColor" stroke="none" />
        {/* bolt dots on the mid ring */}
        <g>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
            return <circle key={i} cx={94 + Math.cos(a) * 30} cy={98 + Math.sin(a) * 30} r={1.7}
              fill="currentColor" stroke="none" opacity={0.65} />;
          })}
        </g>
      </g>
      {/* small satellite gear, lower-right, set well clear of the main gear */}
      <g opacity={0.9}>
        <path d={cog(159, 159, 19, 14, 8)} strokeWidth={1.5} />
        <circle cx="159" cy="159" r="6.5" strokeWidth={1.2} />
        <circle cx="159" cy="159" r="2.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/* ─── HAMMER — Craftsmanship (replaces gears) ───────────────────────────────
   An upright emblematic smith's hammer: mallet head + handle, set inside a faint
   geometric halo with forge-spark ticks above. Matches the line-art family. */
export function HammerC(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      {/* geometric halo */}
      <circle cx="100" cy="106" r="80" strokeWidth={1} opacity={0.13} />
      <circle cx="100" cy="106" r="60" strokeWidth={0.8} opacity={0.1} />
      {/* forge sparks above the head */}
      <g opacity={0.6}>
        {[-0.5, -0.2, 0, 0.2, 0.5].map((t, i) => {
          const a = -Math.PI / 2 + t;
          return (
            <line key={i}
              x1={100 + Math.cos(a) * 30} y1={74 + Math.sin(a) * 30}
              x2={100 + Math.cos(a) * 42} y2={74 + Math.sin(a) * 42}
              strokeWidth={1.4} />
          );
        })}
      </g>
      {/* hammer head — mallet, rounded */}
      <path
        d="M64 64 H136 a9 9 0 0 1 9 9 V93 a9 9 0 0 1 -9 9 H64 a9 9 0 0 1 -9 -9 V73 a9 9 0 0 1 9 -9 Z"
        strokeWidth={2.4} fill="currentColor" fillOpacity={0.08} />
      {/* head banding */}
      <line x1="78" y1="66" x2="78" y2="100" strokeWidth={1.2} opacity={0.45} />
      <line x1="122" y1="66" x2="122" y2="100" strokeWidth={1.2} opacity={0.45} />
      {/* collar */}
      <path d="M90 102 H110 V108 H90 Z" strokeWidth={1.6} fill="currentColor" fillOpacity={0.1} />
      {/* handle */}
      <path
        d="M94 108 H106 V162 a6 6 0 0 1 -6 6 a6 6 0 0 1 -6 -6 Z"
        strokeWidth={2.4} fill="currentColor" fillOpacity={0.06} />
      {/* grip bands */}
      <line x1="94" y1="146" x2="106" y2="146" strokeWidth={1.2} opacity={0.5} />
      <line x1="94" y1="153" x2="106" y2="153" strokeWidth={1.2} opacity={0.5} />
    </svg>
  );
}

export interface EmblemSet {
  id: string;
  name: string;
  note: string;
  eye: (p: SVGProps<SVGSVGElement>) => React.JSX.Element;
  crown: (p: SVGProps<SVGSVGElement>) => React.JSX.Element;
  gears: (p: SVGProps<SVGSVGElement>) => React.JSX.Element;
}

export const EMBLEM_SETS: EmblemSet[] = [
  { id: "A", name: "Engraved Line", note: "Fine, precise, astrolabe-etched — closest to the current set, refined.", eye: EyeA, crown: CrownA, gears: GearsA },
  { id: "B", name: "Filled Sigil", note: "Bold, solid, talismanic. Gears reduced to one clean cog.", eye: EyeB, crown: CrownB, gears: GearsB },
  { id: "C", name: "Sacred Geometry", note: "Constructed from circles & rays — esoteric. Gears as an astrolabe with a satellite.", eye: EyeC, crown: CrownC, gears: GearsC },
];
