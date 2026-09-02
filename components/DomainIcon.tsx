// components/DomainIcon.tsx — shared animated per-domain sigil, extracted from
// ResearchLoom.tsx so other pages (e.g. /tones) can render the exact same
// domain iconography instead of inventing their own.
"use client";
import { useId } from "react";

const ORB_DEFS = `<linearGradient id="UID-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity="0.95"/><stop offset="100%" stop-color="currentColor" stop-opacity="0.35"/></linearGradient><radialGradient id="UID-rad" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#fff" stop-opacity="0.9"/><stop offset="35%" stop-color="currentColor" stop-opacity="0.9"/><stop offset="100%" stop-color="currentColor" stop-opacity="0.15"/></radialGradient>`;

export const DOMAIN_ICON_KEYS = [
  "eastern-spirituality", "history", "psychology", "business",
  "creative-practice", "african-spirituality", "cross-domain", "behavioral-mechanics",
  "occult",
] as const;
export type DomainIconKey = (typeof DOMAIN_ICON_KEYS)[number];

export const ORB_ICONS: Record<string, string> = {
  "occult": `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><defs>${ORB_DEFS}</defs>
    <circle cx="20" cy="20" r="17" stroke-width="1.6" opacity="0.85"/>
    <circle class="cs-blink" cx="20" cy="20" r="12" fill="url(#UID-rad)" stroke="none"/>
    <g class="cs-spinC"><path d="M20 7 L27.6 30.5 L7.6 16 L32.4 16 L12.4 30.5Z" stroke-width="1.5"/></g>
    <circle class="cs-tw" cx="20" cy="7" r="1.6" fill="#fff"/></svg>`,

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

// Injected once per page that renders <DomainIcon>. Kept as a plain string
// (rather than a CSS module) so pages using dangerouslySetInnerHTML CSS blocks
// can simply prepend it.
export const DOMAIN_ICON_KEYFRAMES = `
.cs-orb-sym svg{width:100%;height:100%;display:block;overflow:visible;}
@keyframes corpusSymPulse{0%,100%{opacity:.96}50%{opacity:.74}}
@keyframes csSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes csBlink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.06)}}
@keyframes csFlick{0%{transform:scaleY(.92) skewX(-3deg)}100%{transform:scaleY(1.08) skewX(4deg)}}
@keyframes csTw{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes csSheen{0%,100%{opacity:0;transform:translateX(-10px)}45%{opacity:.9}60%{opacity:0;transform:translateX(12px)}}
@keyframes csBeat{0%,100%{transform:scale(1)}12%{transform:scale(1.07)}24%{transform:scale(1)}36%{transform:scale(1.05)}48%{transform:scale(1)}}
@keyframes csCur{0%,50%{opacity:1}51%,100%{opacity:0}}
@keyframes csTyp{0%{transform:scaleX(0)}30%,80%{transform:scaleX(1)}100%{transform:scaleX(0)}}
.cs-spinC{transform-box:fill-box;transform-origin:center;animation:csSpin 16s linear infinite}
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
@media (prefers-reduced-motion:reduce){[class^="cs-"],[class*=" cs-"]{animation:none !important}}
`;

/** The animated sigil for one domain, drawn in `color` via currentColor. */
export function DomainIcon({
  domainKey, color, className, style,
}: { domainKey: string; color: string; className?: string; style?: React.CSSProperties }) {
  const uid = "o" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const tpl = ORB_ICONS[domainKey] ?? ORB_ICONS["cross-domain"];
  const svg = tpl.replace(/UID/g, uid);
  return (
    <div
      className={`cs-orb-sym${className ? " " + className : ""}`}
      style={{
        color,
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: `drop-shadow(0 0 7px ${color}99)`,
        animation: "corpusSymPulse 3.2s ease-in-out infinite",
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
