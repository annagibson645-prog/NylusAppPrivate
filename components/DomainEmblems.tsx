// components/DomainEmblems.tsx
// One line-art emblem per knowledge domain — same visual language as the
// Council's per-seat emblems (currentColor, thin stroke, reads at huge size
// and low opacity). Used as the big decorative mark behind a hub-page hero.

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

function rays(count: number, r1: number, r2: number, altR2: number, cx = 100, cy = 100, opacity = 0.5) {
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const outer = i % 2 === 0 ? r2 : altR2;
        return (
          <line key={i}
            x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * outer} y2={cy + Math.sin(a) * outer}
            strokeWidth={1.3} />
        );
      })}
    </g>
  );
}

/* ─── Psychology — the labyrinth mind ─────────────────────────────────── */
export function PsychologyEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="100" cy="100" r="72" strokeWidth={2.2} />
      <path d="M100 100 m0 -46 a46 46 0 0 1 32 78 a32 32 0 0 1 -54 -10 a20 20 0 0 1 22 -30 a10 10 0 0 1 8 16"
        strokeWidth={1.8} opacity={0.85} />
      <circle cx="100" cy="100" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ─── History — the hourglass ──────────────────────────────────────────── */
export function HistoryEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <line x1="48" y1="36" x2="152" y2="36" strokeWidth={3} />
      <line x1="48" y1="164" x2="152" y2="164" strokeWidth={3} />
      <path d="M56 36 L144 36 L100 100 L144 164 L56 164 L100 100 Z" strokeWidth={2.2} />
      <circle cx="100" cy="112" r="2.4" fill="currentColor" stroke="none" opacity={0.75} />
      <circle cx="100" cy="122" r="1.8" fill="currentColor" stroke="none" opacity={0.5} />
      <circle cx="100" cy="130" r="1.3" fill="currentColor" stroke="none" opacity={0.35} />
      {rays(16, 96, 110, 104, 100, 100, 0.16)}
    </svg>
  );
}

/* ─── Behavioral Mechanics — the target ───────────────────────────────── */
export function BehavioralEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="100" cy="100" r="74" strokeWidth={2} />
      <circle cx="100" cy="100" r="50" strokeWidth={1.8} opacity={0.85} />
      <circle cx="100" cy="100" r="26" strokeWidth={1.8} opacity={0.7} />
      <circle cx="100" cy="100" r="4" fill="currentColor" stroke="none" />
      <line x1="100" y1="8" x2="100" y2="34" strokeWidth={2} />
      <line x1="100" y1="166" x2="100" y2="192" strokeWidth={2} />
      <line x1="8" y1="100" x2="34" y2="100" strokeWidth={2} />
      <line x1="166" y1="100" x2="192" y2="100" strokeWidth={2} />
    </svg>
  );
}

/* ─── Eastern Spirituality — the flame ─────────────────────────────────── */
export function EasternEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      {/* bowl / diya */}
      <path d="M52 134 Q100 160 148 134 L138 118 Q100 136 62 118 Z" strokeWidth={2.2} />
      {/* outer flame */}
      <path d="M100 112 C 82 96, 78 68, 100 36 C 122 68, 118 96, 100 112 Z" strokeWidth={2} />
      {/* inner flame */}
      <path d="M100 98 C 90 86, 88 70, 100 52 C 112 70, 110 86, 100 98 Z" strokeWidth={1.4} opacity={0.6} />
      {rays(18, 96, 112, 106, 100, 100, 0.16)}
      <circle cx="100" cy="100" r="86" strokeWidth={1} opacity={0.22} />
    </svg>
  );
}

/* ─── Cross-Domain — interlocking rings ───────────────────────────────── */
export function CrossDomainEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="78" cy="100" r="50" strokeWidth={2} />
      <circle cx="122" cy="100" r="50" strokeWidth={2} opacity={0.85} />
      {rays(20, 90, 98, 94, 100, 100, 0.2)}
    </svg>
  );
}

/* ─── Creative Practice — the pen nib ──────────────────────────────────── */
export function CreativeEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M100 34 L138 96 L100 168 L62 96 Z" strokeWidth={2.2} />
      <line x1="100" y1="60" x2="100" y2="140" strokeWidth={1.6} opacity={0.75} />
      <circle cx="100" cy="96" r="7" strokeWidth={1.6} opacity={0.8} />
      {rays(16, 100, 116, 110, 100, 100, 0.16)}
    </svg>
  );
}

/* ─── Business — ascending bars ───────────────────────────────────────── */
export function BusinessEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="100" cy="100" r="76" strokeWidth={1.6} opacity={0.4} />
      <line x1="56" y1="140" x2="56" y2="112" strokeWidth={3} />
      <line x1="84" y1="140" x2="84" y2="90" strokeWidth={3} />
      <line x1="112" y1="140" x2="112" y2="68" strokeWidth={3} />
      <line x1="140" y1="140" x2="140" y2="48" strokeWidth={3} />
      <path d="M56 108 L84 86 L112 64 L140 44" strokeWidth={1.6} opacity={0.75} />
      <path d="M124 44 L140 44 L140 60" strokeWidth={1.6} opacity={0.75} />
    </svg>
  );
}

/* ─── African Spirituality — the sunburst ─────────────────────────────── */
export function AfricanEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="100" cy="100" r="34" strokeWidth={2.2} />
      {rays(20, 40, 78, 68, 100, 100, 0.65)}
      <circle cx="100" cy="100" r="86" strokeWidth={1} opacity={0.25} />
    </svg>
  );
}

/* ─── Occult — the pentagram ──────────────────────────────────────────── */
export function OccultEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="100" cy="100" r="76" strokeWidth={2.2} />
      <circle cx="100" cy="100" r="66" strokeWidth={1} opacity={0.35} />
      <path d="M100 34 L138.8 153.4 L37.2 79.6 L162.8 79.6 L61.2 153.4 Z"
        strokeWidth={1.8} opacity={0.9} />
      {rays(20, 80, 92, 86, 100, 100, 0.18)}
    </svg>
  );
}

const MAP: Record<string, (p: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  "psychology":            PsychologyEmblem,
  "history":                HistoryEmblem,
  "behavioral-mechanics":   BehavioralEmblem,
  "eastern-spirituality":   EasternEmblem,
  "cross-domain":           CrossDomainEmblem,
  "creative-practice":      CreativeEmblem,
  "business":               BusinessEmblem,
  "african-spirituality":   AfricanEmblem,
  "occult":                 OccultEmblem,
};

export function DomainEmblem({ domain, ...props }: { domain: string } & SVGProps<SVGSVGElement>) {
  const Cmp = MAP[domain] ?? PsychologyEmblem;
  return <Cmp {...props} />;
}
