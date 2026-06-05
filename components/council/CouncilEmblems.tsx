// components/council/CouncilEmblems.tsx
// The three council emblems, as line-art SVGs that inherit `currentColor`.
// Designed to read clearly at very large sizes and low opacity behind a title.
// Each accepts standard SVG props (className, style) so prototypes can size,
// color and animate them however they like. The internal `data-*` parts let
// CSS target sub-elements (iris, gems, hammer, pen) for richer motion.

import type { SVGProps } from "react";
// Chosen emblem set (user picks): Eye → A, Crown → B, Craftsmanship → Hammer.
import { EyeA, CrownB, GearsC, HammerC } from "./EmblemPrototypes";

const baseProps = {
  viewBox: "0 0 200 200",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
};

/* ─── EYE — Influence ─────────────────────────────────────────────────────── */
export function EyeEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      {/* radiating lashes / rays */}
      <g data-part="rays" opacity={0.55}>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const r1 = 78;
          const r2 = i % 2 === 0 ? 94 : 88;
          const cx = 100, cy = 100;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * r1}
              y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2}
              y2={cy + Math.sin(a) * r2}
              strokeWidth={1.4}
            />
          );
        })}
      </g>
      {/* almond eye */}
      <path d="M30 100 Q100 46 170 100 Q100 154 30 100 Z" strokeWidth={2.4} />
      {/* iris */}
      <circle data-part="iris" cx="100" cy="100" r="30" strokeWidth={2.2} />
      {/* iris striations */}
      <g data-part="iris-lines" opacity={0.7}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 13}
              y1={100 + Math.sin(a) * 13}
              x2={100 + Math.cos(a) * 28}
              y2={100 + Math.sin(a) * 28}
              strokeWidth={1.2}
            />
          );
        })}
      </g>
      {/* pupil */}
      <circle data-part="pupil" cx="100" cy="100" r="11" fill="currentColor" stroke="none" />
      <circle cx="105" cy="94" r="3.4" fill="var(--emblem-bg, #0e0d14)" stroke="none" opacity={0.9} />
    </svg>
  );
}

/* ─── CROWN — Sovereignty ─────────────────────────────────────────────────── */
export function CrownEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      {/* crown body: five points rising to jeweled tips */}
      <path
        data-part="crown-body"
        d="M34 138
           L46 74 L72 110 L100 58 L128 110 L154 74 L166 138 Z"
        strokeWidth={2.6}
      />
      {/* base band */}
      <path d="M40 138 L160 138 L156 160 L44 160 Z" strokeWidth={2.6} />
      <line x1="44" y1="149" x2="156" y2="149" strokeWidth={1.4} opacity={0.6} />
      {/* jewels at each peak */}
      <g data-part="gems">
        <circle cx="46" cy="74" r="6" fill="currentColor" stroke="none" />
        <circle cx="100" cy="56" r="8" fill="currentColor" stroke="none" />
        <circle cx="154" cy="74" r="6" fill="currentColor" stroke="none" />
      </g>
      {/* band jewels */}
      <g data-part="band-gems" opacity={0.85}>
        <circle cx="70" cy="149" r="3.5" />
        <circle cx="100" cy="149" r="3.5" />
        <circle cx="130" cy="149" r="3.5" />
      </g>
      {/* small star above center, the sovereign light */}
      <g data-part="star" opacity={0.8}>
        <path d="M100 30 L102.5 40 L100 50 L97.5 40 Z" fill="currentColor" stroke="none" />
        <path d="M88 40 L98 42.5 L108 40 L98 37.5 Z" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/* ─── HAMMER × FOUNTAIN PEN — Craftsmanship ──────────────────────────────────
   A hammer (left) facing a fountain pen (right), tips meeting at the center —
   physical craft and writing craft about to strike the same point. */
export function HammerPenEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      {/* faint convergence ring at the meeting point */}
      <circle cx="100" cy="100" r="20" strokeWidth={1.2} opacity={0.4} data-part="spark" />

      {/* ── Hammer, left, head toward center ── */}
      <g data-part="hammer">
        {/* handle from lower-left up toward center */}
        <line x1="40" y1="158" x2="92" y2="106" strokeWidth={6} />
        {/* hammer head */}
        <path
          d="M78 92 L106 64 L120 78 L92 106 Z"
          strokeWidth={2.4}
          fill="currentColor"
          fillOpacity={0.12}
        />
        {/* claw */}
        <path d="M106 64 L114 56 M120 78 L128 70" strokeWidth={2.4} />
      </g>

      {/* ── Fountain pen, right, nib toward center ── */}
      <g data-part="pen">
        {/* barrel from upper-right down toward center */}
        <line x1="160" y1="42" x2="112" y2="90" strokeWidth={6} />
        {/* grip / collar */}
        <line x1="124" y1="78" x2="134" y2="68" strokeWidth={9} opacity={0.5} />
        {/* nib */}
        <path
          d="M112 90 L100 102 L108 110 L120 98 Z"
          strokeWidth={2.2}
          fill="currentColor"
          fillOpacity={0.12}
        />
        {/* nib slit + breather hole */}
        <line x1="104" y1="98" x2="113" y2="107" strokeWidth={1.6} />
        <circle cx="112" cy="92" r="2.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/* ─── GEARS — Craftsmanship ──────────────────────────────────────────────────
   Two interlocking gears — the machinery of making. `data-part="gear-a"` /
   `data-part="gear-b"` let CSS spin them in opposite directions if desired. */
function gearPath(cx: number, cy: number, rOuter: number, rInner: number, teeth: number) {
  // Build a cog outline: alternating outer (tooth tip) and inner (valley) points.
  const steps = teeth * 2;
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

export function GearsEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      {/* large gear, upper-left */}
      <g data-part="gear-a">
        <path d={gearPath(78, 80, 52, 43, 12)} strokeWidth={2.4} fill="currentColor" fillOpacity={0.06} />
        <circle cx="78" cy="80" r="16" strokeWidth={2.2} />
        <circle cx="78" cy="80" r="4.5" fill="currentColor" stroke="none" />
        {/* inner spokes */}
        <g opacity={0.5}>
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <line key={i}
                x1={78 + Math.cos(a) * 6} y1={80 + Math.sin(a) * 6}
                x2={78 + Math.cos(a) * 15} y2={80 + Math.sin(a) * 15}
                strokeWidth={1.2} />
            );
          })}
        </g>
      </g>
      {/* smaller gear, lower-right, meshing with the first */}
      <g data-part="gear-b">
        <path d={gearPath(132, 130, 38, 31, 10)} strokeWidth={2.2} fill="currentColor" fillOpacity={0.06} />
        <circle cx="132" cy="130" r="12" strokeWidth={2} />
        <circle cx="132" cy="130" r="3.5" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function Emblem({
  kind,
  ...props
}: { kind: "eye" | "crown" | "hammerpen" | "gears" | "hammer" } & SVGProps<SVGSVGElement>) {
  if (kind === "eye") return <EyeA {...props} />;
  if (kind === "crown") return <CrownB {...props} />;
  if (kind === "hammer") return <HammerC {...props} />;
  if (kind === "gears") return <GearsC {...props} />;
  return <HammerPenEmblem {...props} />;
}
