// lib/domains.ts — the nine canonical vault domains: slug, display name, and
// accent color. Single source of truth so /tones, /research, and /essays
// always agree on what color and icon a given domain gets.
export type DomainKey =
  | "eastern-spirituality" | "history" | "psychology" | "behavioral-mechanics"
  | "business" | "creative-practice" | "cross-domain" | "african-spirituality"
  | "occult";

export const DOMAIN_LIST: { key: DomainKey; name: string; color: string }[] = [
  { key: "eastern-spirituality", name: "Eastern Spirituality", color: "#dc2626" },
  { key: "history", name: "History", color: "#e6c068" },
  { key: "psychology", name: "Psychology", color: "#f59e0b" },
  { key: "behavioral-mechanics", name: "Behavioral Mechanics", color: "#a78bfa" },
  { key: "business", name: "Business", color: "#e879a0" },
  { key: "creative-practice", name: "Creative Practice", color: "#14b8a6" },
  { key: "cross-domain", name: "Cross-Domain", color: "#38bdf8" },
  { key: "african-spirituality", name: "African Spirituality", color: "#34d399" },
  { key: "occult", name: "Occult", color: "#d95ae8" },
];

const BY_KEY = new Map(DOMAIN_LIST.map((d) => [d.key, d]));

export function domainColor(key: string): string {
  return BY_KEY.get(key as DomainKey)?.color ?? "#8a90a6";
}
export function domainName(key: string): string {
  return BY_KEY.get(key as DomainKey)?.name ?? key;
}
